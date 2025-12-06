// NOTA: Hemos desactivado Firebase porque migraste a Supabase.
// Mantenemos este archivo temporalmente para evitar errores de importación
// en otros componentes que aún no has actualizado.

/* import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
*/

// Exportaciones "Dummy" (falsas) para que la app no explote al iniciar
// TODO: Reemplaza las importaciones de este archivo por tu cliente de Supabase
export const auth = { currentUser: null }; 
export const db = {};
export const storage = {};

console.warn("⚠️ Firebase ha sido desactivado en src/lib/firebase.ts. Asegúrate de usar Supabase.");