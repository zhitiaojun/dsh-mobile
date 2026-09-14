import { createHash, randomBytes } from 'node:crypto'
import { execFile } from 'node:child_process'
import { chmod, lstat, mkdir, rename, rm, stat, writeFile } from 'node:fs/promises'
import { isAbsolute, join, relative, resolve } from 'node:path'

/** Pinned cloudflared release. Versioned URLs keep the hashes stable, unlike `latest`. */
export const CLOUDFLARED_VERSION = '2026.9.1'

/** Hosts a GitHub release redirect may legitimately land on. */
const GITHUB_HOSTS = ['github.com', 'githubusercontent.com'] as const

const MAX_LIST_BYTES = 256 * 1024

/** One pinned cloudflared artifact for a supported desktop target. */
export interface CloudflaredArtifact {
  readonly platform: NodeJS.Platform
  readonly arch: string
  readonly downloadUrl: string
  readonly downloadBytes: number
  readonly downloadSha256: string
  readonly executableName: string
  readonly allowedDownloadHosts: readonly string[]
}

function releaseUrl(file: string): string {
  return `https://github.com/cloudflare/cloudflared/releases/download/${CLOUDFLARED_VERSION}/${file}`
}

/**
 * Pinned cloudflared artifacts for the supported desktop targets.
 *
 * These use VERSIONED release URLs. `latest/download/...` is a rolling pointer, so
 * its bytes — and therefore the hash — change whenever Cloudflare ships a release,
 * and a pin there would reject the next download with no warning. Sizes and hashes
 * were recorded from the official assets for {@link CLOUDFLARED_VERSION}.
 *
 * `win32-arm64` is intentionally absent: Cloudflare publishes no Windows arm64
 * build for this release, so `supported` reports false on that target.
 */
export const CLOUDFLARED_RELEASES: Readonly<Record<string, CloudflaredArtifact>> = Object.freeze({
  'win32-x64': Object.freeze({
    platform: 'win32', arch: 'x64', executableName: 'cloudflared.exe',
    downloadBytes: 54_976_432,
    downloadSha256: '2837888cc0f5d58f15b6dc478376de90b4d3ba5241c7947455d1e0a0df429712',
    downloadUrl: releaseUrl('cloudflared-windows-amd64.exe'),
    allowedDownloadHosts: GITHUB_HOSTS,
  }),
  'linux-x64': Object.freeze({
    platform: 'linux', arch: 'x64', executableName: 'cloudflared',
    downloadBytes: 39_838_488,
    downloadSha256: '03f1f25d1cc93b9ad6c60569d44060bc4f17ed97075760ed8cfca4b12dcd68cc',
    downloadUrl: releaseUrl('cloudflared-linux-amd64'),
    allowedDownloadHosts: GITHUB_HOSTS,
  }),
  'linux-arm64': Object.freeze({
    platform: 'linux', arch: 'arm64', executableName: 'cloudflared',
    downloadBytes: 37_466_252,
    downloadSha256: '3d97437c71848bd8df68041e12436b484a661d95073ea1937f01a845ce88faa3',
    downloadUrl: releaseUrl('cloudflared-linux-arm64'),
    allowedDownloadHosts: GITHUB_HOSTS,
  }),
  'darwin-x64': Object.freeze({
    platform: 'darwin', arch: 'x64', executableName: 'cloudflared',
    downloadBytes: 21_073_920,
    downloadSha256: 'ff0d3b51d5ff70eceef89d6b32145fee985018a2174596a5dbe405e2766e2ac4',
    downloadUrl: releaseUrl('cloudflared-darwin-amd64.tgz'),
    allowedDownloadHosts: GITHUB_HOSTS,
  }),
  'darwin-arm64': Object.freeze({
    platform: 'darwin', arch: 'arm64', executableName: 'cloudflared',
    downloadBytes: 19_199_936,
    downloadSha256: 'c27ab8fd0aa489449e3d201eb02f957ef460a13b613662928b1b23394bf1bcfe',
    downloadUrl: releaseUrl('cloudflared-darwin-arm64.tgz'),
    allowedDownloadHosts: GITHUB_HOSTS,
  }),
})

/** Public, credential-free description of the managed cloudflared binary. */
export interface CloudflaredComponentStatus {
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

interface CloudflaredComponentOptions {
  readonly stateDirectory: string
  readonly platform?: NodeJS.Platform
  readonly arch?: string
  readonly fetchArtifact?: (artifact: CloudflaredArtifact, signal: AbortSignal) => Promise<Uint8Array>
  readonly inspectExecutable?: (executable: string) => Promise<string>
}

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

function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex')
}

function hostAllowed(hostname: string, allowed: readonly string[]): boolean {
  return allowed.some(host => hostname === host || hostname.endsWith(`.${host}`))
}

async function runCapture(file: string, args: readonly string[]): Promise<string> {
  return new Promise<string>((resolveRun, reject) => {
    execFile(file, [...args], {
      windowsHide: true,
      timeout: 60_000,
      maxBuffer: MAX_LIST_BYTES,
      encoding: 'utf8',
    }, (error, stdout) => {
      if (error === null) resolveRun(stdout)
      else reject(error)
    })
  })
}

async function defaultFetchArtifact(artifact: CloudflaredArtifact, signal: AbortSignal): Promise<Uint8Array> {
  const response = await fetch(artifact.downloadUrl, { redirect: 'follow', signal })
  if (!response.ok) throw new Error(`cloudflared_download_http_${String(response.status)}`)
  const finalUrl = new URL(response.url)
  if (finalUrl.protocol !== 'https:' || !hostAllowed(finalUrl.hostname, artifact.allowedDownloadHosts)) {
    throw new Error('cloudflared_download_origin_invalid')
  }
  const declaredLength = Number(response.headers.get('content-length'))
  if (Number.isFinite(declaredLength) && declaredLength !== 0 && declaredLength !== artifact.downloadBytes) {
    throw new Error('cloudflared_download_size_mismatch')
  }
  if (response.body === null) throw new Error('cloudflared_download_empty')
  const chunks: Uint8Array[] = []
  let received = 0
  const reader = response.body.getReader()
  while (true) {
    const result = await reader.read()
    if (result.done) break
    received += result.value.byteLength
    if (received > artifact.downloadBytes) {
      await reader.cancel()
      throw new Error('cloudflared_download_size_mismatch')
    }
    chunks.push(result.value)
  }
  if (received !== artifact.downloadBytes) throw new Error('cloudflared_download_size_mismatch')
  const bytes = new Uint8Array(received)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return bytes
}

/** `cloudflared --version` prints `cloudflared version <ver> (built …)`. */
export function parseCloudflaredVersion(output: string): string | undefined {
  return /cloudflared version\s+(\S+)/u.exec(output)?.[1]
}

async function defaultInspectExecutable(executable: string): Promise<string> {
  const output = await runCapture(executable, ['--version'])
  return parseCloudflaredVersion(output) ?? output.trim()
}

/** Owns the optional pinned cloudflared binary inside the DSH Mobile state directory. */
export class CloudflaredComponentManager {
  readonly executable: string
  readonly componentRoot: string
  readonly logRoot: string
  private readonly componentStorage: string
  private readonly stagingRoot: string
  private readonly artifact: CloudflaredArtifact | undefined
  private readonly fetchArtifact: (artifact: CloudflaredArtifact, signal: AbortSignal) => Promise<Uint8Array>
  private readonly inspectExecutable: (executable: string) => Promise<string>
  private installed = false
  private installedBytes = 0
  private version = ''
  private errorCode: string | undefined
  private queue: Promise<void> = Promise.resolve()

  constructor(options: CloudflaredComponentOptions) {
    const stateDirectory = resolve(options.stateDirectory)
    if (!isAbsolute(stateDirectory)) throw new Error('cloudflared state directory must be absolute')
    const platform = options.platform ?? process.platform
    const arch = options.arch ?? process.arch
    this.artifact = CLOUDFLARED_RELEASES[`${platform}-${arch}`]
    this.componentRoot = join(stateDirectory, 'components', 'cloudflared')
    this.componentStorage = join(this.componentRoot, CLOUDFLARED_VERSION)
    this.executable = join(this.componentStorage, platform === 'win32' ? 'cloudflared.exe' : 'cloudflared')
    this.logRoot = join(stateDirectory, 'logs', 'cloudflared')
    this.stagingRoot = join(stateDirectory, 'staging', 'cloudflared')
    for (const child of [this.componentRoot, this.componentStorage, this.logRoot, this.stagingRoot]) {
      if (!inside(stateDirectory, child)) throw new Error('cloudflared component path escaped its state directory')
    }
    this.fetchArtifact = options.fetchArtifact ?? defaultFetchArtifact
    this.inspectExecutable = options.inspectExecutable ?? defaultInspectExecutable
  }

  /** Inspect the managed binary without trusting a global installation. */
  async initialize(): Promise<void> {
    this.installed = await regularFile(this.executable)
    this.installedBytes = this.installed ? (await stat(this.executable)).size : 0
    if (!this.installed) return
    try {
      this.version = await this.inspectExecutable(this.executable)
      this.errorCode = undefined
    } catch {
      this.installed = false
      this.errorCode = 'cloudflared_component_invalid'
    }
  }

  /** Return component metadata without exposing configuration. */
  status(): CloudflaredComponentStatus {
    return Object.freeze({
      supported: this.artifact !== undefined,
      installed: this.installed,
      version: this.version,
      downloadBytes: this.artifact?.downloadBytes ?? 0,
      installedBytes: this.installedBytes,
      sourceUrl: this.artifact?.downloadUrl ?? 'https://github.com/cloudflare/cloudflared/releases',
      releasePage: `https://github.com/cloudflare/cloudflared/releases/tag/${CLOUDFLARED_VERSION}`,
      storagePath: this.componentRoot,
      ...(this.errorCode === undefined ? {} : { errorCode: this.errorCode }),
    })
  }

  /** Download, verify, and install the binary after explicit user confirmation. */
  install(): Promise<CloudflaredComponentStatus> {
    return this.enqueue(async () => {
      const artifact = this.artifact
      if (artifact === undefined) throw new Error('cloudflared_component_unsupported')
      await mkdir(this.stagingRoot, { recursive: true, mode: 0o700 })
      const staging = join(this.stagingRoot, `install-${randomBytes(12).toString('hex')}`)
      await mkdir(staging, { recursive: true, mode: 0o700 })
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => { controller.abort() }, 300_000)
        timeout.unref()
        let bytes: Uint8Array
        try { bytes = await this.fetchArtifact(artifact, controller.signal) } finally { clearTimeout(timeout) }
        if (bytes.byteLength !== artifact.downloadBytes) throw new Error('cloudflared_download_size_mismatch')
        if (sha256(bytes) !== artifact.downloadSha256) throw new Error('cloudflared_download_hash_mismatch')
        const candidate = join(staging, artifact.executableName)
        await writeFile(candidate, bytes, { flag: 'wx', mode: 0o700 })
        await chmod(candidate, 0o700)
        this.version = await this.inspectExecutable(candidate)
        await this.publish(candidate)
        this.installed = true
        this.installedBytes = (await stat(this.executable)).size
        this.errorCode = undefined
      } finally {
        await rm(staging, { recursive: true, force: true })
      }
    })
  }

  /** Replace the installed binary with a verified candidate. */
  private async publish(candidate: string): Promise<void> {
    await mkdir(this.componentStorage, { recursive: true, mode: 0o700 })
    const target = this.executable
    const backup = `${target}.previous-${randomBytes(12).toString('hex')}`
    let previous = false
    try {
      try { await rename(target, backup); previous = true } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
      }
      try {
        await rename(candidate, target)
      } catch (error) {
        if (previous) {
          try { await rename(backup, target) } catch (restoreError) {
            throw new AggregateError([error, restoreError], 'cloudflared_component_replace_failed')
          }
        }
        throw error
      }
      if (previous) await rm(backup, { force: true })
    } finally {
      await chmod(target, 0o700).catch(() => undefined)
    }
  }

  /** Remove this component's executable and staging files. */
  purge(): Promise<CloudflaredComponentStatus> {
    return this.enqueue(async () => {
      await Promise.all([
        rm(this.componentStorage, { recursive: true, force: true }),
        rm(this.stagingRoot, { recursive: true, force: true }),
      ])
      this.installed = false
      this.installedBytes = 0
      this.version = ''
      this.errorCode = undefined
    })
  }

  private enqueue(operation: () => Promise<void>): Promise<CloudflaredComponentStatus> {
    const task = this.queue.then(operation, operation)
    this.queue = task.then(() => undefined, () => undefined)
    return task.then(() => this.status())
  }
}
