# FinWorkspace Mobile

Android/iOS Expo shell that displays the **server-hosted FinWorkspace web application** using React Native WebView. UI updates are deployed on the FinWorkspace server without rebuilding the APK.

## Implemented

- Full server-hosted web interface, including the existing browser login.
- Manual local HTTP/HTTPS or remote HTTPS server selection.
- Local-only operation without requiring a remote server.
- WebView navigation/back handling, reload control and settings.
- WebView DOM storage and cookies.

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

The native shell does not handle the web application's credentials or inject authentication tokens. Login and browser session management are handled by the FinWorkspace web application inside WebView. WebView cookies are independent from Chrome cookies. Switching between different origins can require signing in again.

Native push notifications require device registration and a server-side delivery adapter; browser Web Push does not automatically become native push.
