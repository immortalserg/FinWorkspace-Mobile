# FinWorkspace Mobile

Android/iOS Expo shell that displays the **server-hosted FinWorkspace web application** using React Native WebView. UI updates are deployed on the FinWorkspace server without rebuilding the APK.

## Implemented

- Native API login with access/refresh tokens stored in SecureStore; server-hosted web interface after one-time WebView session exchange.
- Manual local HTTP/HTTPS or remote HTTPS server selection.
- Local-only operation without requiring a remote server.
- WebView navigation/back handling, reload control and settings.
- WebView DOM storage in incognito mode, with a separate one-time web session on each opening.

## Not yet implemented

- Native SSID detection / automatic trusted Wi-Fi switching (auto uses local only when no remote URL is configured).
- Native push notifications.
- Android file picker, download manager, camera permissions and external URL handling require device testing and follow-up implementation.
- Offline mode.

## Local Android build

```sh
npm install
npx expo install --check
npx tsc --noEmit
npx expo prebuild --platform android
cd android
./gradlew assembleDebug
```

APK: `android/app/build/outputs/apk/debug/app-debug.apk`. A debug build normally requires Metro (`npx expo start --dev-client --host lan`). For standalone distribution, configure release signing and build a release APK.

The Android manifest enables cleartext HTTP for LAN servers. **Only use HTTP on a trusted LAN**: credentials and session data are not encrypted. Use HTTPS for remote access, preferably HTTPS on the LAN as well.

## Architecture

The native shell authenticates through /api/auth/login and keeps JWTs in SecureStore. It requests a 60-second single-use code from /api/auth/mobile-web-session. The WebView opens /mobile-auth with the one-time code in the URL fragment (never the JWT), and the web frontend redeems it via POST /api/auth/mobile-web-session/exchange, storing its own web session. Both backend and frontend must be updated before this mobile build will work. The URL fragment is removed immediately on page load. Do not use this flow over untrusted HTTP: prefer HTTPS even on LAN.

Native push notifications require device registration and a server-side delivery adapter; browser Web Push does not automatically become native push.
