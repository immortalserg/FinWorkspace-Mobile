import { useCallback, useEffect, useRef, useState } from 'react'
import { useFocusEffect, router } from 'expo-router'
import { ActivityIndicator, BackHandler, Pressable, StyleSheet, Text, View } from 'react-native'
import { WebView } from 'react-native-webview'
import { loadServerSettings } from '../lib/config'
import { selectServer } from '../lib/connection'

export default function Home() {
  const webview = useRef<WebView>(null)
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [canGoBack, setCanGoBack] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useFocusEffect(useCallback(() => {
    let active = true
    setError('')
    loadServerSettings().then(async settings => {
      if (!settings.localUrl && !settings.remoteUrl) {
        if (active) { setUrl(''); router.replace('/settings') }
        return
      }
      const selected = await selectServer(settings)
      if (active) setUrl(selected)
    }).catch(e => { if (active) setError(e instanceof Error ? e.message : 'Cannot select server') })
    return () => { active = false }
  }, []))

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack && webview.current) { webview.current.goBack(); return true }
      return false
    })
    return () => subscription.remove()
  }, [canGoBack])

  if (error || !url) return <View style={styles.center}>
    <Text style={styles.message}>{error || 'Configure your FinWorkspace server'}</Text>
    <Pressable style={styles.button} onPress={() => router.push('/settings')}><Text style={styles.buttonText}>Server settings</Text></Pressable>
  </View>

  return <View style={styles.root}>
    <WebView
      key={`${url}:${reloadKey}`}
      ref={webview}
      source={{ uri: url }}
      javaScriptEnabled
      domStorageEnabled
      sharedCookiesEnabled
      thirdPartyCookiesEnabled={false}
      mixedContentMode="never"
      originWhitelist={['http://*', 'https://*']}
      startInLoadingState
      renderLoading={() => <View style={styles.center}><ActivityIndicator size="large" /></View>}
      onNavigationStateChange={state => setCanGoBack(state.canGoBack)}
      onError={event => setError(event.nativeEvent.description || 'Cannot load server')}
      onHttpError={event => { if (event.nativeEvent.statusCode >= 500) setError(`Server error ${event.nativeEvent.statusCode}`) }}
      allowsBackForwardNavigationGestures
    />
    <View style={styles.toolbar}>
      <Pressable onPress={() => router.push('/settings')}><Text style={styles.toolText}>Settings</Text></Pressable>
      <Text numberOfLines={1} style={styles.address}>{url}</Text>
      <Pressable onPress={() => { setError(''); setReloadKey(n => n + 1) }}><Text style={styles.toolText}>Reload</Text></Pressable>
    </View>
  </View>
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#f4f8fb' },
  message: { color: '#334155', marginBottom: 20, textAlign: 'center' },
  button: { backgroundColor: '#145b94', borderRadius: 10, padding: 14 },
  buttonText: { color: '#fff', fontWeight: '700' },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#102d4b', gap: 12 },
  toolText: { color: '#fff', fontWeight: '700' },
  address: { color: '#cbd5e1', fontSize: 11, flex: 1, textAlign: 'center' },
})
