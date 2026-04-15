# NGA Hub: The Next Generation App

Welcome to NGA Hub, a modern web application built with a focus on user experience, AI-powered features, and age-appropriate content delivery. This project was prototyped and developed collaboratively in Firebase Studio.

## How to Run in Firebase Studio

This project is designed to run directly within the Firebase Studio environment. Follow these steps to start the development server:

1.  **Open the Terminal:** Open the built-in VS Code terminal (`Ctrl+` or `Cmd+` `` ` ``). The project files are already loaded for you.
2.  **Install Dependencies:** If you haven't already, run this command to install the necessary libraries:
    ```bash
    npm install
    ```
3.  **Set Up Firebase:** This app requires a Firebase project for its backend.
    *   Go to the [Firebase Console](https://console.firebase.google.com/) and create a new, free project.
    *   Inside your new project, create a **Web App** (`</>`).
    *   Copy the `firebaseConfig` object that Firebase provides.
    *   In VS Code, open the file `src/firebase/config.ts` and replace its contents with the config object you just copied.
    *   In the Firebase Console, enable **Authentication** (Email/Password and Google) and **Firestore** (start in test mode).
    *   Copy the contents of the `firestore.rules` file from the project into your Firestore **Rules** tab and publish.
4.  **Run the App:** In the terminal, run the development server:
    ```bash
    npm run dev
    ```
    Your app will be running at `http://localhost:9002`. A preview will be available within Firebase Studio.

## Deploying with the Firebase CLI

While `npm run dev` is used for running the app in the development environment, the Firebase CLI is used for deploying it to Firebase App Hosting, making it live on the internet for others to use.

1.  **Install the Firebase CLI:** If you don't already have it, open your terminal and run:
    ```bash
    npm install -g firebase-tools
    ```
2.  **Log in to Firebase:** Connect the CLI to your Firebase account by running:
    ```bash
    firebase login
    ```
3.  **Deploy the App:** In your project's root folder, run the deployment command:
    ```bash
    firebase deploy
    ```
    This will build your Next.js app for production and deploy it to Firebase App Hosting.

## Key Features

- **Personalized User Experience:** The app's look and feel, including the background, adapts based on the user's selected age group (`under-10`, `10-16`, `16-plus`).
- **AI-Powered Content:**
    - **AI Feed:** A personalized content feed (`/feed`) that uses a Genkit flow to recommend content based on the user's age.
    - **AI Content Summaries:** Content cards feature an "AI Feedback" button that summarizes the content on demand.
    - **AI Live Lesson Generator:** An interactive tool (`/ai-tools/live-lesson`) that generates a complete lesson plan on any topic and uses Text-to-Speech (TTS) to read it aloud.
    - **AI Security Alerts:** The Security page (`/security`) displays AI-generated security bulletins to keep users informed.
- **Firebase Integration:**
    - **Authentication:** Secure user sign-up and login using Firebase Authentication (Email/Password and Google).
    - **Firestore Database:** User profiles, including age group, are stored and retrieved from Firestore.
- **Modern, Responsive UI:**
    - Built with ShadCN UI components and styled with Tailwind CSS.
    - Features a collapsible sidebar for navigation, a consistent purple theme, and skeleton loading states for a smooth user experience.
- **Interactive Placeholders:** Pages for upcoming features like "Reels" and "Stories" include visual mock-ups instead of simple "coming soon" text.
- **External Content Linking:** Content cards can link directly to external websites (like YouTube) for a richer browsing experience.

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (with App Router)
- **Generative AI:** [Genkit (Firebase GenAI)](https://firebase.google.com/docs/genkit)
- **Backend & Auth:** [Firebase](https://firebase.google.com/) (Authentication, Firestore)
- **UI Components:** [ShadCN UI](https://ui.shadcn.com/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Deployment:** Pre-configured for [Firebase App Hosting](https://firebase.google.com/docs/app-hosting)

---
*Note: The AI features in this version are connected to a mock database (`src/lib/ai-database.ts`) for demonstration purposes. This allows you to run the app locally without needing a Genkit API key. If you wish to connect to live AI services, you can add your `GEMINI_API_KEY` to the `.env` file (as shown in the comments) and update the AI flows in `src/ai/flows/` to call the live Genkit models.*
