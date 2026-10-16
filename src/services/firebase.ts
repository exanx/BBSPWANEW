import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  Auth
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  Firestore,
  enableIndexedDbPersistence
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCCDq-rvjw_o3APjQRT4EfWRWDFdUgu26Y",
  authDomain: "sanctabiblia.firebaseapp.com",
  projectId: "sanctabiblia",
  storageBucket: "sanctabiblia.appspot.com",
  messagingSenderId: "695688083334",
  appId: "1:695688083334:web:3a030b5ade0c8af0061e07"
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);

  if (typeof window !== 'undefined') {
    enableIndexedDbPersistence(db).catch(err => {
      console.warn("Firestore Persistence notification:", err.code);
    });
  }
} catch (e) {
  console.warn("Firebase initialization skipped or failed:", e);
}

export { auth, db };

export async function loginWithGoogle(): Promise<User> {
  if (!auth) throw new Error("Firebase Auth is not available.");
  const provider = new GoogleAuthProvider();
  const res = await signInWithPopup(auth, provider);
  return res.user;
}

export async function loginWithEmail(email: string, pass: string): Promise<User> {
  if (!auth) throw new Error("Firebase Auth is not available.");
  const res = await signInWithEmailAndPassword(auth, email, pass);
  return res.user;
}

export async function signupWithEmail(email: string, pass: string): Promise<User> {
  if (!auth) throw new Error("Firebase Auth is not available.");
  const res = await createUserWithEmailAndPassword(auth, email, pass);
  return res.user;
}

export async function logoutUser(): Promise<void> {
  if (!auth) return;
  await signOut(auth);
}

export function subscribeToAuth(callback: (user: User | null) => void): () => void {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export async function uploadUserData(uid: string, payload: Record<string, any>): Promise<void> {
  if (!db) return;
  const userDocRef = doc(db, 'users', uid);
  await setDoc(userDocRef, payload, { merge: true });
}

export async function downloadUserData(uid: string): Promise<Record<string, any> | null> {
  if (!db) return null;
  const userDocRef = doc(db, 'users', uid);
  const snap = await getDoc(userDocRef);
  if (snap.exists()) {
    return snap.data();
  }
  return null;
}
