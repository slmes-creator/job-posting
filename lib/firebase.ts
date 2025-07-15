/* -------------------------------------------------------------------------- */
/*                              lib/firebase.ts                               */
/* -------------------------------------------------------------------------- */
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app"

/* Your exact Firebase project credentials ---------------------------------- */
const firebaseConfig = {
  apiKey: "AIzaSyCbA7IMrDwE6XUlvqezw8xXcw9xqjGyppc",
  authDomain: "job-posting-b2410.firebaseapp.com",
  projectId: "job-posting-b2410",
  storageBucket: "job-posting-b2410.firebasestorage.app", // ✔ as provided
  messagingSenderId: "959519805590",
  appId: "1:959519805590:web:4d325d5fc2af11a837b2b7",
  measurementId: "G-HF116RBLCT",
}

/* ----------------------------- 1️⃣  ONE App ------------------------------- */
export const firebaseApp: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

/* -------------------------------------------------------------------------- */
/*            2️⃣  Lazy-load browser-only SDKs (Auth / DB / Storage)          */
/* -------------------------------------------------------------------------- */
let auth: import("firebase/auth").Auth | null = null
let db: import("firebase/firestore").Firestore | null = null
let storage: import("firebase/storage").FirebaseStorage | null = null

/**
 * We create Auth, Firestore and Storage **after** the bundle is running
 * in the browser (window is defined).  This prevents the “component not
 * registered / service not available” errors that occur during SSR.
 */
if (typeof window !== "undefined") {
  // Dynamically import to keep them entirely out of the server bundle
  ;(async () => {
    const [{ getAuth }, { getFirestore }, { getStorage }] = await Promise.all([
      import("firebase/auth"),
      import("firebase/firestore"),
      import("firebase/storage"),
    ])

    auth = getAuth(firebaseApp)
    db = getFirestore(firebaseApp)
    storage = getStorage(firebaseApp)
  })()
}

/* ----------------------------- 3️⃣  Exports ------------------------------- */
/* These may be `null` during the server render; client code must check.      */

// Helper function to ensure Firebase services are initialized
export const ensureFirebaseInitialized = async (): Promise<{
  auth: import("firebase/auth").Auth
  db: import("firebase/firestore").Firestore
}> => {
  if (typeof window === "undefined") {
    throw new Error("Firebase can only be used in the browser")
  }

  // Wait for services to be initialized
  let attempts = 0
  while ((!auth || !db) && attempts < 50) {
    await new Promise(resolve => setTimeout(resolve, 100))
    attempts++
  }

  if (!auth || !db) {
    throw new Error("Firebase services failed to initialize")
  }

  return { auth, db }
}

export { auth, db, storage }
export default firebaseApp
