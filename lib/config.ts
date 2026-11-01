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
  return url.origin + url.pathname.replace(/\/+$/, '')
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
  if (value.connectionMode === 'local' && !localUrl) throw new Error('Configure a local address')
  if (value.connectionMode === 'remote' && !remoteUrl) throw new Error('Configure a remote HTTPS address')
  await SecureStore.setItemAsync(KEY, JSON.stringify({
    remoteUrl, localUrl, connectionMode: value.connectionMode,
    trustedSsids: [...new Set(value.trustedSsids.map(s => s.trim()).filter(Boolean))],
  }))
}
