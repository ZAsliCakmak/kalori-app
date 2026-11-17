import { GEMINI_API_KEY, GEMINI_MODEL } from "./geminiConfig";

export type ScanItem = {
  name: string;
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type ScanResult = {
  name: string;
  description: string;
  items: ScanItem[];
};

const PROMPT = `Bu fotoğraftaki yemeği analiz et. Tabaktaki her besini ayrı ayrı belirle,
porsiyon miktarını gram olarak tahmin et ve her biri için kalori (kcal), protein, karbonhidrat
ve yağ (gram) değerlerini tahmin et. Tüm metinler Türkçe olsun. "name" öğünün kısa adı,
"description" tek cümlelik kısa bir tanım olsun. Fotoğrafta yiyecek veya içecek yoksa
"items" alanını boş dizi olarak döndür.`;

const SCHEMA = {
  type: "OBJECT",
  properties: {
    name: { type: "STRING" },
    description: { type: "STRING" },
    items: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          grams: { type: "NUMBER" },
          kcal: { type: "NUMBER" },
          protein: { type: "NUMBER" },
          carbs: { type: "NUMBER" },
          fat: { type: "NUMBER" },
        },
        required: ["name", "grams", "kcal", "protein", "carbs", "fat"],
      },
    },
  },
  required: ["name", "description", "items"],
};

const n = (v: unknown) => (Number.isFinite(Number(v)) ? Math.max(0, Number(v)) : 0);

/** Fotoğrafı (base64 JPEG) Gemini'ye gönderir ve tahmini besin değerlerini döndürür. */
export async function analyzeMeal(base64Jpeg: string): Promise<ScanResult> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { mimeType: "image/jpeg", data: base64Jpeg } },
              { text: PROMPT },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: SCHEMA,
          temperature: 0.2,
        },
      }),
    }
  );

  if (!res.ok) {
    let detail = "";
    try {
      detail = (await res.json())?.error?.message ?? "";
    } catch {}
    if (res.status === 429) throw new Error("Ücretsiz kullanım limiti doldu. Biraz sonra tekrar dene.");
    if (res.status === 400 || res.status === 403)
      throw new Error(`Gemini isteği reddedildi. API anahtarını kontrol et. ${detail}`);
    if (res.status === 404)
      throw new Error(`Model bulunamadı (${GEMINI_MODEL}). geminiConfig.ts içindeki model adını güncelle.`);
    throw new Error(`Gemini hatası (${res.status}). ${detail}`);
  }

  const json = await res.json();
  const text: string = (json?.candidates?.[0]?.content?.parts ?? [])
    .filter((p: any) => typeof p?.text === "string" && !p.thought)
    .map((p: any) => p.text)
    .join("");
  if (!text) throw new Error("Yapay zekâdan yanıt alınamadı. Tekrar dene.");

  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Yapay zekâ yanıtı okunamadı. Tekrar dene.");
  }

  const items: ScanItem[] = (Array.isArray(data.items) ? data.items : [])
    .map((i: any) => ({
      name: String(i?.name ?? "").trim(),
      grams: Math.round(n(i?.grams)),
      kcal: Math.round(n(i?.kcal)),
      protein: n(i?.protein),
      carbs: n(i?.carbs),
      fat: n(i?.fat),
    }))
    .filter((i: ScanItem) => i.name);

  return {
    name: String(data.name ?? "").trim() || "Öğün",
    description: String(data.description ?? "").trim(),
    items,
  };
}
