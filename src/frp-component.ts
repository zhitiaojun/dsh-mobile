import { createHash, randomBytes } from 'node:crypto'
import { execFile } from 'node:child_process'
import {
  chmod,
  copyFile,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises'
import { basename, isAbsolute, join, relative, resolve } from 'node:path'

const FRP_VERSION = '0.70.1'
/** ChmlFrp ships a forked frp 0.51.2; its client reports this exact string for --version. */
export const CHMLFRP_VERSION = 'ChmlFrp-0.51.2_251023'
const MAX_ARCHIVE_ENTRIES = 128
const MAX_ARCHIVE_LIST_BYTES = 256 * 1024

/** Which FRP client family a managed component owns. */
export type FrpComponentVariant = 'self-hosted' | 'chmlfrp'

interface FrpArtifact {
  readonly platform: NodeJS.Platform
  readonly arch: string
  readonly downloadUrl: string
  readonly downloadBytes: number
  readonly downloadSha256: string
  readonly archiveName: string
  readonly executableName: string
  /** Hosts allowed as the final redirect target. */
  readonly allowedDownloadHosts: readonly string[]
  /** Some provider archives place the executable at the archive root. */
  readonly nestedExecutable: boolean
}

const GITHUB_HOSTS = ['github.com', 'githubusercontent.com'] as const
const CHMLFRP_HOSTS = ['uapis.cn'] as const

const releases = [
  {
    platform: 'win32', arch: 'x64', archiveName: 'frp.zip', executableName: 'frpc.exe',
    downloadBytes: 13_924_309,
    downloadSha256: '531f3cd3cc41c0b4f077b54fe6b7dd83c0ff727e7f0bf412a4c78fa279165de5',
    downloadUrl: `https://github.com/fatedier/frp/releases/download/v${FRP_VERSION}/frp_${FRP_VERSION}_windows_amd64.zip`,
    allowedDownloadHosts: GITHUB_HOSTS, nestedExecutable: true,
  },
  {
    platform: 'win32', arch: 'arm64', archiveName: 'frp.zip', executableName: 'frpc.exe',
    downloadBytes: 12_204_751,
    downloadSha256: '74d3acaf0f03ee190dd0462f9b49861dca50b0559c5488af4b36572fc951fcca',
    downloadUrl: `https://github.com/fatedier/frp/releases/download/v${FRP_VERSION}/frp_${FRP_VERSION}_windows_arm64.zip`,
    allowedDownloadHosts: GITHUB_HOSTS, nestedExecutable: true,
  },
  {
    platform: 'linux', arch: 'x64', archiveName: 'frp.tar.gz', executableName: 'frpc',
    downloadBytes: 13_924_042,
    downloadSha256: '333da23d1b9009d7c01638e9ba38cf4600f7d37d393f854e96ee1396adefa9a6',
    downloadUrl: `https://github.com/fatedier/frp/releases/download/v${FRP_VERSION}/frp_${FRP_VERSION}_linux_amd64.tar.gz`,
    allowedDownloadHosts: GITHUB_HOSTS, nestedExecutable: true,
  },
  {
    platform: 'linux', arch: 'arm64', archiveName: 'frp.tar.gz', executableName: 'frpc',
    downloadBytes: 12_371_290,
    downloadSha256: '3990f396a9a490ee7f0e5f355287750ed41520064ed999eab443b5e9a78d773d',
    downloadUrl: `https://github.com/fatedier/frp/releases/download/v${FRP_VERSION}/frp_${FRP_VERSION}_linux_arm64.tar.gz`,
    allowedDownloadHosts: GITHUB_HOSTS, nestedExecutable: true,
  },
  {
    platform: 'darwin', arch: 'x64', archiveName: 'frp.tar.gz', executableName: 'frpc',
    downloadBytes: 13_951_979,
    downloadSha256: 'cbf69cf26e5553e914e97d37f5d4367fa30f5f531d073a889465af4719281e25',
    downloadUrl: `https://github.com/fatedier/frp/releases/download/v${FRP_VERSION}/frp_${FRP_VERSION}_darwin_amd64.tar.gz`,
    allowedDownloadHosts: GITHUB_HOSTS, nestedExecutable: true,
  },
  {
    platform: 'darwin', arch: 'arm64', archiveName: 'frp.tar.gz', executableName: 'frpc',
    downloadBytes: 12_670_664,
    downloadSha256: 'cfa733b5a261c1647edee3c1fc4133d2542989b28f5602e81d47fc821d25c55f',
    downloadUrl: `https://github.com/fatedier/frp/releases/download/v${FRP_VERSION}/frp_${FRP_VERSION}_darwin_arm64.tar.gz`,
    allowedDownloadHosts: GITHUB_HOSTS, nestedExecutable: true,
  },
] as const satisfies readonly FrpArtifact[]

const CHMLFRP_ARTIFACT_BASE = 'https://cf-v1.uapis.cn/download'

/**
 * Pinned ChmlFrp client artifacts. Host, byte size and SHA-256 are recorded from
 * the official download page and verified before anything is executed. The zips
 * place `frpc.exe` at the archive root instead of nesting it, so these entries set
 * `nestedExecutable: false`.
 *
 * NOTE: `CHMLFRP_VERSION` already carries the `ChmlFrp-` prefix, so the URL
 * template must not repeat it.
 */
const chmlfrpReleases = [
  {
    platform: 'win32', arch: 'x64', archiveName: 'chmlfrp.zip', executableName: 'frpc.exe',
    downloadBytes: 5_621_859,
    downloadSha256: 'cdbdec6be0300023c5107650197788f0ec417d4cfdea920ca4c148467102b7e6',
    downloadUrl: `${CHMLFRP_ARTIFACT_BASE}/${CHMLFRP_VERSION}_2_windows_amd64.zip`,
    allowedDownloadHosts: CHMLFRP_HOSTS, nestedExecutable: false,
  },
  {
    platform: 'win32', arch: 'arm64', archiveName: 'chmlfrp.zip', executableName: 'frpc.exe',
    downloadBytes: 5_067_955,
    downloadSha256: 'c0330afa4429924d071d60c4197a48bcd426526de8c2b09058be20295a657f7e',
    downloadUrl: `${CHMLFRP_ARTIFACT_BASE}/${CHMLFRP_VERSION}_2_windows_arm64.zip`,
    allowedDownloadHosts: CHMLFRP_HOSTS, nestedExecutable: false,
  },
  {
    platform: 'linux', arch: 'x64', archiveName: 'chmlfrp.tar.gz', executableName: 'frpc',
    downloadBytes: 12_063_513,
    downloadSha256: 'e1a83d0cf7b7bf69d04610f2c0ba952e8185e377a3ef889921def52f03b4e4a6',
    downloadUrl: `${CHMLFRP_ARTIFACT_BASE}/${CHMLFRP_VERSION}_linux_amd64.tar.gz`,
    allowedDownloadHosts: CHMLFRP_HOSTS, nestedExecutable: false,
  },
  {
    platform: 'linux', arch: 'arm64', archiveName: 'chmlfrp.tar.gz', executableName: 'frpc',
    downloadBytes: 10_922_270,
    downloadSha256: '2e1973aafabc6b7b2371ecdc679d6a0931753a137bc0ccc5d8b5f2ca4b17a253',
    downloadUrl: `${CHMLFRP_ARTIFACT_BASE}/${CHMLFRP_VERSION}_linux_arm64.tar.gz`,
    allowedDownloadHosts: CHMLFRP_HOSTS, nestedExecutable: false,
  },
  {
    platform: 'darwin', arch: 'x64', archiveName: 'chmlfrp.tar.gz', executableName: 'frpc',
    downloadBytes: 12_579_704,
    downloadSha256: '23229fc02104cceb0d1483fd3fa053f9dae8e8b0725a8df5e9f09094541bbe53',
    downloadUrl: `${CHMLFRP_ARTIFACT_BASE}/${CHMLFRP_VERSION}_darwin_amd64.tar.gz`,
    allowedDownloadHosts: CHMLFRP_HOSTS, nestedExecutable: false,
  },
  {
    platform: 'darwin', arch: 'arm64', archiveName: 'chmlfrp.tar.gz', executableName: 'frpc',
    downloadBytes: 11_997_609,
    downloadSha256: '541319d1324df135e0f21cb93bcd5b1231e62be4b22a5ca4d9831d04c2476417',
    downloadUrl: `${CHMLFRP_ARTIFACT_BASE}/${CHMLFRP_VERSION}_darwin_arm64.tar.gz`,
    allowedDownloadHosts: CHMLFRP_HOSTS, nestedExecutable: false,
  },
] as const satisfies readonly FrpArtifact[]

function indexReleases(entries: readonly FrpArtifact[]): Readonly<Record<string, FrpArtifact>> {
  return Object.freeze(Object.fromEntries(
    entries.map(release => [`${release.platform}-${release.arch}`, Object.freeze(release)]),
  ))
}

/** Pinned official FRP release metadata for supported desktop targets. */
export const FRP_COMPONENT_RELEASES: Readonly<Record<string, FrpArtifact>> = indexReleases(releases)

/** Pinned ChmlFrp client release metadata for supported desktop targets. */
export const CHMLFRP_COMPONENT_RELEASES: Readonly<Record<string, FrpArtifact>> = indexReleases(chmlfrpReleases)

/** Public, credential-free description of the managed FRP client. */
export interface FrpComponentStatus {
  readonly variant: FrpComponentVariant
  readonly supported: boolean
  readonly installed: boolean
  readonly version: string
  readonly downloadBytes: number
  readonly installedBytes: number
  readonly sourceUrl: string
  readonly releasePage: string
  readonly storagePath: string
  readonly errorCode?: string
}

interface FrpComponentManagerOptions {
  readonly stateDirectory: string
  readonly variant?: FrpComponentVariant
  readonly platform?: NodeJS.Platform
  readonly arch?: string
  readonly fetchArtifact?: (artifact: FrpArtifact, signal: AbortSignal) => Promise<Uint8Array>
  readonly extractArtifact?: (archive: string, destination: string, executableName: string) => Promise<void>
  readonly inspectExecutable?: (executable: string) => Promise<string>
}

/** Immutable per-variant wiring for the managed client. */
interface FrpVariantProfile {
  readonly releases: Readonly<Record<string, FrpArtifact>>
  readonly version: string
  readonly releasePage: string
  /** Directory name under components/frp. */
  readonly directory: string
  readonly sourceFallbackUrl: string
}

const VARIANT_PROFILES: Readonly<Record<FrpComponentVariant, FrpVariantProfile>> = Object.freeze({
  'self-hosted': Object.freeze({
    releases: FRP_COMPONENT_RELEASES,
    version: FRP_VERSION,
    releasePage: `https://github.com/fatedier/frp/releases/tag/v${FRP_VERSION}`,
    directory: FRP_VERSION,
    sourceFallbackUrl: 'https://github.com/fatedier/frp/releases',
  }),
  'chmlfrp': Object.freeze({
    releases: CHMLFRP_COMPONENT_RELEASES,
    version: CHMLFRP_VERSION,
    releasePage: 'https://panel.chmlfrp.net/tunnel/download',
    directory: CHMLFRP_VERSION,
    sourceFallbackUrl: `${CHMLFRP_ARTIFACT_BASE}/`,
  }),
})

function inside(parent: string, child: string): boolean {
  const candidate = relative(parent, child)
  return candidate !== '' && !candidate.startsWith('..') && !isAbsolute(candidate)
}

async function regularFile(file: string): Promise<boolean> {
  try {
    const entry = await lstat(file)
    return entry.isFile() && !entry.isSymbolicLink()
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false
    throw error
  }
}

async function replaceDirectory(target: string, candidate: string): Promise<void> {
  const backup = `${target}.previous-${randomBytes(12).toString('hex')}`
  let previous = false
  try {
    try {
      await rename(target, backup)
      previous = true
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    }
    try {
      await rename(candidate, target)
    } catch (error) {
      if (previous) {
        try { await rename(backup, target) } catch (restoreError) {
          throw new AggregateError([error, restoreError], 'frp_component_replace_failed')
        }
      }
      throw error
    }
    if (previous) await rm(backup, { recursive: true, force: true })
  } finally {
    await rm(candidate, { recursive: true, force: true })
  }
}

function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex')
}

async function runCapture(file: string, args: readonly string[]): Promise<string> {
  return new Promise<string>((resolveRun, reject) => {
    execFile(file, [...args], {
      windowsHide: true,
      timeout: 120_000,
      maxBuffer: MAX_ARCHIVE_LIST_BYTES,
      encoding: 'utf8',
    }, (error, stdout) => {
      if (error === null) resolveRun(stdout)
      else reject(error)
    })
  })
}

function validatedArchiveEntry(rawEntry: string): readonly string[] {
  if (rawEntry.length === 0 || rawEntry.includes('\\') || rawEntry.includes('\u0000')
    || rawEntry.startsWith('/') || /^[a-zA-Z]:/u.test(rawEntry)) {
    throw new Error('frp_archive_path_invalid')
  }
  const segments = rawEntry.replace(/\/$/u, '').split('/')
  if (segments.some(segment => segment === '' || segment === '.' || segment === '..')) {
    throw new Error('frp_archive_path_invalid')
  }
  return segments
}

/** Select exactly one nested frpc executable from a safe archive listing. */
export function selectFrpExecutableEntry(entries: readonly string[], executableName: string): string {
  if (entries.length === 0 || entries.length > MAX_ARCHIVE_ENTRIES) throw new Error('frp_archive_entries_invalid')
  let executableEntry: string | undefined
  for (const entry of entries) {
    const segments = validatedArchiveEntry(entry)
    if (segments.length >= 2 && segments.at(-1) === executableName) {
      if (executableEntry !== undefined) throw new Error('frp_archive_executable_ambiguous')
      executableEntry = entry.replace(/\/$/u, '')
    }
  }
  if (executableEntry === undefined) throw new Error('frp_archive_executable_missing')
  return executableEntry
}

async function defaultExtractArtifact(archive: string, destination: string, executableName: string): Promise<void> {
  const tar = process.platform === 'win32' ? 'tar.exe' : 'tar'
  const listing = await runCapture(tar, ['-tf', archive])
  const entries = listing.split(/\r?\n/u).filter(entry => entry.length > 0)
  const executableEntry = selectFrpExecutableEntry(entries, executableName)
  const unpacked = join(destination, 'archive')
  await mkdir(unpacked, { recursive: true, mode: 0o700 })
  await runCapture(tar, ['-xf', archive, '-C', unpacked, executableEntry])
  const extracted = join(unpacked, ...validatedArchiveEntry(executableEntry))
  if (!await regularFile(extracted)) throw new Error('frp_archive_executable_invalid')
  await copyFile(extracted, join(destination, executableName))
}

/**
 * Select the executable when the provider archive keeps it at the archive root.
 * Validates every entry with the same path rules as the nested selector so a
 * hostile archive cannot escape the staging directory.
 */
export function selectRootExecutableEntry(entries: readonly string[], executableName: string): string {
  if (entries.length === 0 || entries.length > MAX_ARCHIVE_ENTRIES) throw new Error('frp_archive_entries_invalid')
  let executableEntry: string | undefined
  for (const entry of entries) {
    const segments = validatedArchiveEntry(entry)
    if (segments.length !== 1 || segments[0] !== executableName) continue
    if (executableEntry !== undefined) throw new Error('frp_archive_executable_ambiguous')
    executableEntry = segments[0]
  }
  if (executableEntry === undefined) throw new Error('frp_archive_executable_missing')
  return executableEntry
}

/** Extract a provider archive whose executable sits at the archive root. */
async function rootExtractArtifact(archive: string, destination: string, executableName: string): Promise<void> {
  const tar = process.platform === 'win32' ? 'tar.exe' : 'tar'
  const listing = await runCapture(tar, ['-tf', archive])
  const entries = listing.split(/\r?\n/u).filter(entry => entry.length > 0)
  const executableEntry = selectRootExecutableEntry(entries, executableName)
  const unpacked = join(destination, 'archive')
  await mkdir(unpacked, { recursive: true, mode: 0o700 })
  await runCapture(tar, ['-xf', archive, '-C', unpacked, executableEntry])
  const extracted = join(unpacked, executableEntry)
  if (!await regularFile(extracted)) throw new Error('frp_archive_executable_invalid')
  await copyFile(extracted, join(destination, executableName))
}

function hostAllowed(hostname: string, allowed: readonly string[]): boolean {
  return allowed.some(host => hostname === host || hostname.endsWith(`.${host}`))
}

async function defaultFetchArtifact(artifact: FrpArtifact, signal: AbortSignal): Promise<Uint8Array> {
  const response = await fetch(artifact.downloadUrl, { redirect: 'follow', signal })
  if (!response.ok) throw new Error(`frp_download_http_${String(response.status)}`)
  const finalUrl = new URL(response.url)
  // Pin the redirect target to the provider's own hosts so a hijacked redirect
  // cannot swap in a foreign binary that still hashes as "expected".
  if (finalUrl.protocol !== 'https:' || !hostAllowed(finalUrl.hostname, artifact.allowedDownloadHosts)) {
    throw new Error('frp_download_origin_invalid')
  }
  const lengthHeader = response.headers.get('content-length')
  const declaredLength = lengthHeader === null ? undefined : Number(lengthHeader)
  if (declaredLength !== undefined && (!Number.isFinite(declaredLength) || declaredLength !== artifact.downloadBytes)) {
    throw new Error('frp_download_size_mismatch')
  }
  if (response.body === null) throw new Error('frp_download_empty')
  const chunks: Uint8Array[] = []
  let received = 0
  const reader = response.body.getReader()
  while (true) {
    const result = await reader.read()
    if (result.done) break
    received += result.value.byteLength
    if (received > artifact.downloadBytes) {
      await reader.cancel()
      throw new Error('frp_download_size_mismatch')
    }
    chunks.push(result.value)
  }
  if (received !== artifact.downloadBytes) throw new Error('frp_download_size_mismatch')
  const bytes = new Uint8Array(received)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return bytes
}

async function defaultInspectExecutable(executable: string): Promise<string> {
  return (await runCapture(executable, ['--version'])).trim()
}

/** Owns one optional FRP client binary inside the DSH Mobile state directory. */
export class FrpComponentManager {
  readonly executable: string
  readonly componentRoot: string
  readonly componentStorage: string
  readonly logRoot: string
  readonly variant: FrpComponentVariant
  private readonly profile: FrpVariantProfile
  private readonly stagingRoot: string
  private readonly artifact: FrpArtifact | undefined
  private readonly fetchArtifact: (artifact: FrpArtifact, signal: AbortSignal) => Promise<Uint8Array>
  private readonly extractArtifact: (archive: string, destination: string, executableName: string) => Promise<void>
  private readonly inspectExecutable: (executable: string) => Promise<string>
  private installed = false
  private installedBytes = 0
  private errorCode: string | undefined
  private queue: Promise<void> = Promise.resolve()

  constructor(options: FrpComponentManagerOptions) {
    const stateDirectory = resolve(options.stateDirectory)
    if (!isAbsolute(stateDirectory)) throw new Error('frp state directory must be absolute')
    const platform = options.platform ?? process.platform
    const arch = options.arch ?? process.arch
    this.variant = options.variant ?? 'self-hosted'
    const profile = VARIANT_PROFILES[this.variant]
    this.profile = profile
    this.artifact = profile.releases[`${platform}-${arch}`]
    this.componentRoot = join(stateDirectory, 'components', 'frp')
    this.componentStorage = join(this.componentRoot, profile.directory)
    this.executable = join(this.componentStorage, platform === 'win32' ? 'frpc.exe' : 'frpc')
    this.logRoot = join(stateDirectory, 'logs', 'frp')
    this.stagingRoot = join(stateDirectory, 'staging', 'frp')
    for (const child of [this.componentRoot, this.componentStorage, this.logRoot, this.stagingRoot]) {
      if (!inside(stateDirectory, child)) throw new Error('frp component path escaped its state directory')
    }
    this.fetchArtifact = options.fetchArtifact ?? defaultFetchArtifact
    // Provider archives differ in layout; pick the extractor that matches the pin.
    this.extractArtifact = options.extractArtifact
      ?? (this.artifact?.nestedExecutable === false ? rootExtractArtifact : defaultExtractArtifact)
    this.inspectExecutable = options.inspectExecutable ?? defaultInspectExecutable
  }

  /** Inspect the managed executable without relying on global FRP installations. */
  async initialize(): Promise<void> {
    this.installed = await regularFile(this.executable)
    this.installedBytes = this.installed ? (await stat(this.executable)).size : 0
    if (this.installed) {
      try {
        const version = await this.inspectExecutable(this.executable)
        if (version !== this.profile.version) throw new Error('frp_component_version_mismatch')
        this.errorCode = undefined
      } catch {
        this.installed = false
        this.errorCode = 'frp_component_invalid'
      }
    }
  }

  /** Return component metadata without exposing configuration or credentials. */
  status(): FrpComponentStatus {
    return Object.freeze({
      variant: this.variant,
      supported: this.artifact !== undefined,
      installed: this.installed,
      version: this.profile.version,
      downloadBytes: this.artifact?.downloadBytes ?? 0,
      installedBytes: this.installedBytes,
      sourceUrl: this.artifact?.downloadUrl ?? this.profile.sourceFallbackUrl,
      releasePage: this.profile.releasePage,
      storagePath: this.componentRoot,
      ...(this.errorCode === undefined ? {} : { errorCode: this.errorCode }),
    })
  }

  /** Download, verify, and extract only the client after explicit confirmation. */
  install(): Promise<FrpComponentStatus> {
    return this.enqueue(async () => {
      const artifact = this.artifact
      if (artifact === undefined) throw new Error('frp_component_unsupported')
      await mkdir(this.stagingRoot, { recursive: true, mode: 0o700 })
      const staging = await mkdtemp(join(this.stagingRoot, 'install-'))
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => { controller.abort() }, 120_000)
        timeout.unref()
        let bytes: Uint8Array
        try { bytes = await this.fetchArtifact(artifact, controller.signal) } finally { clearTimeout(timeout) }
        if (bytes.byteLength !== artifact.downloadBytes) throw new Error('frp_download_size_mismatch')
        if (sha256(bytes) !== artifact.downloadSha256) throw new Error('frp_download_hash_mismatch')
        const archive = join(staging, artifact.archiveName)
        await writeFile(archive, bytes, { flag: 'wx', mode: 0o600 })
        await this.extractArtifact(archive, staging, artifact.executableName)
        const extracted = join(staging, artifact.executableName)
        if (!await regularFile(extracted)) throw new Error('frp_executable_missing')
        await chmod(extracted, 0o700)
        const version = await this.inspectExecutable(extracted)
        if (version !== this.profile.version) throw new Error('frp_component_version_mismatch')
        const candidate = join(this.componentRoot, `.install-${randomBytes(12).toString('hex')}`)
        await mkdir(candidate, { recursive: true, mode: 0o700 })
        const candidateExecutable = join(candidate, artifact.executableName)
        await copyFile(extracted, candidateExecutable)
        await chmod(candidateExecutable, 0o700)
        await replaceDirectory(this.componentStorage, candidate)
        this.installed = true
        this.installedBytes = (await stat(this.executable)).size
        this.errorCode = undefined
      } finally {
        await rm(staging, { recursive: true, force: true })
      }
    })
  }

  /** Remove this variant's executable plus its staging files. */
  purge(): Promise<FrpComponentStatus> {
    return this.enqueue(async () => {
      await Promise.all([
        // Only this variant's install directory: the other transport may still be in use.
        rm(this.componentStorage, { recursive: true, force: true }),
        rm(this.stagingRoot, { recursive: true, force: true }),
      ])
      this.installed = false
      this.installedBytes = 0
      this.errorCode = undefined
    })
  }

  private enqueue(operation: () => Promise<void>): Promise<FrpComponentStatus> {
    const task = this.queue.then(operation, operation)
    this.queue = task.then(() => undefined, () => undefined)
    return task.then(() => this.status())
  }
}
