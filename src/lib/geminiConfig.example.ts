/**
 * AI kamera (yemek tanıma) için Gemini API anahtarı.
 * https://aistudio.google.com/apikey adresinden ücretsiz anahtar al ve buraya yapıştır.
 */
export const GEMINI_API_KEY = "BURAYA_YAPISTIR";

/** Ücretsiz katmanda kullanılabilen, görsel girdi destekleyen model. */
export const GEMINI_MODEL = "gemini-3.8-flash";

export const isGeminiConfigured =
  !!GEMINI_API_KEY && GEMINI_API_KEY !== "BURAYA_YAPISTIR";
