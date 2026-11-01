import * as Network from 'expo-network'
import type { ServerSettings } from './config'

/**
 * Expo Network reports Wi-Fi connectivity but does not expose the SSID.
 * Until a native SSID module is configured, never assume the network is
 * trusted; keep authenticated traffic on the configured HTTPS remote URL.
 */
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
  } catch {
    return false
  } finally {
    clearTimeout(timeout)
  }
}

export async function selectServer(config: ServerSettings): Promise<string> {
  if (config.localUrl && config.trustedSsids.length) {
    const ssid = await currentSsid()
    if (ssid && config.trustedSsids.includes(ssid) && await reachable(config.localUrl)) {
      return config.localUrl
    }
  }
  return config.remoteUrl
}
