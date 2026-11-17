/**
 * Firebase Console → Proje ayarları → Genel → "Uygulamalarınız" → Web uygulaması (</>)
 * bölümündeki firebaseConfig değerlerini buraya yapıştır.
 */
export const firebaseConfig = {
  apiKey: "BURAYA_YAPISTIR",
  authDomain: "BURAYA_YAPISTIR",
  projectId: "BURAYA_YAPISTIR",
  storageBucket: "BURAYA_YAPISTIR",
  messagingSenderId: "BURAYA_YAPISTIR",
  appId: "BURAYA_YAPISTIR",
};

export const isFirebaseConfigured = !Object.values(firebaseConfig).some(
  (v) => !v || v === "BURAYA_YAPISTIR"
);
