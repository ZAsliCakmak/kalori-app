import { Food } from "./types";

/**
 * Open Food Facts — ücretsiz, API anahtarı gerektirmeyen açık besin veritabanı.
 * https://world.openfoodfacts.org/data
 */
const HOST = "https://world.openfoodfacts.org";
const FIELDS =
  "code,product_name,product_name_tr,brands,nutriments,image_front_small_url,image_front_url,serving_size,serving_quantity";
const HEADERS = { "User-Agent": "KaloriApp/1.0 (Expo; React Native)" };

const num = (v: unknown): number => {
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
};
const opt = (v: unknown): number | undefined =>
  v === undefined || v === null || v === "" ? undefined : num(v);

function mapProduct(p: any): Food | null {
  const n = p?.nutriments ?? {};
  let kcal = num(n["energy-kcal_100g"]);
  if (!kcal && n["energy_100g"]) kcal = num(n["energy_100g"]) / 4.184; // kJ → kcal
  const name = String(p?.product_name_tr || p?.product_name || "").trim();
  if (!name || !kcal) return null; // kalori bilgisi olmayanları gösterme

  const servingGrams = num(p.serving_quantity);
  const sodiumG = opt(n["sodium_100g"]);
  return {
    id: String(p.code),
    name,
    brand: p.brands ? String(p.brands).split(",")[0].trim() : undefined,
    image: p.image_front_url || p.image_front_small_url || undefined,
    kcal: Math.round(kcal),
    protein: num(n["proteins_100g"]),
    carbs: num(n["carbohydrates_100g"]),
    fat: num(n["fat_100g"]),
    fiber: opt(n["fiber_100g"]),
    sugar: opt(n["sugars_100g"]),
    satFat: opt(n["saturated-fat_100g"]),
    sodium: sodiumG === undefined ? undefined : Math.round(sodiumG * 1000),
    serving:
      servingGrams > 0
        ? { label: String(p.serving_size || `${servingGrams} g`), grams: servingGrams }
        : undefined,
  };
}

export async function searchFoods(query: string, signal?: AbortSignal): Promise<Food[]> {
  const url =
    `${HOST}/cgi/search.pl?search_terms=${encodeURIComponent(query)}` +
    `&search_simple=1&action=process&json=1&page_size=30&fields=${FIELDS}`;
  const res = await fetch(url, { signal, headers: HEADERS });
  if (!res.ok) throw new Error(`Sunucu hatası (${res.status})`);
  const json = await res.json();
  const foods: Food[] = [];
  for (const p of json.products ?? []) {
    const f = mapProduct(p);
    if (f) foods.push(f);
  }
  return foods;
}

/** Barkoddan ürün getirir; bulunamazsa null döner. */
export async function getByBarcode(code: string): Promise<Food | null> {
  const res = await fetch(
    `${HOST}/api/v2/product/${encodeURIComponent(code)}.json?fields=${FIELDS}`,
    { headers: HEADERS }
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Sunucu hatası (${res.status})`);
  const json = await res.json();
  if (!json.product) return null;
  return mapProduct({ code, ...json.product });
}
