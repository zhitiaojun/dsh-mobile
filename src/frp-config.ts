import { randomBytes } from 'node:crypto'
import { isIP } from 'node:net'
import { lstat, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { basename, dirname, isAbsolute, join, resolve } from 'node:path'
import { isGloballyRoutableIpv4 } from './network.js'
import { restrictPrivateFile } from './private-file.js'
import { createRestrictedFrpServerTemplate, FRP_VHOST_HTTP_PORT } from './frp-template.js'

const MAX_SETTINGS_BYTES = 8 * 1024

/**
 * Credentials and endpoints required by the restricted FRP provider.
 *
 * `kind` selects the transport dialect:
 *  - `self-hosted` addresses a private frps deployed by DSH Mobile (TOML, vhost + Caddy).
 *  - `chmlfrp` addresses the ChmlFrp shared platform, which runs a forked frps and a
 *    custom client that consumes the classic INI layout and authenticates with `user`
 *    (the per-tunnel account id) plus the shared platform `token`.
 */
export interface FrpSettings {
  readonly version: 1
  readonly kind: 'self-hosted'
  readonly serverAddress: string
  readonly serverPort: number
  readonly token: string
  readonly publicOrigin: string
}

/** ChmlFrp credentials copied from the panel's generated frpc.ini `[common]` block. */
export interface ChmlFrpSettings {
  readonly version: 1
  readonly kind: 'chmlfrp'
  readonly serverAddress: string
  readonly serverPort: number
  /** Per-user tunnel credential sent as `user` in the INI. */
  readonly user: string
  readonly token: string
  readonly publicOrigin: string
}

/** Any settings the FRP provider can run. */
export type FrpTransportSettings = FrpSettings | ChmlFrpSettings

/** Safe FRP configuration fields returned to the desktop UI. */
export interface FrpConfigurationStatus {
  readonly configured: boolean
  readonly kind?: 'self-hosted' | 'chmlfrp'
  readonly serverAddress?: string
  readonly serverPort?: number
  readonly publicOrigin?: string
  readonly vhostHttpPort: number
  readonly storagePath: string
  readonly errorCode?: string
}

function hostname(value: string): boolean {
  if (value.length > 253 || !value.includes('.')) return false
  return value.split('.').every(label => label.length >= 1 && label.length <= 63
    && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/u.test(label))
}

/** Validate the FRP server hostname or IP address. */
export function validateFrpServerAddress(value: unknown): string {
  if (typeof value !== 'string' || value !== value.trim() || value.length === 0 || value.length > 253
    || /[\s\u0000-\u001f\u007f/\\@?#]/u.test(value)) throw new Error('frp_server_address_invalid')
  const normalized = value.toLowerCase().replace(/\.$/u, '')
  if (isIP(normalized) === 0 && !hostname(normalized)) throw new Error('frp_server_address_invalid')
  return normalized
}

/** Validate the FRP control port. */
export function validateFrpServerPort(value: unknown): number {
  if (!Number.isSafeInteger(value) || Number(value) < 1 || Number(value) > 65_535) {
    throw new Error('frp_server_port_invalid')
  }
  return Number(value)
}

/**
 * Validate a high-entropy FRP token before durable storage.
 *
 * The self-hosted frps token must stay high entropy (>= 16 chars). ChmlFrp uses a
 * fixed platform-wide shared literal, so that transport passes a lower minimum.
 */
export function validateFrpToken(value: unknown, minimumLength = 16): string {
  if (typeof value !== 'string' || value.length < minimumLength || value.length > 512
    || /[\s\u0000-\u001f\u007f]/u.test(value)) throw new Error('frp_token_invalid')
  return value
}

/**
 * Validate the ChmlFrp per-tunnel `user` credential. The panel issues an opaque
 * 24-character alphanumeric id; accept a conservative superset so panel changes
 * do not break pairing while still rejecting anything shell- or INI-unsafe.
 */
export function validateChmlFrpUser(value: unknown): string {
  if (typeof value !== 'string' || value.length < 6 || value.length > 64
    || !/^[A-Za-z0-9_-]+$/u.test(value)) throw new Error('chmlfrp_user_invalid')
  return value
}

/**
 * Validate the public HTTPS origin used for pairing.
 *
 * A self-hosted VPS terminates TLS on 443 through Caddy, so a port is rejected.
 * ChmlFrp maps the custom domain on its own edge and only ever exposes 443, but
 * the settings may carry an explicit port from a future platform change, so the
 * `allowPort` switch lets that transport opt in without weakening the VPS rule.
 */
export function validateFrpPublicOrigin(value: unknown, allowPort = false): string {
  if (typeof value !== 'string' || value.length > 512) throw new Error('frp_public_origin_invalid')
  let url: URL
  try { url = new URL(value) } catch { throw new Error('frp_public_origin_invalid') }
  const publicHost = url.hostname
  if (url.protocol !== 'https:' || (!allowPort && url.port !== '') || url.pathname !== '/' || url.search !== ''
    || url.hash !== '' || url.username !== '' || url.password !== ''
    || (isIP(publicHost) !== 4 && !hostname(publicHost))) {
    throw new Error('frp_public_origin_invalid')
  }
  if (allowPort && url.port !== '' && url.port !== '443') throw new Error('frp_public_origin_invalid')
  // Documentation and other non-routable IPv4 literals (e.g. 203.0.113.10)
  // can never be a real VPS endpoint; reject them instead of deploying certs.
  if (isIP(publicHost) === 4 && !isGloballyRoutableIpv4(publicHost)) throw new Error('frp_public_origin_invalid')
  return url.origin
}

/** Parse self-hosted FRP settings at the loopback request and filesystem boundaries. */
export function parseFrpSettings(value: unknown): FrpSettings {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error('frp_settings_invalid')
  const record = value as Record<string, unknown>
  if (Reflect.ownKeys(record).some(key => !['version', 'kind', 'serverAddress', 'serverPort', 'token', 'publicOrigin'].includes(String(key)))) {
    throw new Error('frp_settings_invalid')
  }
  if (record.version !== undefined && record.version !== 1) throw new Error('frp_settings_invalid')
  if (record.kind !== undefined && record.kind !== 'self-hosted') throw new Error('frp_settings_invalid')
  return Object.freeze({
    version: 1,
    kind: 'self-hosted',
    serverAddress: validateFrpServerAddress(record.serverAddress),
    serverPort: validateFrpServerPort(record.serverPort),
    token: validateFrpToken(record.token),
    publicOrigin: validateFrpPublicOrigin(record.publicOrigin),
  })
}

/** Parse ChmlFrp settings copied from the panel-generated frpc.ini. */
export function parseChmlFrpSettings(value: unknown): ChmlFrpSettings {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error('chmlfrp_settings_invalid')
  const record = value as Record<string, unknown>
  if (Reflect.ownKeys(record).some(key => !['version', 'kind', 'serverAddress', 'serverPort', 'user', 'token', 'publicOrigin'].includes(String(key)))) {
    throw new Error('chmlfrp_settings_invalid')
  }
  if (record.version !== undefined && record.version !== 1) throw new Error('chmlfrp_settings_invalid')
  return Object.freeze({
    version: 1,
    kind: 'chmlfrp',
    serverAddress: validateFrpServerAddress(record.serverAddress),
    serverPort: validateFrpServerPort(record.serverPort),
    user: validateChmlFrpUser(record.user),
    // ChmlFrp ships a fixed shared literal rather than a per-user secret.
    token: validateFrpToken(record.token, 1),
    publicOrigin: validateFrpPublicOrigin(record.publicOrigin, true),
  })
}

/** Parse either supported FRP transport, dispatching on `kind`. */
export function parseFrpTransportSettings(value: unknown): FrpTransportSettings {
  const kind = typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>).kind
    : undefined
  return kind === 'chmlfrp' ? parseChmlFrpSettings(value) : parseFrpSettings(value)
}

/**
 * Merge a partial VPS request body with the saved configuration so a blank
 * field keeps its saved value ("已保存时可留空"). Every merged field is still
 * validated; with nothing saved and nothing supplied the result reports a
 * missing configuration instead of silently deploying blanks.
 */
export function mergeSavedFrpSettings(
  partial: Readonly<Record<string, unknown>>,
  saved: FrpSettings | undefined,
): FrpSettings {
  const merged = {
    serverAddress: partial.serverAddress === '' || partial.serverAddress === undefined
      ? saved?.serverAddress : partial.serverAddress,
    serverPort: typeof partial.serverPort === 'number' && Number.isSafeInteger(partial.serverPort) && partial.serverPort >= 1
      ? partial.serverPort : saved?.serverPort,
    token: partial.token === '' || partial.token === undefined ? saved?.token : partial.token,
    publicOrigin: partial.publicOrigin === '' || partial.publicOrigin === undefined
      ? saved?.publicOrigin : partial.publicOrigin,
  }
  if (merged.serverAddress === undefined && merged.serverPort === undefined
    && merged.token === undefined && merged.publicOrigin === undefined) {
    throw new Error('frp_config_missing')
  }
  return parseFrpSettings(merged)
}

/** Merge a VPS target (address and control port) with the saved configuration. */
export function mergeSavedFrpTarget(
  partial: Readonly<Record<string, unknown>>,
  saved: FrpSettings | undefined,
): { readonly serverAddress: string; readonly serverPort: number } {
  const serverAddress = partial.serverAddress === '' || partial.serverAddress === undefined
    ? saved?.serverAddress : partial.serverAddress
  const serverPort = typeof partial.serverPort === 'number' && Number.isSafeInteger(partial.serverPort) && partial.serverPort >= 1
    ? partial.serverPort : saved?.serverPort
  if (serverAddress === undefined || serverPort === undefined) throw new Error('frp_config_missing')
  return Object.freeze({
    serverAddress: validateFrpServerAddress(serverAddress),
    serverPort: validateFrpServerPort(serverPort),
  })
}

/**
 * Merge a partial ChmlFrp request body with the saved settings so a blank field
 * keeps its saved value. ChmlFrp has no VPS deployment step, so this is the only
 * write path for that transport.
 */
export function mergeSavedChmlFrpSettings(
  partial: Readonly<Record<string, unknown>>,
  saved: ChmlFrpSettings | undefined,
): ChmlFrpSettings {
  const merged = {
    kind: 'chmlfrp' as const,
    serverAddress: partial.serverAddress === '' || partial.serverAddress === undefined
      ? saved?.serverAddress : partial.serverAddress,
    serverPort: typeof partial.serverPort === 'number' && Number.isSafeInteger(partial.serverPort) && partial.serverPort >= 1
      ? partial.serverPort : saved?.serverPort,
    user: partial.user === '' || partial.user === undefined ? saved?.user : partial.user,
    token: partial.token === '' || partial.token === undefined ? saved?.token : partial.token,
    publicOrigin: partial.publicOrigin === '' || partial.publicOrigin === undefined
      ? saved?.publicOrigin : partial.publicOrigin,
  }
  if (merged.serverAddress === undefined && merged.serverPort === undefined && merged.user === undefined
    && merged.token === undefined && merged.publicOrigin === undefined) {
    throw new Error('frp_config_missing')
  }
  return parseChmlFrpSettings(merged)
}

function tomlString(value: string): string {
  return JSON.stringify(value)
}

/** Build the single-purpose frpc configuration for the current loopback gateway. */
export function createFrpcToml(settings: FrpSettings, localPort: number): string {
  if (!Number.isSafeInteger(localPort) || localPort < 1 || localPort > 65_535) throw new Error('frp_local_port_invalid')
  const hostnameValue = new URL(settings.publicOrigin).hostname
  return [
    `serverAddr = ${tomlString(settings.serverAddress)}`,
    `serverPort = ${String(settings.serverPort)}`,
    'auth.method = "token"',
    `auth.token = ${tomlString(settings.token)}`,
    'transport.tls.enable = true',
    '',
    '[[proxies]]',
    'name = "dsh-mobile"',
    'type = "http"',
    'localIP = "127.0.0.1"',
    `localPort = ${String(localPort)}`,
    `customDomains = [${tomlString(hostnameValue)}]`,
    'transport.useEncryption = true',
    'transport.useCompression = true',
    '',
  ].join('\n')
}

/** Build the matching restricted frps and Caddy templates for one VPS. */
export function createFrpServerTemplate(settings: FrpSettings): string {
  return createRestrictedFrpServerTemplate(settings.serverPort, settings.token, settings.publicOrigin)
}

/**
 * Override `local_port` in a ChmlFrp INI with the port the gateway actually bound.
 * The gateway picks an ephemeral port, so the panel's fixed `内网端口` cannot be
 * used verbatim; every other line the panel generated is preserved untouched.
 */
export function bindChmlFrpIniLocalPort(ini: string, localPort: number): string {
  if (!Number.isSafeInteger(localPort) || localPort < 1 || localPort > 65_535) throw new Error('frp_local_port_invalid')
  let replaced = false
  const lines = ini.split('\n').map(line => {
    if (/^\s*local_port\s*=/u.test(line)) {
      replaced = true
      return `local_port = ${String(localPort)}`
    }
    return line
  })
  if (!replaced) throw new Error('chmlfrp_ini_invalid')
  return lines.join('\n')
}

/** Build the classic INI configuration consumed by the ChmlFrp client fork.
 *
 * ChmlFrp's client is a modified frp 0.51.2 that reads `frpc.ini`. It does not
 * speak the upstream TOML schema, so the public origin's hostname becomes
 * `custom_domains` and the tunnel type follows the panel's HTTPS mapping.
 * `tls_enable` stays false: ChmlFrp terminates nothing, and the gateway behind
 * the tunnel already serves TLS end to end.
 */
export function createChmlFrpIni(settings: ChmlFrpSettings, localPort: number): string {
  if (!Number.isSafeInteger(localPort) || localPort < 1 || localPort > 65_535) throw new Error('frp_local_port_invalid')
  const hostnameValue = new URL(settings.publicOrigin).hostname
  return [
    '[common]',
    `server_addr = ${settings.serverAddress}`,
    `server_port = ${String(settings.serverPort)}`,
    'tls_enable = false',
    `user = ${settings.user}`,
    `token = ${settings.token}`,
    '',
    '[dsh_mobile]',
    'type = https',
    'local_ip = 127.0.0.1',
    `local_port = ${String(localPort)}`,
    `custom_domains = ${hostnameValue}`,
    '',
  ].join('\n')
}

/**
 * Parse a ChmlFrp `frpc.ini` pasted from the panel.
 *
 * The panel is the source of truth for the shared platform token and the tunnel
 * type, so accepting its INI verbatim avoids reimplementing ChmlFrp's private
 * config API. Only the fields this plugin needs are read, and the pasted text
 * is never written to disk.
 */
export function parseChmlFrpIni(text: unknown, expectedOrigin?: string): ChmlFrpSettings {
  if (typeof text !== 'string' || text.length === 0 || text.length > 8192) throw new Error('chmlfrp_ini_invalid')
  const common: Record<string, string> = {}
  let section = ''
  let domains: string | undefined
  for (const rawLine of text.split(/\r?\n/u)) {
    const line = rawLine.trim()
    if (line === '' || line.startsWith(';') || line.startsWith('#')) continue
    const header = /^\[([^\]]+)\]$/u.exec(line)
    if (header !== null) {
      const name = header[1]
      if (name === undefined) continue
      section = name.trim().toLowerCase()
      continue
    }
    const pair = /^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/u.exec(line)
    if (pair === null) continue
    const rawKey = pair[1]
    const rawValue = pair[2]
    if (rawKey === undefined || rawValue === undefined) continue
    const key = rawKey.toLowerCase()
    const value = rawValue.trim()
    if (section === 'common') common[key] = value
    else if (key === 'custom_domains' && domains === undefined) domains = value
  }
  const publicOrigin = expectedOrigin ?? (domains === undefined ? undefined : `https://${domains}`)
  return parseChmlFrpSettings({
    kind: 'chmlfrp',
    serverAddress: common.server_addr,
    serverPort: common.server_port === undefined ? undefined : Number(common.server_port),
    user: common.user,
    token: common.token,
    publicOrigin,
  })
}

async function atomicPrivateWrite(file: string, body: string): Promise<void> {
  const directory = dirname(file)
  await mkdir(directory, { recursive: true, mode: 0o700 })
  try {
    const current = await lstat(file)
    if (!current.isFile() || current.isSymbolicLink()) throw new Error('frp_config_target_invalid')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
  const temporary = join(directory, `.${basename(file)}.${randomBytes(12).toString('hex')}.tmp`)
  try {
    await writeFile(temporary, body, { encoding: 'utf8', flag: 'wx', mode: 0o600 })
    await rename(temporary, file)
    await restrictPrivateFile(file)
  } catch (error) {
    await rm(temporary, { force: true })
    throw error
  }
}

/** Owns private FRP settings and generation-specific frpc configuration. */
export class FrpConfigStore {
  readonly stateRoot: string
  readonly settingsFile: string
  /** Self-hosted TOML path; kept as the stable identifier for that transport. */
  readonly runtimeConfigFile: string
  /** ChmlFrp INI path. */
  readonly runtimeIniFile: string
  private settingsValue: FrpTransportSettings | undefined
  private errorCode: string | undefined

  constructor(stateDirectory: string) {
    if (!isAbsolute(stateDirectory)) throw new Error('frp config state directory must be absolute')
    this.stateRoot = resolve(stateDirectory)
    this.settingsFile = join(this.stateRoot, 'settings.json')
    this.runtimeConfigFile = join(this.stateRoot, 'frpc.toml')
    this.runtimeIniFile = join(this.stateRoot, 'frpc.ini')
  }

  /** Load private settings while rejecting links, oversized files, and unknown fields. */
  async initialize(): Promise<void> {
    let entry
    try { entry = await lstat(this.settingsFile) } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return
      throw error
    }
    if (!entry.isFile() || entry.isSymbolicLink() || entry.size > MAX_SETTINGS_BYTES) {
      this.errorCode = 'frp_config_invalid'
      return
    }
    await restrictPrivateFile(this.settingsFile)
    try {
      this.settingsValue = parseFrpTransportSettings(JSON.parse(await readFile(this.settingsFile, 'utf8')) as unknown)
      this.errorCode = undefined
    } catch {
      this.settingsValue = undefined
      this.errorCode = 'frp_config_invalid'
    }
  }

  /** Return configuration metadata without exposing the FRP token. */
  status(): FrpConfigurationStatus {
    const settings = this.settingsValue
    return Object.freeze({
      configured: settings !== undefined,
      ...(settings === undefined ? {} : {
        kind: settings.kind,
        serverAddress: settings.serverAddress,
        serverPort: settings.serverPort,
        publicOrigin: settings.publicOrigin,
      }),
      vhostHttpPort: FRP_VHOST_HTTP_PORT,
      storagePath: this.stateRoot,
      ...(this.errorCode === undefined ? {} : { errorCode: this.errorCode }),
    })
  }

  /** Return private settings only to the provider lifecycle. */
  settings(): FrpTransportSettings | undefined {
    return this.settingsValue
  }

  /** Narrow the saved settings to the self-hosted transport, when that is what is stored. */
  selfHostedSettings(): FrpSettings | undefined {
    const settings = this.settingsValue
    return settings?.kind === 'self-hosted' ? settings : undefined
  }

  /** Narrow the saved settings to ChmlFrp, when that is what is stored. */
  chmlFrpSettings(): ChmlFrpSettings | undefined {
    const settings = this.settingsValue
    return settings?.kind === 'chmlfrp' ? settings : undefined
  }

  /** Atomically replace private FRP settings with either transport. */
  async configure(value: unknown): Promise<FrpConfigurationStatus> {
    const settings = parseFrpTransportSettings(value)
    await atomicPrivateWrite(this.settingsFile, `${JSON.stringify(settings)}\n`)
    await Promise.all([
      rm(this.runtimeConfigFile, { force: true }),
      rm(this.runtimeIniFile, { force: true }),
    ])
    this.settingsValue = settings
    this.errorCode = undefined
    return this.status()
  }

  /**
   * Materialize the private generation-specific client configuration and return
   * the file the client should be launched with.
   */
  async writeRuntimeConfig(localPort: number): Promise<string> {
    const settings = this.settingsValue
    if (settings === undefined) throw new Error('frp_config_missing')
    if (settings.kind === 'chmlfrp') {
      // The gateway binds an ephemeral port while the panel records a fixed one,
      // so the generated INI must target the port the gateway actually owns.
      await atomicPrivateWrite(this.runtimeIniFile, bindChmlFrpIniLocalPort(createChmlFrpIni(settings, localPort), localPort))
      return this.runtimeIniFile
    }
    await atomicPrivateWrite(this.runtimeConfigFile, createFrpcToml(settings, localPort))
    return this.runtimeConfigFile
  }

  /** Remove only configuration files owned by the FRP provider. */
  async purge(): Promise<FrpConfigurationStatus> {
    await rm(this.stateRoot, { recursive: true, force: true })
    this.settingsValue = undefined
    this.errorCode = undefined
    return this.status()
  }

  /** Remove every generated client configuration owned by this store. */
  async removeRuntimeConfig(): Promise<void> {
    await Promise.all([
      rm(this.runtimeConfigFile, { force: true }),
      rm(this.runtimeIniFile, { force: true }),
    ])
  }
}

export { FRP_VHOST_HTTP_PORT as DEFAULT_VHOST_HTTP_PORT }
