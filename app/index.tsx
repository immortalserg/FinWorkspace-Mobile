import { useCallback, useEffect, useRef, useState } from 'react'
import { useFocusEffect, router } from 'expo-router'
import { ActivityIndicator, BackHandler, PanResponder, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { WebView } from 'react-native-webview'
import { apiGet, createMobileWebSession, signIn } from '../lib/api'
import { loadServerSettings } from '../lib/config'
import { selectServer } from '../lib/connection'
import { clearTokens, getTokens } from '../lib/session'

type CurrentUser = { email: string; full_name: string | null }

export default function Home() {
  const webview = useRef<WebView>(null)
  const [entry, setEntry] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [canGoBack, setCanGoBack] = useState(false)

  const openWeb = useCallback(async () => {
    const code = await createMobileWebSession()
    const settings = await loadServerSettings()
    const server = await selectServer(settings)
    setEntry(`${server}/mobile-auth#code=${encodeURIComponent(code)}`)
  }, [])

  useFocusEffect(useCallback(() => {
    let active = true
    setLoading(true)
    setError('')
    void (async () => {
      const settings = await loadServerSettings()
      if (!settings.localUrl && !settings.remoteUrl) {
        if (active) router.replace('/settings')
        return
      }
      const tokens = await getTokens()
      if (tokens) {
        await apiGet<CurrentUser>('/auth/me')
        if (!active) return
        await openWeb()
      } else if (active) {
        setEntry('')
      }
    })().catch(e => { if (active) { setEntry(''); setError(e instanceof Error ? e.message : 'Connection failed') } })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [openWeb]))

  // Only the narrow left edge captures gestures; the rest belongs to the web UI.
  const edgeSwipe = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) =>
      gesture.dx > 35 && Math.abs(gesture.dy) < 45,
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dx > 85 && Math.abs(gesture.dy) < 90) router.push('/settings')
    },
  })).current

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack && webview.current) { webview.current.goBack(); return true }
      return false
    })
    return () => sub.remove()
  }, [canGoBack])

  async function login() {
    setLoading(true); setError('')
    try {
      await signIn(email, password)
      await apiGet<CurrentUser>('/auth/me')
      await openWeb()
      setPassword('')
    } catch (e) { setError(e instanceof Error ? e.message : 'Login failed') }
    finally { setLoading(false) }
  }

  async function logout() {
    await clearTokens()
    setEntry(''); setCanGoBack(false)
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>
  if (!entry) return <View style={styles.center}>
    <Text style={styles.title}>FinWorkspace</Text>
    <Text style={styles.subtitle}>Sign in to your server</Text>
    <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
    <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" />
    <Pressable style={styles.button} onPress={() => void login()}><Text style={styles.buttonText}>Sign in</Text></Pressable>
    <Pressable style={styles.secondary} onPress={() => router.push('/settings')}><Text style={styles.link}>Server settings</Text></Pressable>
    {error ? <Text style={styles.error}>{error}</Text> : null}
  </View>

  return <View style={styles.root}>
    <WebView
      key={entry}
      ref={webview}
      source={{ uri: entry }}
      javaScriptEnabled
      domStorageEnabled
      incognito
      sharedCookiesEnabled
      thirdPartyCookiesEnabled={false}
      mixedContentMode="never"
      originWhitelist={['http://*', 'https://*']}
      startInLoadingState
      renderLoading={() => <View style={styles.center}><ActivityIndicator size="large" /></View>}
      onNavigationStateChange={state => setCanGoBack(state.canGoBack)}
      onMessage={event => {
        try {
          const message = JSON.parse(event.nativeEvent.data) as { type?: string }
          if (message.type === 'FINWORKSPACE_LOGOUT') void logout()
        } catch { /* Ignore unrelated messages */ }
      }}
      onError={event => setError(event.nativeEvent.description || 'Cannot load server')}
    />
    <View style={styles.edgeGesture} {...edgeSwipe.panHandlers} />
    {error ? <Text style={styles.error}>{error}</Text> : null}
  </View>
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f4f8fb' },
  title: { fontSize: 30, fontWeight: '800', color: '#102d4b', marginBottom: 8 },
  subtitle: { color: '#64748b', marginBottom: 24 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 12 },
  button: { backgroundColor: '#145b94', borderRadius: 10, padding: 15, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
  secondary: { alignItems: 'center', marginTop: 22 },
  link: { color: '#145b94' },
  error: { color: '#b91c1c', marginTop: 14 },
  edgeGesture: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 18, backgroundColor: 'transparent' },
})
