import { Food } from "./types";

/** İnternet olmadan da çalışan, sık tüketilen temel besinler (100 g için yaklaşık değerler). */
const raw: [string, number, number, number, number, string, number][] = [
  // ad, kcal, protein, karbonhidrat, yağ, porsiyon adı, porsiyon gramı
  ["Yumurta (haşlanmış)", 155, 13, 1.1, 11, "1 adet", 50],
  ["Beyaz peynir", 264, 14, 4, 21, "1 dilim", 30],
  ["Kaşar peyniri", 350, 25, 2, 27, "1 dilim", 20],
  ["Zeytin (siyah)", 235, 1.6, 6, 22, "5 adet", 20],
  ["Ekmek (beyaz)", 265, 9, 49, 3.2, "1 dilim", 25],
  ["Tam buğday ekmeği", 247, 13, 41, 3.4, "1 dilim", 30],
  ["Simit", 320, 10, 58, 6, "1 adet", 100],
  ["Yoğurt (tam yağlı)", 61, 3.5, 4.7, 3.3, "1 kâse", 200],
  ["Süt (tam yağlı)", 61, 3.2, 4.8, 3.3, "1 bardak", 200],
  ["Ayran", 37, 1.7, 2.6, 2, "1 bardak", 200],
  ["Pirinç pilavı", 130, 2.7, 28, 0.3, "1 porsiyon", 150],
  ["Bulgur pilavı", 110, 3.1, 19, 2.5, "1 porsiyon", 150],
  ["Makarna (haşlanmış)", 158, 5.8, 31, 0.9, "1 porsiyon", 180],
  ["Mercimek çorbası", 56, 3.3, 8.5, 1.1, "1 kâse", 250],
  ["Kuru fasulye (pişmiş)", 127, 8.7, 22.8, 0.5, "1 porsiyon", 200],
  ["Tavuk göğsü (ızgara)", 165, 31, 0, 3.6, "1 porsiyon", 150],
  ["Köfte (ızgara)", 250, 18, 6, 17, "4 adet", 120],
  ["Dana eti (yağsız, pişmiş)", 217, 26, 0, 12, "1 porsiyon", 120],
  ["Somon (pişmiş)", 206, 22, 0, 12, "1 fileto", 150],
  ["Ton balığı (konserve)", 116, 26, 0, 1, "1 kutu", 80],
  ["Patates (haşlanmış)", 87, 1.9, 20, 0.1, "1 orta boy", 150],
  ["Domates", 18, 0.9, 3.9, 0.2, "1 orta boy", 120],
  ["Salatalık", 15, 0.7, 3.6, 0.1, "1 adet", 120],
  ["Elma", 52, 0.3, 14, 0.2, "1 orta boy", 180],
  ["Muz", 89, 1.1, 23, 0.3, "1 orta boy", 120],
  ["Portakal", 47, 0.9, 12, 0.1, "1 orta boy", 150],
  ["Üzüm", 69, 0.7, 18, 0.2, "1 kâse", 150],
  ["Karpuz", 30, 0.6, 7.6, 0.2, "1 dilim", 250],
  ["Yulaf ezmesi", 389, 17, 66, 7, "4 yemek kaşığı", 40],
  ["Bal", 304, 0.3, 82, 0, "1 tatlı kaşığı", 10],
  ["Zeytinyağı", 884, 0, 0, 100, "1 yemek kaşığı", 14],
  ["Tereyağı", 717, 0.9, 0.1, 81, "1 tatlı kaşığı", 10],
  ["Ceviz", 654, 15, 14, 65, "1 avuç", 30],
  ["Badem", 579, 21, 22, 50, "1 avuç", 30],
  ["Fındık", 628, 15, 17, 61, "1 avuç", 30],
  ["Baklava", 430, 6, 50, 23, "1 dilim", 40],
  ["Türk kahvesi (sade)", 2, 0.1, 0.3, 0, "1 fincan", 60],
];

export const COMMON_FOODS: Food[] = raw.map(
  ([name, kcal, protein, carbs, fat, label, grams], i) => ({
    id: `local-${i}`,
    name,
    kcal,
    protein,
    carbs,
    fat,
    serving: { label, grams },
  })
);

const norm = (s: string) => s.toLocaleLowerCase("tr-TR");

export function searchCommon(query: string): Food[] {
  const q = norm(query.trim());
  if (!q) return COMMON_FOODS;
  return COMMON_FOODS.filter((f) => norm(f.name).includes(q));
}
