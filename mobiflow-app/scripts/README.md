# MobiFlow scripts

All runnable scripts live here. Run from **mobiflow-app** root (e.g. `.\scripts\BUILD_RELEASE_APK.ps1`).

**PowerShell (Android build / setup):**
- `SETUP_SHORT_PATH.ps1` – Copy project to short path (C:\mobiflow\mobiflow-app) for building
- `BUILD_RELEASE_APK.ps1` – Build release APK (run from short path or main project)
- `BUILD_WITH_JAVA17.ps1` – Debug build with Java 17 (Metro + device)
- `sync-to-short-path.ps1` – Sync build fixes to short path
- `ADD_PAST_SMS_READING.ps1` – Add readPastSMS to SMS library
- `patch-sms-library.ps1` – Patch SMS library for Android (getApplicationInfo fix)

**Node (postinstall / dev):**
- `apply-sms-overrides.js` – Runs after `npm install`: copies SMS patches and sets the SMS library **minSdk** to match `app.config.js` (needed for release builds)
- `reset-project.js` – `npm run reset-project`
- `fix-patch-lf.js` – Fix patch file line endings
- `write-sms-patch.js` / `debug-patch-parse.js` – SMS patch tooling

Config files (`app.config.js`, `jest.config.js`, `eslint.config.js`) stay at project root for Expo/Jest/ESLint.
