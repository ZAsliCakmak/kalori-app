import { Entry, GOALS, MealKey, Profile } from "./types";

/** Mifflin-St Jeor denklemi ile bazal metabolizma hızı (kcal/gün). */
export function bmr(p: Profile): number {
  const base = 10 * p.weight + 6.25 * p.height - 5 * p.age;
  const offset = p.gender === "erkek" ? 5 : p.gender === "kadin" ? -161 : -78;
  return Math.round(base + offset);
}

/** Günlük toplam enerji harcaması. */
export function tdee(p: Profile): number {
  return Math.round(bmr(p) * p.activity);
}

export function goalDelta(p: Profile): number {
  return GOALS.find((g) => g.value === p.goal)?.delta ?? 0;
}

/** Hedefe göre günlük kalori hedefi. */
export function dailyGoal(p: Profile): number {
  return Math.max(1200, tdee(p) + goalDelta(p));
}

/** Makro dağılımı: %30 protein, %45 karbonhidrat, %25 yağ. */
export const MACRO_SPLIT = { protein: 0.3, carbs: 0.45, fat: 0.25 };

export function macroTargets(kcal: number) {
  return {
    protein: Math.round((kcal * MACRO_SPLIT.protein) / 4),
    carbs: Math.round((kcal * MACRO_SPLIT.carbs) / 4),
    fat: Math.round((kcal * MACRO_SPLIT.fat) / 9),
  };
}

/** Hedef kiloya tahmini varış tarihi (1 kg ≈ 7700 kcal). Hesaplanamıyorsa null. */
export function targetDate(p: Profile): Date | null {
  const diff = p.targetWeight - p.weight;
  const delta = dailyGoal(p) - tdee(p);
  if (!diff || !delta || Math.sign(diff) !== Math.sign(delta)) return null;
  const days = Math.ceil((Math.abs(diff) * 7700) / Math.abs(delta));
  if (days > 730) return null;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

// ---- Tarih yardımcıları ----

const MONTHS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
export const DAYS_SHORT = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

export function todayKey(d = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function keyToDate(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function shiftDate(key: string, days: number): string {
  const d = keyToDate(key);
  d.setDate(d.getDate() + days);
  return todayKey(d);
}

export function shortDate(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function formatDate(key: string): string {
  const today = todayKey();
  if (key === today) return "Bugün";
  if (key === shiftDate(today, -1)) return "Dün";
  if (key === shiftDate(today, 1)) return "Yarın";
  return shortDate(keyToDate(key));
}

/** Verilen günün haftası (Pazartesi başlangıçlı) — 7 tarih anahtarı. */
export function weekOf(key: string): string[] {
  const d = keyToDate(key);
  const offset = (d.getDay() + 6) % 7;
  const monday = shiftDate(key, -offset);
  return Array.from({ length: 7 }, (_, i) => shiftDate(monday, i));
}

/** Bugünden geriye doğru n gün (eskiden yeniye). */
export function lastDays(n: number): string[] {
  const today = todayKey();
  return Array.from({ length: n }, (_, i) => shiftDate(today, i - (n - 1)));
}

/** Art arda kayıt girilen gün sayısı (bugün boşsa dünden sayar). */
export function streak(entries: Entry[]): number {
  const days = new Set(entries.map((e) => e.date));
  let cur = todayKey();
  if (!days.has(cur)) cur = shiftDate(cur, -1);
  let n = 0;
  while (days.has(cur)) {
    n++;
    cur = shiftDate(cur, -1);
  }
  return n;
}

export function mealForNow(): MealKey {
  const h = new Date().getHours();
  if (h < 11) return "kahvalti";
  if (h < 15) return "ogle";
  if (h < 18) return "atistirmalik";
  return "aksam";
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "İyi geceler";
  if (h < 12) return "Günaydın";
  if (h < 18) return "İyi günler";
  return "İyi akşamlar";
}

// ---- Sayı yardımcıları ----

/** "12,5" gibi virgüllü girişleri de sayıya çevirir. */
export function parseNum(s: string): number {
  const n = parseFloat(String(s).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export const round1 = (n: number) => Math.round(n * 10) / 10;

/** 2150 → "2.150" */
export function fmt(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** 64.2 → "64,2" */
export function resizePortion(entry: Entry, grams: number) {
  const base = entry.food ?? entry.portionBasis ?? {
    kcal: entry.kcal * 100 / entry.grams,
    protein: entry.protein * 100 / entry.grams,
    carbs: entry.carbs * 100 / entry.grams,
    fat: entry.fat * 100 / entry.grams,
  };
  const scale = grams / 100;
  return {
    grams,
    kcal: round1(base.kcal * scale),
    protein: round1(base.protein * scale),
    carbs: round1(base.carbs * scale),
    fat: round1(base.fat * scale),
    ...(!entry.food && !entry.portionBasis ? { portionBasis: base } : {}),
  };
}

export function fmt1(n: number): string {
  return round1(n).toFixed(1).replace(".", ",");
}

export function sumEntries(list: { kcal: number; protein: number; carbs: number; fat: number }[]) {
  return list.reduce(
    (t, e) => ({
      kcal: t.kcal + e.kcal,
      protein: t.protein + e.protein,
      carbs: t.carbs + e.carbs,
      fat: t.fat + e.fat,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );
}
