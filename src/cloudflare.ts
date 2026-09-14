import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { lstat } from 'node:fs/promises'
import { isAbsolute } from 'node:path'
import type { MobileAccessControlStore } from './control.js'
import type { MobileAccessGateway } from './gateway.js'
import { settleRemoteResources, terminateRemoteProcess, type RemoteProviderController, type RemoteProviderStatus } from './remote.js'

/**
 * A quick tunnel's hostname is newly created and may not resolve everywhere at
 * once. The generic 45 s used by the other transports is too tight for that DNS
 * propagation, so this transport waits longer before giving up.
 */
const START_TIMEOUT_MS = 150_000
const DISCOVERY_REQUEST_TIMEOUT_MS = 5_000
const DISCOVERY_RETRY_MS = 1_000
const MAX_DISCOVERY_BYTES = 16 * 1024
const QUICK_TUNNEL_URL = /https:\/\/([a-z0-9-]+\.trycloudflare\.com)/iu
/**
 * Throwaway origin used only to reserve a loopback port. The gateway is rebuilt
 * against the real tunnel origin on that same port once cloudflared announces it.
 * `.invalid` is reserved by RFC 2606, so it can never collide with a real host.
 */
const GATEWAY_PLACEHOLDER_ORIGIN = 'https://port-reservation.invalid'

/** Product-facing states for the Cloudflare quick-tunnel transport. */
export type CloudflareState = 'off' | 'unavailable' | 'starting' | 'connecting' | 'ready' | 'error'

/** Safe state returned only through the loopback DSH control route. */
export interface CloudflareStatus extends RemoteProviderStatus {}

/** Inputs for one managed cloudflared quick tunnel and its DSH gateway. */
export interface CloudflareControllerOptions {
  readonly store: MobileAccessControlStore
  readonly executable: string
  readonly instanceId: string
  readonly createGateway: (origin: string, listenPort?: number) => Promise<MobileAccessGateway>
  readonly onStatus?: (status: CloudflareStatus) => void
  /**
   * Called when the tunnel announced a hostname but discovery never succeeded.
   * The last probe failure is forwarded purely for diagnostics, since a silent
   * retry loop hides whether DNS or the gateway is at fault.
   */
  readonly onDiscoveryFailure?: (origin: string, lastFailure: string | undefined) => void
  readonly launchClient?: (executable: string, listenPort: number) => ChildProcessWithoutNullStreams
  readonly probeDiscovery?: (origin: string, expectedInstanceId: string, signal: AbortSignal) => Promise<boolean>
  readonly startTimeoutMs?: number
  readonly retryIntervalMs?: number
}

function publicStatus(status: CloudflareStatus): CloudflareStatus {
  return Object.freeze({
    enabled: status.enabled,
    state: status.state,
    ...(status.origin === undefined ? {} : { origin: status.origin }),
    ...(status.errorCode === undefined ? {} : { errorCode: status.errorCode }),
  })
}

/** Extract the quick-tunnel public origin from one line of cloudflared output. */
export function parseQuickTunnelOrigin(line: string): string | undefined {
  const hostname = QUICK_TUNNEL_URL.exec(line)?.[1]
  return hostname === undefined ? undefined : `https://${hostname.toLowerCase()}`
}

function defaultLaunchClient(executable: string, listenPort: number): ChildProcessWithoutNullStreams {
  return spawn(executable, ['tunnel', '--no-autoupdate', '--url', `http://127.0.0.1:${String(listenPort)}`], {
    shell: false,
    windowsHide: true,
    stdio: ['pipe', 'pipe', 'pipe'],
  })
}

async function boundedResponseBytes(response: Response): Promise<Uint8Array> {
  if (response.body === null) throw new Error('cloudflare_discovery_invalid')
  const declaredLength = Number(response.headers.get('content-length'))
  if (Number.isFinite(declaredLength) && declaredLength > MAX_DISCOVERY_BYTES) throw new Error('cloudflare_discovery_invalid')
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let received = 0
  while (true) {
    const result = await reader.read()
    if (result.done) break
    received += result.value.byteLength
    if (received > MAX_DISCOVERY_BYTES) {
      await reader.cancel()
      throw new Error('cloudflare_discovery_invalid')
    }
    chunks.push(result.value)
  }
  const bytes = new Uint8Array(received)
  let offset = 0
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength }
  return bytes
}

async function defaultProbeDiscovery(origin: string, expectedInstanceId: string, signal: AbortSignal): Promise<boolean> {
  const controller = new AbortController()
  const abort = (): void => { controller.abort() }
  signal.addEventListener('abort', abort, { once: true })
  const timeout = setTimeout(abort, DISCOVERY_REQUEST_TIMEOUT_MS)
  timeout.unref()
  try {
    const response = await fetch(`${origin}/mobile-access/discovery`, {
      method: 'GET',
      redirect: 'error',
      cache: 'no-store',
      signal: controller.signal,
      headers: { accept: 'application/json' },
    })
    if (!response.ok) return false
    let value: unknown
    try { value = JSON.parse(new TextDecoder().decode(await boundedResponseBytes(response))) as unknown } catch {
      throw new Error('cloudflare_discovery_invalid')
    }
    if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error('cloudflare_discovery_invalid')
    const actual = (value as Record<string, unknown>).instanceId
    if (typeof actual !== 'string') throw new Error('cloudflare_discovery_invalid')
    if (actual !== expectedInstanceId) throw new Error('cloudflare_discovery_mismatch')
    return true
  } finally {
    clearTimeout(timeout)
    signal.removeEventListener('abort', abort)
  }
}

/**
 * Cloudflare quick-tunnel transport for the DSH gateway.
 *
 * A quick tunnel is the only supported remote transport that needs no account, no
 * own domain and no server: cloudflared dials out to Cloudflare's edge and the
 * public hostname is assigned at runtime. Two properties make it fit this gateway
 * without any special casing:
 *
 * - Cloudflare terminates TLS on 443, so the loopback listener stays plaintext and
 *   the public origin is a portless HTTPS URL — exactly what the gateway expects.
 * - cloudflared forwards the original Host header, so the request carries the
 *   tunnel hostname, which the gateway accepts because its authority derives from
 *   the same public origin.
 *
 * The hostname is therefore only known after cloudflared announces it, which is why
 * the gateway is created after the announcement rather than before.
 */
export class CloudflareController implements RemoteProviderController {
  private enabled = false
  private initialized = false
  private disposed = false
  private child: ChildProcessWithoutNullStreams | undefined
  private gatewayValue: MobileAccessGateway | undefined
  private generation = 0
  private latest: CloudflareStatus = publicStatus({ enabled: false, state: 'off' })
  private queue: Promise<void> = Promise.resolve()
  private startupAbort: AbortController | undefined

  constructor(private readonly options: CloudflareControllerOptions) {
    if (!isAbsolute(options.executable)) throw new Error('cloudflared executable path must be absolute')
  }

  /** Restore the remembered switch. A quick tunnel never resumes its old hostname. */
  async initialize(): Promise<void> {
    const state = await this.options.store.load()
    this.enabled = state.enabled
    this.initialized = true
    if (this.enabled) await this.start()
    else this.publish({ enabled: false, state: 'off' })
  }

  gateway(): MobileAccessGateway | undefined {
    return this.gatewayValue
  }

  status(): CloudflareStatus {
    return publicStatus(this.latest)
  }

  async setEnabled(enabled: boolean): Promise<CloudflareStatus> {
    if (!this.initialized || this.disposed) throw new Error('Cloudflare controller is unavailable')
    await this.enqueue(async () => {
      // A quick tunnel always needs a fresh hostname, so enabling never reuses one.
      if (this.enabled === enabled && enabled === false) return
      this.enabled = enabled
      await this.options.store.save({ version: 1, enabled })
      if (enabled) await this.start()
      else this.publish({ enabled: false, state: 'off' })
    })
    return this.status()
  }

  async reconnect(): Promise<CloudflareStatus> {
    if (!this.initialized || this.disposed) throw new Error('Cloudflare controller is unavailable')
    await this.enqueue(async () => {
      this.enabled = true
      await this.options.store.save({ version: 1, enabled: true })
      await this.stop()
      await this.start()
    })
    return this.status()
  }

  async reset(): Promise<CloudflareStatus> {
    if (!this.initialized || this.disposed) throw new Error('Cloudflare controller is unavailable')
    await this.enqueue(async () => {
      await this.stop()
      this.enabled = false
      await this.options.store.save({ version: 1, enabled: false })
      this.publish({ enabled: false, state: 'off' })
    })
    return this.status()
  }

  async close(): Promise<void> {
    if (this.disposed) return
    this.disposed = true
    await this.enqueue(() => this.stop())
  }

  private enqueue(operation: () => Promise<void>): Promise<void> {
    const task = this.queue.then(operation, operation)
    this.queue = task.then(() => undefined, () => undefined)
    return task
  }

  private publish(status: CloudflareStatus): void {
    this.latest = publicStatus(status)
    try { this.options.onStatus?.(this.status()) } catch { /* UI observation cannot own runtime state. */ }
  }

  private async start(): Promise<void> {
    const generation = ++this.generation
    let entry
    try { entry = await lstat(this.options.executable) } catch {
      this.publish({ enabled: true, state: 'unavailable', errorCode: 'cloudflare_component_missing' })
      return
    }
    if (!entry.isFile() || entry.isSymbolicLink()) {
      this.publish({ enabled: true, state: 'unavailable', errorCode: 'cloudflare_component_invalid' })
      return
    }
    this.publish({ enabled: true, state: 'starting' })

    // Order matters and is the whole trick of this transport:
    //
    //   1. Reserve a loopback port by starting a gateway bound to it. Its authority
    //      is still unknown, so a placeholder origin is used purely to obtain a port.
    //   2. Point cloudflared at that reserved port and wait for the hostname.
    //   3. Rebuild the gateway on the SAME port with the announced origin, so its
    //      trust policy accepts the tunnel hostname that cloudflared will forward.
    let reserved: MobileAccessGateway
    try {
      reserved = await this.options.createGateway(GATEWAY_PLACEHOLDER_ORIGIN)
    } catch {
      this.publish({ enabled: true, state: 'error', errorCode: 'gateway_start_failed' })
      return
    }
    const listenPort = reserved.address().port
    await reserved.close()
    if (generation !== this.generation || !this.enabled) return

    let child: ChildProcessWithoutNullStreams
    try {
      child = (this.options.launchClient ?? defaultLaunchClient)(this.options.executable, listenPort)
    } catch {
      this.publish({ enabled: true, state: 'error', errorCode: 'cloudflare_launch_failed' })
      return
    }
    this.child = child

    const announced = new Promise<string | undefined>(resolveOrigin => {
      let settled = false
      const finish = (value: string | undefined): void => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        resolveOrigin(value)
      }
      const inspect = (chunk: Buffer): void => {
        const found = parseQuickTunnelOrigin(chunk.toString('utf8'))
        if (found !== undefined) finish(found)
      }
      // cloudflared prints the assigned quick-tunnel URL on stderr.
      child.stderr.on('data', inspect)
      child.stdout.on('data', inspect)
      child.once('error', () => finish(undefined))
      child.once('close', () => finish(undefined))
      const timer = setTimeout(() => finish(undefined), this.options.startTimeoutMs ?? START_TIMEOUT_MS)
      timer.unref()
    })

    const origin = await announced
    if (generation !== this.generation || !this.enabled) return
    if (origin === undefined) {
      await this.failGeneration(generation, 'cloudflare_start_timeout')
      return
    }

    let resolved: MobileAccessGateway
    try {
      resolved = await this.options.createGateway(origin, listenPort)
    } catch {
      await this.failGeneration(generation, 'gateway_start_failed')
      return
    }
    if (generation !== this.generation || !this.enabled) {
      await resolved.close()
      return
    }
    this.gatewayValue = resolved

    child.once('error', () => { void this.enqueue(() => this.failGeneration(generation, 'cloudflare_launch_failed')) })
    child.once('close', code => {
      if (generation !== this.generation || this.child !== child) return
      this.child = undefined
      if (this.enabled) void this.enqueue(() => this.failGeneration(generation, code === 0 ? 'cloudflare_stopped' : 'cloudflare_exited'))
    })

    this.publish({ enabled: true, state: 'connecting', origin })
    const controller = new AbortController()
    this.startupAbort = controller
    void this.waitForDiscovery(generation, origin, controller.signal)
  }

  private async waitForDiscovery(generation: number, origin: string, signal: AbortSignal): Promise<void> {
    const deadline = Date.now() + (this.options.startTimeoutMs ?? START_TIMEOUT_MS)
    const probe = this.options.probeDiscovery ?? defaultProbeDiscovery
    const instanceId = this.options.instanceId
    let lastFailure: string | undefined
    while (!signal.aborted && Date.now() < deadline) {
      try {
        if (await probe(origin, instanceId, signal)) {
          await this.enqueue(async () => {
            if (generation !== this.generation || signal.aborted || !this.enabled) return
            this.startupAbort = undefined
            this.publish({ enabled: true, state: 'ready', origin })
          })
          return
        }
        lastFailure = 'probe returned not-ok'
      } catch (error) {
        if (signal.aborted) return
        const message = error instanceof Error ? error.message : String(error)
        if (message === 'cloudflare_discovery_mismatch' || message === 'cloudflare_discovery_invalid') {
          await this.enqueue(() => this.failGeneration(generation, message))
          return
        }
        // A freshly assigned quick-tunnel hostname is not resolvable everywhere at
        // once, so network failures are expected for a while. Record the last one
        // rather than swallowing it: a silent retry loop makes a real
        // misconfiguration indistinguishable from slow DNS.
        lastFailure = message
      }
      await new Promise<void>(resolveWait => {
        let finished = false
        const finish = (): void => {
          if (finished) return
          finished = true
          clearTimeout(timer)
          signal.removeEventListener('abort', finish)
          resolveWait()
        }
        const timer = setTimeout(finish, this.options.retryIntervalMs ?? DISCOVERY_RETRY_MS)
        timer.unref()
        signal.addEventListener('abort', finish, { once: true })
      })
    }
    if (!signal.aborted) {
      this.options.onDiscoveryFailure?.(origin, lastFailure)
      await this.enqueue(() => this.failGeneration(generation, 'cloudflare_start_timeout'))
    }
  }

  private async failGeneration(generation: number, code: string): Promise<void> {
    if (generation !== this.generation) return
    await this.stop()
    if (this.enabled) this.publish({ enabled: true, state: 'error', errorCode: code })
  }

  private async stop(): Promise<void> {
    ++this.generation
    await this.stopProcessAndGateway()
  }

  private async stopProcessAndGateway(): Promise<void> {
    this.startupAbort?.abort()
    this.startupAbort = undefined
    const child = this.child
    this.child = undefined
    const gateway = this.gatewayValue
    this.gatewayValue = undefined
    await settleRemoteResources([
      () => child !== undefined && child.exitCode === null ? terminateRemoteProcess(child) : undefined,
      () => gateway?.close(),
    ], 'Cloudflare resource cleanup failed')
  }
}
