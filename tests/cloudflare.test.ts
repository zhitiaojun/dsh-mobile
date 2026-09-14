import { EventEmitter } from 'node:events'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { CLOUDFLARED_RELEASES, CLOUDFLARED_VERSION, parseCloudflaredVersion } from '../src/cloudflared-component.js'
import { CloudflareController, parseQuickTunnelOrigin } from '../src/cloudflare.js'

const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map(dir => rm(dir, { recursive: true, force: true })))
})

/** Minimal stand-in for the cloudflared child. */
class SilentChild extends EventEmitter {
  exitCode: number | null = null
  signalCode: NodeJS.Signals | null = null
  readonly stdout = new EventEmitter()
  readonly stderr = new EventEmitter()
  kill(): boolean { this.exitCode = 0; this.emit('close', 0); return true }
  /** Announce a hostname once listeners are attached, like the real banner does. */
  announceSoon(url: string): void {
    setImmediate(() => { this.stderr.emit('data', Buffer.from(`INF |  ${url}  |`)) })
  }
}

describe('Cloudflare transport parsing', () => {
  it('reads the quick-tunnel origin out of a real cloudflared banner line', () => {
    const line = '2026-09-14T06:05:25Z INF |  https://hours-referral-overcome-provinces.trycloudflare.com                               |'
    expect(parseQuickTunnelOrigin(line)).toBe('https://hours-referral-overcome-provinces.trycloudflare.com')
  })

  it('normalizes case and accepts a bare URL', () => {
    expect(parseQuickTunnelOrigin('https://AbC-Def.trycloudflare.com')).toBe('https://abc-def.trycloudflare.com')
  })

  it('never mistakes a named tunnel or unrelated line for a quick tunnel', () => {
    expect(parseQuickTunnelOrigin('INF Registered tunnel connection connIndex=0')).toBeUndefined()
    // A named tunnel host must not be accepted here.
    expect(parseQuickTunnelOrigin('https://dsh.example.com')).toBeUndefined()
    expect(parseQuickTunnelOrigin('')).toBeUndefined()
  })

  it('extracts the version from cloudflared --version output', () => {
    expect(parseCloudflaredVersion('cloudflared version 2026.9.1 (built 2026-09-10T13:52 UTC)')).toBe('2026.9.1')
    expect(parseCloudflaredVersion('nonsense')).toBeUndefined()
  })
})

describe('cloudflared component pins', () => {
  const entries = Object.entries(CLOUDFLARED_RELEASES)
  it('covers every target Cloudflare publishes for this release', () => {
    expect(entries.map(([key]) => key).sort()).toEqual([
      'darwin-arm64', 'darwin-x64', 'linux-arm64', 'linux-x64', 'win32-x64',
    ])
  })

  it('pins versioned URLs so a Cloudflare release cannot silently break the hash', () => {
    for (const [key, artifact] of entries) {
      // `latest/download/...` is a rolling pointer; the hash recorded here would go
      // stale on the next Cloudflare release.
      expect(artifact.downloadUrl, key).not.toContain('/latest/')
      expect(artifact.downloadUrl, key).toContain(`/download/${CLOUDFLARED_VERSION}/`)
    }
  })

  it('pins a real size, a full sha256, and the release host', () => {
    for (const [key, artifact] of entries) {
      expect(artifact.downloadBytes, key).toBeGreaterThan(0)
      expect(artifact.downloadSha256, key).toMatch(/^[a-f0-9]{64}$/u)
      expect(artifact.downloadSha256, key).not.toMatch(/^0+$/u)
      const host = new URL(artifact.downloadUrl).hostname
      const permitted = artifact.allowedDownloadHosts.some(allowed => host === allowed || host.endsWith(`.${allowed}`))
      expect(permitted, `${key}: ${host}`).toBe(true)
    }
  })
})

describe('discovery retry pacing', () => {
  /**
   * Regression guard. Polling at a fixed one-second interval across the whole start
   * window queues well over a hundred DNS lookups. Node resolves DNS on a four-thread
   * libuv pool, so slow lookups for a brand-new tunnel hostname can occupy every
   * thread and stall unrelated work in the DSH process — which presented as the
   * entire UI hanging, not just this panel.
   */
  it('makes far fewer attempts than a fixed one-second poll would', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'cf-backoff-'))
    temporaryDirectories.push(dir)
    // start() refuses to run without an installed binary, so give it a real file.
    const executable = join(dir, 'cloudflared.exe')
    await writeFile(executable, 'stub', { mode: 0o700 })
    let attempts = 0
    const windowMs = 400
    const child = new SilentChild()
    const controller = new CloudflareController({
      store: { load: async () => ({ version: 1, enabled: false }), save: async () => undefined },
      executable,
      instanceId: 'd'.repeat(64),
      createGateway: async () =>
        ({ address: () => ({ host: '127.0.0.1', port: 39_003, origin: 'http://127.0.0.1:39003' }), close: async () => undefined }) as never,
      // Announce immediately so the probe loop is what fills the window, which is the
      // behaviour under test. Without an announcement the window is spent waiting.
      launchClient: () => { child.announceSoon('https://pacing-test.trycloudflare.com'); return child as never },
      probeDiscovery: async () => { attempts += 1; return false },
      startTimeoutMs: windowMs,
      retryIntervalMs: 100,
    })
    await controller.initialize()
    const startedAt = Date.now()
    await controller.setEnabled(true)
    // Discovery is a background task (like the FRP transport), so setEnabled returns
    // before it finishes. Poll for the settle rather than sleeping a fixed amount: the
    // loop only notices the deadline when its current wait resolves, and a fixed sleep
    // makes this flaky under load.
    const settleDeadline = Date.now() + windowMs + 3_000
    while (controller.status().state !== 'error' && Date.now() < settleDeadline) {
      await new Promise(resolve => setTimeout(resolve, 25))
    }
    const elapsed = Date.now() - startedAt

    // A fixed 100 ms poll over a 400 ms window would attempt about four times;
    // doubling from 100 ms means roughly two.
    expect(attempts).toBeGreaterThanOrEqual(2)
    expect(attempts).toBeLessThanOrEqual(3)
    expect(elapsed).toBeGreaterThanOrEqual(windowMs)
    expect(controller.status().state).toBe('error')
    await controller.close()
  })
})
