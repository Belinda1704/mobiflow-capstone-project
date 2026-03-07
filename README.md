# MobiFlow: A Mobile Financial Visibility Application for Informal SMEs in Rwanda

## Overview

MobiFlow is designed for small shop owners, salon owners, and other informal businesses who mainly use mobile money and cash. The app keeps all their income and expenses in one place, shows a clear picture of cash coming in and going out, and lets them capture mobile‑money activity automatically through SMS. It also provides a one‑time “scan past SMS” option to import older messages, plus tools like savings goals, alerts, business‑health summaries, and a credit‑readiness report they can share with a lender.

## Table of contents

- [Overview](#overview)
- [Table of contents](#table-of-contents)
- [Links](#links)
- [How to install and run the app](#how-to-install-and-run-the-app)
- [Project structure and core functionalities](#project-structure-and-core-functionalities)
- [Testing and how to run tests](#testing-and-how-to-run-tests)
- [Android device requirements (APK)](#android-device-requirements-apk)
- [How to build and install the APK](#how-to-build-and-install-the-apk)
- [Tech stack](#tech-stack)
- [Designs (Figma)](#designs-figma)
- [References](#references)

## Links

### 5‑minute demo video

*Link will be added here before submission. The demo will focus on core features (transactions, reports, SMS capture, goals, alerts) and not spend much time on sign‑up/sign‑in.*

### Android APK

*Link to the APK file will be added here before submission.*

### Extra report document

*A single Google Doc link will be added here. It will contain analysis of results vs objectives, discussion, and recommendations/future work.*

## How to install and run the app

### Prerequisites

- **Node.js** v18 or later (`https://nodejs.org`)
- **npm** (comes with Node)
- **Expo Go** on your phone (optional, for quick testing)
- **Android Studio** (for Android emulator) or **Xcode** (for iOS simulator, macOS only)

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/Belinda1704/mobiflow-capstone-project.git
   cd mobiflow-capstone-project/mobiflow-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase (required for login and data)**
   - In `mobiflow-app/`, create a file named `.env`.
   - Add your Firebase web app credentials (from Firebase Console → Project settings → Your apps):
     ```env
     EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
     EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
     EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
     EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
     EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
     EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
     ```

4. **Start the development server**
   ```bash
   npx expo start
   ```

5. **Run the app**
   - Press **`a`** for Android emulator, or **`i`** for iOS simulator, **or**
   - Scan the QR code with **Expo Go** on your device (same Wi‑Fi as your computer).

## Project structure and core functionalities

```text
mobiflow-capstone-project/
├── README.md
├── firebase.json                 # Firebase project config (functions deploy)
├── .firebaserc                   # Firebase project ID
├── mobiflow-app/                 # Mobile app (React Native / Expo)
│   ├── app/                      # Screens (Expo Router)
│   │   ├── (tabs)/               # Home, Transactions, Reports, More
│   │   ├── login.tsx, signup.tsx, forgot-password.tsx
│   │   ├── add-transaction.tsx, edit-transaction/
│   │   ├── alerts.tsx, savings-budget-goals.tsx
│   │   ├── business-health.tsx, business-insights.tsx
│   │   ├── sms-capture.tsx, notifications.tsx, how-to-use.tsx
│   │   ├── financial-literacy.tsx, financial-video.tsx
│   │   └── ...
│   ├── components/               # Reusable UI components
│   ├── hooks/                    # useTransactions, useAlerts, useSmsCapture, etc.
│   ├── services/                 # Firebase, transactions, SMS capture, fraud model, alerts, Cloud Functions client
│   ├── utils/                    # Formatting, filters, anomaly rules, fraudModel.ts
│   ├── constants/                # Colors, categories
│   ├── locales/                  # en.json, rw.json (translations)
│   ├── config/                   # Firebase init
│   └── package.json, app.json, tsconfig.json, etc.
├── functions/                    # Firebase Cloud Functions (Node.js)
│   ├── index.js                  # getHealthScore, getReportSummary (HTTP, auth)
│   └── package.json
└── fraud-detection-model/        # Jupyter notebook for fraud model (synthetic data)
```

**Core functionalities**

- **Backend (Cloud Functions):** health score and report summary are computed on the server; the app loads them when you open Business Health or Reports.
- **Savings goals & budgets:** set savings goals, track progress, and create simple category budgets with suggested amounts based on past spending.
- **Alerts:** configure practical alerts such as low balance and high expenses so the user gets early warnings.
- **SMS capture (Android):** listen to new mobile‑money SMS and turn them into transactions automatically, plus a one‑time “scan past SMS” option to import older messages.
- **Business health:** show a 0–100 business‑health score with simple explanations, top spending categories, and income trend over the last months.
- **Credit readiness report:** generate a credit‑readiness summary and export it as a PDF that can be shared with a bank or MFI.
- **Financial literacy:** short Kinyarwanda videos inside the app that help users learn about saving, credit, and managing small‑business money.
- **Anomaly detector:** in the transactions list, a "Bigger than usual" badge when a transaction is larger than your usual (amount &gt; 2× your average for that type). Rule-based; uses only your own data.
- **ML risk model:** the same "Bigger than usual" badge can also be triggered by a small model trained on a Kaggle-style dataset (amount, time of day, cash vs mobile money). It runs only on expenses (cash or mobile money) on the device; no user data is sent out.
- **Top customers:** people who have sent you money (income), grouped by phone number from transaction labels. The list is **all-time** (all your income so far), sorted by total amount received. It updates when you open the screen; there is no daily/weekly/monthly filter.

## How to demonstrate the ML (risk) model

1. **Run the test:** `cd mobiflow-app && npm test -- fraudModel` — shows the model gives zero risk for income, high risk for a very large mobile-money expense, and low risk for a small cash expense.
2. **Show the notebook:** open `fraud-detection-model/fraud_detection_synthetic.ipynb` — training data, features (amount_scaled, hour_of_day, is_cash_out, is_transfer), and how the weights were learned.
3. **In the app:** add an expense, type **Expense**, payment **Mobile money**, amount e.g. **50,000,000** RWF, save. Open **Transactions** — that row should show the "Bigger than usual" badge (the model flags it as high-risk). A small expense or any income will not get the badge from the model.

## Testing and how to run tests

MobiFlow was tested using automated tests and manual scenarios.

- **Unit and integration tests (Jest)**
  - Location: `mobiflow-app/__tests__`
  - Cover:
    - Utilities: currency formatting, date formatting, transaction filters, password strength.
    - Services: backup/restore, financial insights, fraud model.
    - Components: core buttons and headers.
  - Run all tests:
    ```bash
    cd mobiflow-capstone-project/mobiflow-app
    npm test
    ```
  - Run with **coverage** (for screenshots in the report):
    ```bash
    npx jest --coverage
    # HTML report: mobiflow-app/coverage/lcov-report/index.html
    ```

- **Mobile E2E tests (Maestro) – Android**
  - Location: `mobiflow-app/maestro/flows/*.yaml`.
  - Flows cover onboarding and login using the real APK.
  - Example command (from `mobiflow-app/` with a device/emulator connected):
    ```bash
    maestro test maestro/flows/onboarding.yaml
    ```

## Android device requirements (APK)

The app was built for **Android 14 (API 34) or higher** with **2 GB RAM minimum**. The SMS capture library requires API 34.

| Requirement | Minimum |
|-------------|---------|
| Android version | 14 (API 34) or higher |
| RAM | 2 GB |

## How to build and install the APK (Windows – optional)

Most reviewers can simply install the APK from the link above.  
This section is only needed on **Windows machines that hit long‑path Gradle errors**.

1. From the main project on Windows:
   ```powershell
   cd "C:\Users\HP\Desktop\Capstone development\mobiflow-capstone-project\mobiflow-app"
   .\scripts\SETUP_SHORT_PATH.ps1 -PreserveCache
   ```
   This copies the project to `C:\mobiflow\mobiflow-app` and keeps Gradle cache for faster builds.

2. Build the release APK:
   ```powershell
   cd C:\mobiflow\mobiflow-app
   .\BUILD_RELEASE_APK.ps1
   ```

3. Install the APK on a phone:
   - File path: `C:\mobiflow\mobiflow-app\android\app\build\outputs\apk\release\app-release.apk`
   - Copy it to the phone (USB / Google Drive) and tap to install, or let the script install to a connected device.

> Note: SMS capture and notifications only work in the **APK / development build** (not in Expo Go). Core transaction and report features still work in Expo Go for quick demos.

## Tech stack

- **Frontend:** React Native (Expo), TypeScript, Expo Router, React Navigation.
- **Backend:** Firebase Authentication, Cloud Firestore, Firebase Storage (backups and profile photos), Firebase Cloud Functions (health score and report summary).
- **Testing:** Jest, React Native Testing Library, Maestro (mobile E2E).
- **ML / data work:** Python, pandas, scikit‑learn, Jupyter Notebook (`fraud-detection-model/fraud_detection_synthetic.ipynb`).

## Designs (Figma)

- **Figma UI design:**  
  `https://www.figma.com/design/xP5KDN2i1uEpY50LbUzHQT/MobiFlow-UI-Design?node-id=0-1`

## References

Main documentation used while building MobiFlow:

- Expo documentation – `https://docs.expo.dev/`
- React Native documentation – `https://reactnative.dev/docs/getting-started`
- Firebase Web SDK (Auth & Firestore) – `https://firebase.google.com/docs`
- React Navigation – `https://reactnavigation.org/docs/getting-started`
- Jest testing framework – `https://jestjs.io/docs/getting-started`
- Maestro mobile testing – `https://maestro.mobile.dev/`
- react-native-youtube-iframe – `https://github.com/LonelyCpp/react-native-youtube-iframe`
- scikit‑learn logistic regression – `https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.LogisticRegression.html`

