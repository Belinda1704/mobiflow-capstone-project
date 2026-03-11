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
- [Tech stack](#tech-stack)
- [Designs (Figma)](#designs-figma)
- [References](#references)

## Links

### Video demo of core functionalities

**Link to demo:** [Watch demo video (Google Drive)](https://drive.google.com/file/d/1sZGbDIiEVUt1p8g_G_9IXd0SdNLsDVrg/view?usp=sharing)

### MobiFlow APK

**Link to APK:** [Download MobiFlow APK](https://github.com/Belinda1704/mobiflow-capstone-project/releases/download/v1.0.0/MobiFlow-v1.0.2.apk)  
Share this link by WhatsApp, email, etc. You can also use the [Releases](https://github.com/Belinda1704/mobiflow-capstone-project/releases) page and download the APK from **Assets**.

**Android requirements**

- Android 14 (API 34) or higher  
- 2 GB RAM minimum

**How to install**

1. Download `MobiFlow-v1.0.1.apk` from the link above (or from the Releases page).
2. On your phone, open the downloaded file (for example from **Files** → **Downloads**).
3. If Android says something like **"For your security, your phone is not allowed to install unknown apps from this source"**:
   - Go to **Settings** → **Apps** → open the app you used to download (e.g. Chrome or Files).
   - Tap **Install unknown apps** (or "Special app access") and turn **Allow from this source** on.
4. Tap the APK again and follow the prompts to install.

> **Note about Google Play Protect**
>
> Some phones may show a warning like **"App blocked by Play Protect"** when you try to install the APK, because it is not from the Play Store and it requests SMS and notification permissions.
>
> If this happens:
> 1. Tap **More details → Install anyway** (or similar), **or**
> 2. Temporarily turn off Play Protect:
>    - Open the **Play Store** app.
>    - Tap your profile picture → **Play Protect**.
>    - Tap the settings icon (top‑right) and turn off **Scan apps with Play Protect**.
>    - Install the APK.
>    - After installation, you can turn Play Protect back on.

SMS capture and notifications require the APK or a development build; they do not work in Expo Go. Core transaction and report features work in Expo Go.

### Project report: analysis, discussion & recommendations

**Link to report:** [Project report (analysis, discussion & recommendations)](https://docs.google.com/document/d/1mnZ5QHzBgCN8ddCLAgUAqSX9sm2uIqub3y1Dvo9JCws/edit?usp=sharing) — analysis of results vs objectives, discussion on milestones and impact, and recommendations & future work (with supervisor).

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
   cd mobiflow-app
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
- **Anomaly detector:** in the transactions list, a "Bigger than usual" badge when a transaction is larger than your usual (amount &gt; 2× your average for that type). Rule-based; uses only your own data. This is what triggers the badge.
- **ML risk model:** a small on-device model trained on synthetic data (amount, time of day, cash vs mobile money). It runs only on expenses and outputs a risk score shown on the **transaction detail** screen as "Model risk" (e.g. 98%). It does not trigger the "Bigger than usual" badge; no user data is sent out.
- **Top customers:** people who have sent you money (income), grouped by phone number from transaction labels. The list is **all-time** (all your income so far), sorted by total amount received. It updates when you open the screen; there is no daily/weekly/monthly filter.

**Risk model – how it works:** The app uses a small on-device model that looks at expense amount, time of day, and whether it’s cash or mobile money. It was trained on synthetic data (see the notebook). For each expense it outputs a risk score, shown on the transaction detail screen as "Model risk" (a percentage). It does not trigger the "Bigger than usual" badge; that badge comes only from the anomaly detector above. Income is not scored. No data is sent to a server.

**How to test the model:** From the project root run `cd mobiflow-app && npm test -- fraudModel`. The test checks that income gets zero risk, a large mobile-money expense gets high risk, and a small cash expense gets low risk. To see how the model was built (data, features, weights), open `fraud-detection-model/fraud_detection_synthetic.ipynb` in Jupyter.

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
  - Run with **coverage**:
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

## Tech stack

- **Frontend:** React Native (Expo), TypeScript, Expo Router, React Navigation.
- **Backend:** Firebase Authentication, Cloud Firestore, Firebase Storage (backups and profile photos), Firebase Cloud Functions (health score and report summary).
- **Testing:** Jest, React Native Testing Library, Maestro (mobile E2E).
- **ML / data work:** Python, pandas, scikit‑learn, Jupyter Notebook (`fraud-detection-model/fraud_detection_synthetic.ipynb`).

## Designs (Figma)

- **Figma UI design:**  
  `https://www.figma.com/design/xP5KDN2i1uEpY50LbUzHQT/MobiFlow-UI-Design?node-id=0-1`

## References

Documentation and resources used for this project:

- Expo documentation – `https://docs.expo.dev/`
- React Native documentation – `https://reactnative.dev/docs/getting-started`
- Firebase Web SDK (Auth & Firestore) – `https://firebase.google.com/docs`
- React Navigation – `https://reactnavigation.org/docs/getting-started`
- Jest testing framework – `https://jestjs.io/docs/getting-started`
- Maestro mobile testing – `https://maestro.mobile.dev/`
- react-native-youtube-iframe – `https://github.com/LonelyCpp/react-native-youtube-iframe`
- scikit‑learn logistic regression – `https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.LogisticRegression.html`

**Author:** Belinda Belange Larose

