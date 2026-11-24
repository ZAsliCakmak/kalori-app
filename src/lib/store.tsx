import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { collection, deleteDoc, doc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Text, View } from "react-native";
import { dailyGoal, resizePortion, todayKey } from "./calc";
import { isFirebaseConfigured } from "./firebaseConfig";
import { Entry, Exercise, Food, Profile, WeightLog } from "./types";

/**
 * Firestore yapısı:
 *   users/{uid}                  → { profile, favorites, water: { "YYYY-MM-DD": ml } }
 *   users/{uid}/entries/{id}     → besin kayıtları
 *   users/{uid}/exercises/{id}   → egzersiz kayıtları
 *   users/{uid}/weights/{date}   → kilo kayıtları
 */

export const DEFAULT_PROFILE: Profile = {
  name: "",
  gender: "erkek",
  age: 25,
  height: 175,
  weight: 75,
  targetWeight: 72,
  activity: 1.375,
  goal: "ver",
  onboarded: false,
};

type Store = {
  ready: boolean;
  profile: Profile;
  goalKcal: number;
  entries: Entry[];
  exercises: Exercise[];
  weights: WeightLog[];
  water: Record<string, number>;
  favorites: Food[];
  selectedFood: Food | null;
  selectFood: (f: Food | null) => void;
  addEntry: (e: Omit<Entry, "id">) => void;
  updateGrams: (entry: Entry, grams: number) => void;
  removeEntry: (id: string) => void;
  addExercise: (e: Omit<Exercise, "id">) => void;
  removeExercise: (id: string) => void;
  logWeight: (kg: number) => void;
  addWater: (date: string, deltaMl: number) => void;
  toggleFavorite: (f: Food) => void;
  saveProfile: (p: Profile) => void;
};

const Ctx = createContext<Store | null>(null);

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <View className="flex-1 items-center justify-center bg-bg px-8">
      <Text className="text-center text-lg font-bold text-ink">{title}</Text>
      <Text className="mt-2 text-center text-sm text-slate-500">{body}</Text>
    </View>
  );
}

function messageFor(e: any): string {
  const code = String(e?.code ?? "");
  if (code.includes("operation-not-allowed") || code.includes("admin-restricted"))
    return "Firebase Console → Authentication → Sign-in method bölümünden Anonymous girişini etkinleştir.";
  if (code.includes("permission-denied"))
    return "Firestore güvenlik kuralları erişimi engelliyor. Kuralları README'deki gibi güncelle.";
  if (code.includes("network")) return "İnternet bağlantını kontrol et.";
  return e?.message ?? "Bilinmeyen hata";
}

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function FirebaseStore({ children }: { children: React.ReactNode }) {
  // firebase.ts yalnızca yapılandırma tamamsa yüklenir
  const { auth, db } = require("./firebase") as typeof import("./firebase");

  const [uid, setUid] = useState<string | null>(null);
  const [userLoaded, setUserLoaded] = useState(false);
  const [entriesLoaded, setEntriesLoaded] = useState(false);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [favorites, setFavorites] = useState<Food[]>([]);
  const [water, setWater] = useState<Record<string, number>>({});
  const [entries, setEntries] = useState<Entry[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [weights, setWeights] = useState<WeightLog[]>([]);
  const [selectedFood, selectFood] = useState<Food | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fail = useCallback((e: any) => setError(messageFor(e)), []);

  // Anonim giriş
  useEffect(
    () =>
      onAuthStateChanged(auth, (user) => {
        if (user) setUid(user.uid);
        else signInAnonymously(auth).catch(fail);
      }),
    [auth, fail]
  );

  // Canlı dinleyiciler
  useEffect(() => {
    if (!uid) return;
    const byId = <T extends { id: string }>(a: T, b: T) => a.id.localeCompare(b.id);
    const unsubs = [
      onSnapshot(
        doc(db, "users", uid),
        (snap) => {
          const d = snap.data() ?? {};
          if (d.profile) setProfile({ ...DEFAULT_PROFILE, ...d.profile });
          setFavorites(Array.isArray(d.favorites) ? d.favorites : []);
          setWater(d.water ?? {});
          setUserLoaded(true);
        },
        fail
      ),
      onSnapshot(
        collection(db, "users", uid, "entries"),
        (snap) => {
          setEntries(
            snap.docs.map((x) => ({ ...(x.data() as Omit<Entry, "id">), id: x.id })).sort(byId)
          );
          setEntriesLoaded(true);
        },
        fail
      ),
      onSnapshot(
        collection(db, "users", uid, "exercises"),
        (snap) =>
          setExercises(
            snap.docs.map((x) => ({ ...(x.data() as Omit<Exercise, "id">), id: x.id })).sort(byId)
          ),
        fail
      ),
      onSnapshot(
        collection(db, "users", uid, "weights"),
        (snap) =>
          setWeights(
            snap.docs
              .map((x) => x.data() as WeightLog)
              .sort((a, b) => a.date.localeCompare(b.date))
          ),
        fail
      ),
    ];
    return () => unsubs.forEach((u) => u());
  }, [uid, db, fail]);

  const addEntry = useCallback(
    (e: Omit<Entry, "id">) => {
      if (!uid) return;
      setDoc(doc(db, "users", uid, "entries", newId()), e).catch(fail);
    },
    [uid, db, fail]
  );

  const updateGrams = useCallback(
    (entry: Entry, grams: number) => {
      if (!uid || entry.quick || !(entry.grams > 0) || !Number.isFinite(grams) || grams <= 0) return;
      updateDoc(doc(db, "users", uid, "entries", entry.id), resizePortion(entry, grams)).catch(fail);
    },
    [uid, db, fail]
  );

  const removeEntry = useCallback(
    (id: string) => {
      if (!uid) return;
      deleteDoc(doc(db, "users", uid, "entries", id)).catch(fail);
    },
    [uid, db, fail]
  );

  const addExercise = useCallback(
    (e: Omit<Exercise, "id">) => {
      if (!uid) return;
      setDoc(doc(db, "users", uid, "exercises", newId()), e).catch(fail);
    },
    [uid, db, fail]
  );

  const removeExercise = useCallback(
    (id: string) => {
      if (!uid) return;
      deleteDoc(doc(db, "users", uid, "exercises", id)).catch(fail);
    },
    [uid, db, fail]
  );

  const saveProfile = useCallback(
    (p: Profile) => {
      if (!uid) return;
      setProfile(p);
      setDoc(doc(db, "users", uid), { profile: p }, { merge: true }).catch(fail);
    },
    [uid, db, fail]
  );

  const logWeight = useCallback(
    (kg: number) => {
      if (!uid || kg <= 0) return;
      const date = todayKey();
      setDoc(doc(db, "users", uid, "weights", date), { date, kg }).catch(fail);
      saveProfile({ ...profile, weight: kg });
    },
    [uid, db, fail, profile, saveProfile]
  );

  const addWater = useCallback(
    (date: string, deltaMl: number) => {
      if (!uid) return;
      const next = Math.max(0, (water[date] ?? 0) + deltaMl);
      setDoc(doc(db, "users", uid), { water: { [date]: next } }, { merge: true }).catch(fail);
    },
    [uid, db, fail, water]
  );

  const toggleFavorite = useCallback(
    (f: Food) => {
      if (!uid) return;
      const exists = favorites.some((x) => x.id === f.id);
      const next = exists ? favorites.filter((x) => x.id !== f.id) : [...favorites, f];
      setDoc(doc(db, "users", uid), { favorites: next }, { merge: true }).catch(fail);
    },
    [uid, db, fail, favorites]
  );

  const value = useMemo<Store>(
    () => ({
      ready: userLoaded && entriesLoaded,
      profile,
      goalKcal: dailyGoal(profile),
      entries,
      exercises,
      weights,
      water,
      favorites,
      selectedFood,
      selectFood,
      addEntry,
      updateGrams,
      removeEntry,
      addExercise,
      removeExercise,
      logWeight,
      addWater,
      toggleFavorite,
      saveProfile,
    }),
    [
      userLoaded, entriesLoaded, profile, entries, exercises, weights, water, favorites,
      selectedFood, addEntry, removeEntry, addExercise, removeExercise, logWeight,
      addWater, toggleFavorite, saveProfile,
    ]
  );

  if (error) return <Notice title="Firebase hatası" body={error} />;

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  if (!isFirebaseConfigured) {
    return (
      <Notice
        title="Firebase ayarları eksik"
        body="src/lib/firebaseConfig.ts dosyasına Firebase Console'daki web uygulaması yapılandırmasını yapıştır."
      />
    );
  }
  return <FirebaseStore>{children}</FirebaseStore>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore, StoreProvider içinde kullanılmalı");
  return s;
}
