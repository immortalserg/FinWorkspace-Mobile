import * as SecureStore from 'expo-secure-store'

export type ConnectionMode = 'auto' | 'local' | 'remote'
export type ServerSettings = {
  remoteUrl: string
  localUrl: string
  trustedSsids: string[]
  connectionMode: ConnectionMode
}
const KEY = 'finworkspace.server.v1'

export function normalizeBaseUrl(input: string): string {
  const url = new URL(input.trim())
  if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Only HTTP(S) is supported')
  if (url.username || url.password || url.search || url.hash) throw new Error('Use a server origin, not a URL with credentials, query or hash')
  assertSafeServerUrl(url.href)
  return url.origin + url.pathname.replace(/\/+$/, '')
}

/** HTTP is allowed only for loopback or RFC1918 IPv4 literals. */
export function assertSafeServerUrl(input: string): void {
  const url = new URL(input)
  if (url.protocol === 'https:') return
  if (url.protocol !== 'http:') throw new Error('Only HTTP(S) is supported')
  const host = url.hostname.toLowerCase()
  if (host === 'localhost' || host === '127.0.0.1' || host === '[::1]') return
  const octets = host.split('.')
  if (octets.length !== 4 || octets.some(x => !/^(0|[1-9][0-9]{0,2})$/.test(x) || Number(x) > 255)) {
    throw new Error('HTTP is permitted only for private IPv4 addresses; use HTTPS for domains and public servers')
  }
  const [a,b] = octets.map(Number)
  if (!(a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168))) {
    throw new Error('Public server addresses must use HTTPS')
  }
}

export async function loadServerSettings(): Promise<ServerSettings> {
  const defaults: ServerSettings = { remoteUrl: '', localUrl: '', trustedSsids: [], connectionMode: 'auto' }
  const saved = await SecureStore.getItemAsync(KEY)
  if (!saved) return defaults
  try {
    const data = JSON.parse(saved) as Partial<ServerSettings>
    return {
      remoteUrl: typeof data.remoteUrl === 'string' ? data.remoteUrl : '',
      localUrl: typeof data.localUrl === 'string' ? data.localUrl : '',
      trustedSsids: Array.isArray(data.trustedSsids) ? data.trustedSsids.filter((s): s is string => typeof s === 'string') : [],
      connectionMode: data.connectionMode === 'local' || data.connectionMode === 'remote' ? data.connectionMode : 'auto',
    }
  } catch { return defaults }
}

export async function saveServerSettings(value: ServerSettings): Promise<void> {
  const remoteUrl = value.remoteUrl.trim() ? normalizeBaseUrl(value.remoteUrl) : ''
  const localUrl = value.localUrl.trim() ? normalizeBaseUrl(value.localUrl) : ''
  if (!remoteUrl && !localUrl) throw new Error('Configure at least one server address')
  if (remoteUrl && !remoteUrl.startsWith('https:')) throw new Error('Remote address must use HTTPS')
  if (localUrl && new URL(localUrl).protocol === 'http:') assertSafeServerUrl(localUrl)
  if (value.connectionMode === 'local' && !localUrl) throw new Error('Configure a local address')
  if (value.connectionMode === 'remote' && !remoteUrl) throw new Error('Configure a remote HTTPS address')
  await SecureStore.setItemAsync(KEY, JSON.stringify({
    remoteUrl, localUrl, connectionMode: value.connectionMode,
    trustedSsids: [...new Set(value.trustedSsids.map(s => s.trim()).filter(Boolean))],
  }))
}
