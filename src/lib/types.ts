import { Ionicons } from "@expo/vector-icons";

export type IconName = keyof typeof Ionicons.glyphMap;

export type MealKey = "kahvalti" | "ogle" | "aksam" | "atistirmalik";

export const MEALS: { key: MealKey; label: string; icon: IconName; hint: string }[] = [
  { key: "kahvalti", label: "Kahvaltı", icon: "sunny-outline", hint: "Güne başlangıç" },
  { key: "ogle", label: "Öğle", icon: "restaurant-outline", hint: "Öğle yemeği" },
  { key: "aksam", label: "Akşam", icon: "moon-outline", hint: "Akşam yemeği" },
  { key: "atistirmalik", label: "Atıştırmalık", icon: "cafe-outline", hint: "Meyve, kuruyemiş veya çay" },
];

export const mealLabel = (k: MealKey) => MEALS.find((m) => m.key === k)?.label ?? "";

/** Besin: değerler 100 g (veya 100 ml) içindir. */
export type Food = {
  id: string;
  name: string;
  brand?: string;
  image?: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  satFat?: number;
  sodium?: number; // mg
  serving?: { label: string; grams: number };
};

export type Entry = {
  id: string;
  date: string; // YYYY-MM-DD
  meal: MealKey;
  name: string;
  brand?: string;
  image?: string;
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  ai?: boolean; // AI kamera ile eklendi
  quick?: boolean; // hızlı kalori girişi
  food?: Food; // tekrar eklemek için 100 g değerleri
};

export type Exercise = {
  id: string;
  date: string;
  name: string;
  minutes: number;
  kcal: number;
};

export type WeightLog = { date: string; kg: number };

export type Gender = "erkek" | "kadin" | "diger";
export type Goal = "ver" | "koru" | "al";

export type Profile = {
  name: string;
  gender: Gender;
  age: number;
  height: number; // cm
  weight: number; // kg
  targetWeight: number; // kg
  activity: number; // çarpan
  goal: Goal;
  onboarded: boolean;
};

export const ACTIVITIES: { value: number; label: string; hint: string; icon: IconName }[] = [
  { value: 1.2, label: "Hareketsiz", hint: "Masa başı, az hareket", icon: "bed-outline" },
  { value: 1.375, label: "Hafif", hint: "Haftada 1-2 antrenman", icon: "walk-outline" },
  { value: 1.55, label: "Orta", hint: "Haftada 3-5 antrenman", icon: "bicycle-outline" },
  { value: 1.725, label: "Yoğun", hint: "Haftada 6+ antrenman veya bedensel iş", icon: "flash-outline" },
];

export const GOALS: { value: Goal; label: string; hint: string; delta: number; icon: IconName }[] = [
  { value: "ver", label: "Kilo ver", hint: "Günlük ihtiyacın biraz altında beslen.", delta: -500, icon: "flame-outline" },
  { value: "koru", label: "Kilonu koru", hint: "Aldığın ve harcadığın enerjiyi dengede tut.", delta: 0, icon: "scale-outline" },
  { value: "al", label: "Kas / kilo al", hint: "Günlük ihtiyacın biraz üzerinde beslen.", delta: 300, icon: "barbell-outline" },
];

export const WATER_GOAL_ML = 2500;
export const WATER_STEP_ML = 250;
