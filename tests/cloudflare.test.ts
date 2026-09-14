import { describe, expect, it } from 'vitest'
import { CLOUDFLARED_RELEASES, CLOUDFLARED_VERSION, parseCloudflaredVersion } from '../src/cloudflared-component.js'
import { parseQuickTunnelOrigin } from '../src/cloudflare.js'

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
