import { useEffect, useState } from 'react'
import { router } from 'expo-router'
import { Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native'
import { loadServerSettings, saveServerSettings, type ConnectionMode } from '../lib/config'

export default function Settings() {
  const [remote, setRemote] = useState('')
  const [local, setLocal] = useState('')
  const [ssids, setSsids] = useState('')
  const [mode, setMode] = useState<ConnectionMode>('auto')
  const [message, setMessage] = useState('')

  useEffect(() => { void loadServerSettings().then(s => {
    setRemote(s.remoteUrl); setLocal(s.localUrl); setSsids(s.trustedSsids.join('\n')); setMode(s.connectionMode)
  }) }, [])

  async function save() {
    try {
      await saveServerSettings({ remoteUrl: remote, localUrl: local, trustedSsids: ssids.split(/[,\n]/), connectionMode: mode })
      router.replace('/')
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Invalid configuration') }
  }

  return <ScrollView style={styles.page} contentContainerStyle={styles.content}>
    <Text style={styles.heading}>Server connection</Text>
    <Text style={styles.label}>Connection mode</Text>
    {(['auto', 'local', 'remote'] as const).map(option => <Pressable key={option} style={[styles.button, mode === option ? styles.selected : styles.unselected]} onPress={() => setMode(option)}><Text style={styles.buttonText}>{option === 'auto' ? 'Automatic' : option === 'local' ? 'Local server' : 'Remote server'}</Text></Pressable>)}
    <Text style={styles.label}>Remote address (HTTPS, optional)</Text>
    <TextInput style={styles.input} value={remote} onChangeText={setRemote} placeholder="https://finance.example.com" autoCapitalize="none" autoCorrect={false} keyboardType="url" />
    <Text style={styles.label}>Local address (HTTP or HTTPS)</Text>
    <TextInput style={styles.input} value={local} onChangeText={setLocal} placeholder="https://finance.home.arpa" autoCapitalize="none" autoCorrect={false} keyboardType="url" />
    <Text style={styles.label}>Trusted Wi-Fi names (one SSID per line)</Text>
    <TextInput style={[styles.input, styles.multiline]} multiline value={ssids} onChangeText={setSsids} placeholder={'Home WiFi\nHome WiFi 5G'} />
    <Text style={styles.note}>Automatic mode uses the local server if no remote address is configured. Otherwise it uses the remote HTTPS server until native SSID detection is implemented. Select Local server to force local access. HTTP sends credentials unencrypted: use only on a trusted LAN.</Text>

    <Pressable style={styles.button} onPress={() => void save()}><Text style={styles.buttonText}>Save settings</Text></Pressable>
    <Pressable style={styles.button} onPress={() => router.replace('/')}><Text style={styles.buttonText}>Open FinWorkspace</Text></Pressable>
    {message ? <Text style={styles.message}>{message}</Text> : null}
  </ScrollView>
}
const styles = StyleSheet.create({
  page: { backgroundColor: '#f4f8fb' }, content: { padding: 22, gap: 12 },
  heading: { fontSize: 26, fontWeight: '800', color: '#102d4b', marginBottom: 14 },
  label: { fontWeight: '600', color: '#334155' }, input: { backgroundColor: 'white', borderRadius: 10, borderColor: '#cbd5e1', borderWidth: 1, padding: 14 },
  multiline: { minHeight: 90, textAlignVertical: 'top' }, note: { color: '#64748b', lineHeight: 21, marginVertical: 10 },
  button: { backgroundColor: '#145b94', padding: 15, borderRadius: 10, alignItems: 'center' },
  selected: { backgroundColor: '#145b94' }, unselected: { backgroundColor: '#64748b' },
  logout: { backgroundColor: '#9f3342', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontWeight: '700' }, message: { marginTop: 10, color: '#334155' },
})
