import * as Network from 'expo-network'
import type { ServerSettings } from './config'

/** SSID discovery is not implemented yet. Never trust a Wi-Fi network by guessing. */
async function currentSsid(): Promise<string | null> {
  const state = await Network.getNetworkStateAsync()
  if (!state.isConnected || state.type !== Network.NetworkStateType.WIFI) return null
  return null
}

async function reachable(baseUrl: string): Promise<boolean> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 2200)
  try {
    const response = await fetch(`${baseUrl}/health`, { signal: controller.signal, cache: 'no-store' })
    return response.ok
  } catch { return false }
  finally { clearTimeout(timeout) }
}

export async function selectServer(config: ServerSettings): Promise<string> {
  if (config.connectionMode === 'local') {
    if (!config.localUrl) throw new Error('Configure a local server address')
    return config.localUrl
  }
  if (config.connectionMode === 'remote') {
    if (!config.remoteUrl) throw new Error('Configure a remote HTTPS address')
    return config.remoteUrl
  }
  if (!config.remoteUrl && config.localUrl) return config.localUrl
  if (config.localUrl && config.trustedSsids.length) {
    const ssid = await currentSsid()
    if (ssid && config.trustedSsids.includes(ssid) && await reachable(config.localUrl)) return config.localUrl
  }
  if (!config.remoteUrl) throw new Error('Configure a server address in Settings')
  return config.remoteUrl
}
