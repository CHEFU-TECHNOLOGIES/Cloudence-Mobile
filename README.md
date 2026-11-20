# Cloudence Mobile

Cloudence Mobile is an Expo / React Native app. Native features such as secure
storage and SQLCipher require a development build; Expo Go is not supported.

## Run the Android development client

Requirements: Node.js 22, Android Studio with an Android SDK, and an Android
emulator or USB-connected device.

```bash
npm ci
npm run android:dev
```

`android:dev` generates the ignored native Android project if needed, builds
and installs a debug development client, and starts Metro. To start Metro
separately after installing the client:

```bash
npm run start:dev-client
```

## GitHub Actions

The `Android debug build` workflow runs on pushes, pull requests, and manual
dispatch. It creates a debug-signed APK using the standard Android debug
keystore and uploads it as a workflow artifact. It does not create or publish
a release build.

## Other checks

```bash
npx tsc --noEmit
npx expo export --platform web
```
