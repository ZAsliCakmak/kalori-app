import { mealLabel, type Entry, type Exercise, type WeightLog } from "./types";

type Diary = {
  entries: Entry[];
  exercises: Exercise[];
  water: Record<string, number>;
  weights: WeightLog[];
};

function cell(value: string | number = "") {
  if (typeof value === "number") return String(value);
  // Kullanıcının yazdığı adları hesap tablosunda metin olarak koru.
  const text = /^[\s]*[=+@-]|^[\t\r\n]/.test(value) ? "'" + value : value;
  return '"' + text.replace(/"/g, '""') + '"';
}

export function diaryCsv({ entries, exercises, water, weights }: Diary): string | null {
  const header = ["Tarih", "Tür", "Öğün", "Ad", "Gram", "Kalori (kcal)", "Protein (g)",
    "Karbonhidrat (g)", "Yağ (g)", "Süre (dk)", "Su (ml)", "Kilo (kg)"];
  const rows: (string | number)[][] = [];
  for (const e of entries) {
    rows.push([e.date, "Besin", mealLabel(e.meal), e.name, e.grams, e.kcal, e.protein,
      e.carbs, e.fat, "", "", ""]);
  }
  for (const e of exercises) {
    rows.push([e.date, "Egzersiz", "", e.name, "", e.kcal, "", "", "", e.minutes, "", ""]);
  }
  for (const [date, ml] of Object.entries(water)) {
    rows.push([date, "Su", "", "", "", "", "", "", "", "", ml, ""]);
  }
  for (const w of weights) {
    rows.push([w.date, "Kilo", "", "", "", "", "", "", "", "", "", w.kg]);
  }
  if (!rows.length) return null;
  rows.sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  return "\uFEFF" + [header, ...rows].map(row => row.map(cell).join(",")).join("\r\n") + "\r\n";
}
