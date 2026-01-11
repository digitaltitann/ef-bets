import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Generate a random 4-digit code
export function generateCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

// Save session to Firestore with a code
export async function saveSessionToCloud(code: string, session: unknown): Promise<void> {
  await setDoc(doc(db, 'sessions', code), {
    session,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
  })
}

// Load session from Firestore by code
export async function loadSessionFromCloud(code: string): Promise<unknown | null> {
  const docRef = doc(db, 'sessions', code)
  const docSnap = await getDoc(docRef)

  if (docSnap.exists()) {
    const data = docSnap.data()
    return data.session
  }

  return null
}

export { db }
