# Kalori

React Native + Expo Router + NativeWind (Tailwind CSS) ile kalori ve makro takip uygulaması.

- Besin verisi: Open Food Facts (ücretsiz, API anahtarı gerekmez) + yerleşik temel besinler
- Veritabanı: Firebase Firestore (anonim giriş)
- AI yemek tanıma: Google Gemini (ücretsiz katman)

## 0. Ayar dosyaları

Anahtar içeren ayar dosyaları güvenlik nedeniyle depoya dahil edilmedi. Klonladıktan sonra
şablonları kopyala ve değerleri doldur:

```bash
cp src/lib/firebaseConfig.example.ts src/lib/firebaseConfig.ts
cp src/lib/geminiConfig.example.ts src/lib/geminiConfig.ts
```

(Windows: `copy src\lib\firebaseConfig.example.ts src\lib\firebaseConfig.ts` ve aynısı `geminiConfig` için.)

## 1. Firebase kurulumu (bir kez)

1. https://console.firebase.google.com → **Proje ekle**.
2. **Build → Authentication → Sign-in method → Anonymous → Etkinleştir**.
3. **Build → Firestore Database → Veritabanı oluştur** (production mode).
4. Firestore → **Rules** sekmesine şunu yapıştırıp **Yayınla**:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{uid} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
       match /users/{uid}/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
     }
   }
   ```
5. **Proje ayarları → Genel → Uygulamalarınız → Web (</>)** ile bir web uygulaması kaydet
   ve `firebaseConfig` değerlerini `src/lib/firebaseConfig.ts` dosyasına yapıştır.

## 2. Gemini anahtarı (AI tarama için)

https://aistudio.google.com/apikey adresinden ücretsiz anahtar al ve
`src/lib/geminiConfig.ts` içindeki `GEMINI_API_KEY` değerine yapıştır.
Anahtar olmadan uygulamanın geri kalanı çalışır; sadece AI tarama ekranı uyarı gösterir.

## 3. Çalıştırma

```bash
npm install
npx expo start -c
```

QR kodu Expo Go ile okut (telefon ve bilgisayar aynı Wi-Fi'da olmalı; olmazsa
`npx expo start -c --tunnel`). Expo SDK 58 kullanır — Expo Go'nun güncel sürümü gerekir.

## Yapı

- `src/app/onboarding.tsx`, `plan.tsx` — hedef ayarı ve günlük plan
- `src/app/(tabs)/index.tsx` — Ana sayfa: kalan kalori, makrolar, su, öğünler
- `src/app/(tabs)/diary.tsx` — Günlük: hafta şeridi, öğünler, egzersiz
- `src/app/(tabs)/progress.tsx` — İlerleme: seri, kilo eğilimi, kalori ve makro grafikleri
- `src/app/(tabs)/profile.tsx` — Profil ve beslenme planı
- `src/app/add.tsx` — Besin arama / hızlı ekleme / hızlı kalori
- `src/app/food.tsx` — Besin detayı, porsiyon, favori
- `src/app/scan.tsx` — AI ile yemek fotoğrafı analizi (Gemini)
- `src/app/barcode.tsx` — Barkod okutma
- `src/lib/store.tsx` — Firestore verisi (`users/{uid}` + `entries`, `exercises`, `weights`)
- `src/lib/api.ts`, `gemini.ts`, `calc.ts` — API istemcileri ve hesaplamalar
