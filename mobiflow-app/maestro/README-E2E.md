# E2E Testing for MobiFlow (Android)

This project uses **Maestro** for end-to-end tests on **Android**. Maestro runs against the real app in an emulator or device—no web, no Playwright.

---

## What you need

### 1. Android setup

- **Android Studio** with Android SDK
- **Android Emulator** (AVD) or physical device with USB debugging
- **Java 17+** (required by Maestro). Check: `java -version`

Set `ANDROID_HOME` (or `ANDROID_SDK_ROOT`) to your SDK path.

### 2. Maestro CLI

Install Maestro (no npm package in the app):

**macOS / Linux:**
```bash
curl -fsSL "https://get.maestro.mobile.dev" | bash
```

**macOS (Homebrew):**
```bash
brew tap mobile-dev-inc/tap
brew install maestro
```

**Windows:** Run the same curl command in PowerShell, or download from https://github.com/mobile-dev-inc/maestro/releases (extract and add `bin` to PATH).

Verify: `maestro --version`

### 3. Run the app

- **APK (installed app):** Install your built APK on the device/emulator. Flows use `launchApp` and need no URL.
- **Expo Go:** Install Expo Go, run `npx expo start`, open project in Expo Go. Flows would use `openLink` with `EXPO_URL` (current flows are set up for APK).

---

## How to run E2E

**For APK (installed on device):**

1. Install the APK and (for onboarding/login flows) start from a logged-out state if needed.
2. From `mobiflow-app`:
   ```bash
   maestro test maestro/flows
   ```
   No `EXPO_URL` needed; flows launch the app by package id (`com.mobiflow.app`).

**For Expo Go:** Use `openLink` in the flows and run with `--env EXPO_URL=exp://YOUR_IP:8081`. Current flow files use `launchApp` for APK.

---

## Flows

- **onboarding.yaml** – Land on app, assert MobiFlow, tap Get Started (by testID).
- **login-screen.yaml** – Open login, assert welcome/sign in text, tap Create account.
- **login-with-ids.yaml** – Login screen using testIDs (login-phone-input, login-sign-in-button, etc.).
- **onboarding-sign-in.yaml** – Onboarding → tap Sign in → assert login screen.

We added **testID** on login and onboarding (e.g. `login-sign-in-button`, `onboarding-get-started`) so Maestro can target elements without relying on translated text.

---

## Summary

| Need | Purpose |
|------|---------|
| Android Studio + emulator | Run app and Maestro on Android |
| Java 17+ | Required by Maestro |
| Maestro CLI | Run flows (no npm deps in app) |
| Expo Go or `expo run:android` | App running on device/emulator |
| `maestro test maestro/flows` | Execute E2E |

E2E here is **mobile app** E2E on Android, not website E2E.
