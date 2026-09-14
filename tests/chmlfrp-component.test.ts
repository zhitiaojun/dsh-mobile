import { describe, expect, it } from 'vitest'
import { CHMLFRP_COMPONENT_RELEASES, CHMLFRP_VERSION } from '../src/frp-component.js'

/**
 * Regression guard: the pinned metadata must describe URLs that actually exist.
 *
 * A double `ChmlFrp-` prefix once shipped here because `CHMLFRP_VERSION` already
 * carries the prefix while the URL template added it again. Every byte-size and
 * hash assertion still passed, because those were checked against a separately
 * written filename, so only the download failed at runtime with HTTP 404.
 */
describe('ChmlFrp component pins', () => {
  const entries = Object.entries(CHMLFRP_COMPONENT_RELEASES)

  it('covers all supported desktop targets', () => {
    expect(entries.map(([key]) => key).sort()).toEqual([
      'darwin-arm64', 'darwin-x64', 'linux-arm64', 'linux-x64', 'win32-arm64', 'win32-x64',
    ])
  })

  it('never repeats the version prefix inside a download URL', () => {
    expect(CHMLFRP_VERSION.startsWith('ChmlFrp-')).toBe(true)
    for (const [key, artifact] of entries) {
      const occurrences = artifact.downloadUrl.split('ChmlFrp-').length - 1
      expect(occurrences, `${key}: ${artifact.downloadUrl}`).toBe(1)
      // The filename must be exactly the pinned release name plus its suffix.
      expect(artifact.downloadUrl.startsWith(`https://cf-v1.uapis.cn/download/${CHMLFRP_VERSION}`), key).toBe(true)
    }
  })

  it('pins a positive size, a full sha256, and the provider host', () => {
    for (const [key, artifact] of entries) {
      expect(artifact.downloadBytes, key).toBeGreaterThan(0)
      expect(artifact.downloadSha256, key).toMatch(/^[a-f0-9]{64}$/u)
      // Mirrors FrpComponentManager's hostAllowed(): exact host or a subdomain.
      const host = new URL(artifact.downloadUrl).hostname
      const permitted = artifact.allowedDownloadHosts.some(allowed => host === allowed || host.endsWith(`.${allowed}`))
      expect(permitted, `${key}: ${host} not covered by ${artifact.allowedDownloadHosts.join(',')}`).toBe(true)
    }
  })

  it('marks ChmlFrp archives as root-level executables', () => {
    for (const [key, artifact] of entries) {
      // The official ChmlFrp zips place frpc(.exe) at the archive root.
      expect(artifact.nestedExecutable, key).toBe(false)
    }
  })
})
