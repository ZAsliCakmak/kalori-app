import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import * as firebaseAuth from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { firebaseConfig } from "./firebaseConfig";

const { getAuth, initializeAuth } = firebaseAuth;
// React Native derlemesinde mevcut; web tip tanımlarında görünmediği için bu şekilde alınıyor.
const getReactNativePersistence = (firebaseAuth as any)
  .getReactNativePersistence as (storage: unknown) => firebaseAuth.Persistence;

const firstInit = getApps().length === 0;
const app = firstInit ? initializeApp(firebaseConfig) : getApp();

// Anonim oturum AsyncStorage'da saklanır; uygulama kapansa da aynı kullanıcı kalır.
export const auth = firstInit
  ? initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })
  : getAuth(app);

// Boş (undefined) alanlar Firestore'a yazılırken atlanır.
export const db = firstInit
  ? initializeFirestore(app, { ignoreUndefinedProperties: true })
  : getFirestore(app);
