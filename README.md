# MobiFlow

A mobile financial visibility app for informal SME owners in Rwanda. Built with React Native, Expo, and Firebase.

---

## Description

MobiFlow is a mobile financial visibility application for Informal SMEs in Rwanda. The project's main objective is to design and develop an app that provides automated, low-effort financial insights and addresses connectivity constraints, including offline and language support, for users in urban and rural areas. Future versions will automatically capture transactions from mobile money SMS (MTN MoMo, Airtel Money) to deliver those insights. The current MVP lets users log income and expenses manually, categorize transactions, view a dashboard with balance and cash flow summaries, and generate reports by category and time period. The app uses React Native and Expo for the frontend, and Firebase for authentication and Firestore for real-time data sync.

**Tech stack:** React Native · Expo · TypeScript · Firebase (Auth, Firestore)

---

## How to Set Up the Environment and the Project

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Expo Go app on your phone (optional, for testing on device)
- Android Studio (for Android emulator) or Xcode (for iOS simulator)

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/Belinda1704/mobiflow-capstone-project.git
   cd mobiflow-capstone-project/mobiflow-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npx expo start
   ```

4. **Run the app**
   - Press `a` for Android emulator
   - Press `i` for iOS simulator
   - Or scan the QR code with Expo Go on your device

### Environment Notes

- Firebase is preconfigured in `config/firebase.ts` for this demo. You can run the app as-is to evaluate it.
- A stable internet connection is required for Firebase Auth and Firestore to work during the demo.

---

## Backend Development

The app uses **Firebase** as the backend (Backend-as-a-Service): Firebase Authentication for login/signup and Cloud Firestore for data storage. There is no separate server; the React Native app talks directly to Firebase.

### Server-Side Logic (Firebase / Firestore)

**1. Database interactions – adding a transaction**

```typescript
// services/transactionsService.ts
export async function addTransaction(
  userId: string,
  input: CreateTransactionInput
): Promise<void> {
  const amount = input.type === 'expense' ? -Math.abs(input.amount) : Math.abs(input.amount);
  await addDoc(collection(db, COLLECTION), {
    userId,
    label: input.label.trim(),
    amount,
    type: input.type,
    category: input.category,
    createdAt: serverTimestamp(),
  });
}
```

**2. Real-time listener – transactions by user**

```typescript
// services/transactionsService.ts
const q = query(
  collection(db, COLLECTION),
  where('userId', '==', userId),
  orderBy('createdAt', 'desc')
);
return onSnapshot(q, (snap) => {
  const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  onUpdate(list);
});
```

**3. Auth + user document creation**

```typescript
// services/authService.ts
export async function signUp(email: string, password: string): Promise<void> {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await setDoc(doc(db, 'users', cred.user.uid), {
    email: email.trim(),
    createdAt: new Date().toISOString(),
  });
}
```

---

## Database Schema

Firestore is a NoSQL document database. Collections and document structure:

| Collection    | Document ID       | Fields                                                                 |
|---------------|-------------------|------------------------------------------------------------------------|
| **transactions** | Auto-generated  | `userId`, `label`, `amount`, `type` (income/expense), `category`, `createdAt` |
| **users**       | User UID (from Auth) | `email`, `createdAt`                                                |
| **userSettings** | User UID         | `customCategories` (array of `{ id, name }`)                           |

**Composite index** (for querying transactions by user, ordered by date):

- Collection: `transactions`
- Fields: `userId` (ascending), `createdAt` (descending)

Defined in `firestore.indexes.json`.

---

## Deployment Plan

| Component   | Plan                                                                 |
|------------|----------------------------------------------------------------------|
| **Mobile app** | Expo EAS Build to produce Android (and iOS) installable builds. Publish via Google Play Store (and App Store for iOS later). |
| **Backend**    | Firebase (Auth, Firestore) is already cloud-hosted. No extra server deployment. |
| **Web preview**| Optional: `npx expo export:web` and deploy the static site to Vercel or Netlify for a browser demo. |

**Steps for Android deployment (EAS Build):**

1. Install EAS CLI: `npm install -g eas-cli`
2. Log in: `eas login`
3. Configure: `eas build:configure`
4. Build: `eas build --platform android`
5. Submit to Play Store: `eas submit` (after creating a developer account)

---

## Designs

### Figma Mockups

**[MobiFlow UI Design – Figma](https://www.figma.com/design/xP5KDN2i1uEpY50LbUzHQT/MobiFlow-UI-Design?node-id=0-1&t=MgnUSoKWi2sqfKkS-1)**

![MobiFlow Figma Design](mobiflow-app/assets/images/mobiflow-figma-design.png)

## Video Demo

Video link coming soon.



