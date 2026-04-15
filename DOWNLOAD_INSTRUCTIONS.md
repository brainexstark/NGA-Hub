# NGA Hub: Setup Instructions for Firebase Studio

Follow these steps to get the NGA Hub application up and running within your Firebase Studio environment.

## 1. Prerequisites

The necessary tools ([Node.js](https://nodejs.org/) v18+ and [npm](https://www.npmjs.com/)) are already installed in this environment.

## 2. Access the Code

The project files are already loaded in your workspace. You can browse them using the file explorer on the left.

## 3. Install Dependencies

Navigate to the root directory of the project in your terminal and run the following command to install the necessary packages:

```bash
npm install
```

## 4. Set Up Firebase

The application uses Firebase for authentication and database services.

### 4.1. Create a Firebase Project

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Click **"Add project"** and follow the on-screen instructions to create a new project. Give it a memorable name, like `nga-hub-local`.

### 4.2. Create a Web App

1.  In your new Firebase project, click the Web icon (`</>`) to add a new web app.
2.  Give your app a nickname (e.g., "NGA Hub Web").
3.  **Important:** Do NOT check the box for "Also set up Firebase Hosting for this app."
4.  Click **"Register app"**.

### 4.3. Get Firebase Config

After registering, Firebase will show you a `firebaseConfig` object. This contains the keys your app needs to connect to Firebase.

1.  Copy this JavaScript object.
2.  Open the file `src/firebase/config.ts` in your project.
3.  Replace the existing content of this file with the `firebaseConfig` object you copied. It should look like this:

```typescript
export const firebaseConfig = {
  apiKey: "AIz...",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "...",
  appId: "1:..."
};
```

### 4.4. Enable Authentication

1.  In the Firebase Console, go to the **Authentication** section.
2.  Click **"Get started"**.
3.  On the **Sign-in method** tab, enable the following providers:
    *   **Email/Password**
    *   **Google** (you will need to provide a project support email).

### 4.5. Set Up Firestore Database

1.  In the Firebase Console, go to the **Firestore Database** section.
2.  Click **"Create database"**.
3.  Start in **Test mode**. This allows open access during initial development. Click **Next**.
4.  Choose a location for your database. Click **Enable**.
5.  Go to the **Rules** tab within Firestore.
6.  Copy the entire content of the `firestore.rules` file from your project.
7.  Paste it into the rules editor in the Firebase Console, overwriting the default rules.
8.  Click **Publish**.

## 5. Run the Application

You are now ready to run the app. Use the following command in the terminal:

```bash
npm run dev
```

The application will be available at `http://localhost:9002`.

---
*Note: The AI features in this version are connected to a mock database, so you do not need to set up a separate Genkit API key to run the app. If you wish to connect to live AI services, you can provide your API key in the `.env` file.*
