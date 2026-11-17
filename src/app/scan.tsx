import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from "react-native";
import { Bar, COLORS, Card, Chip, IconBubble, PrimaryButton, Screen, StackHeader } from "@/components/ui";
import { fmt, mealForNow, round1, todayKey } from "@/lib/calc";
import { ScanResult, analyzeMeal } from "@/lib/gemini";
import { isGeminiConfigured } from "@/lib/geminiConfig";
import { useStore } from "@/lib/store";
import { MEALS, MealKey } from "@/lib/types";

export default function ScanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ meal?: string; date?: string }>();
  const { goalKcal, addEntry } = useStore();

  const [uri, setUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [mult, setMult] = useState(1);
  const [meal, setMeal] = useState<MealKey>(
    MEALS.some((m) => m.key === params.meal) ? (params.meal as MealKey) : mealForNow()
  );

  const pick = async (source: "camera" | "library") => {
    setError(null);
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ["images"],
      quality: 0.4,
      base64: true,
    };
    let res: ImagePicker.ImagePickerResult;
    if (source === "camera") {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        setError("Fotoğraf çekmek için kamera izni gerekiyor.");
        return;
      }
      res = await ImagePicker.launchCameraAsync(options);
    } else {
      res = await ImagePicker.launchImageLibraryAsync(options);
    }
    const asset = res.canceled ? null : res.assets?.[0];
    if (!asset?.base64) return;

    setUri(asset.uri);
    setResult(null);
    setMult(1);
    setLoading(true);
    try {
      const r = await analyzeMeal(asset.base64);
      if (r.items.length === 0) setError("Fotoğrafta yiyecek bulunamadı. Tekrar dene.");
      else setResult(r);
    } catch (e: any) {
      setError(e?.message ?? "Analiz başarısız oldu.");
    } finally {
      setLoading(false);
    }
  };

  const total = (result?.items ?? []).reduce(
    (t, i) => ({
      grams: t.grams + i.grams * mult,
      kcal: t.kcal + i.kcal * mult,
      protein: t.protein + i.protein * mult,
      carbs: t.carbs + i.carbs * mult,
      fat: t.fat + i.fat * mult,
    }),
    { grams: 0, kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const confirm = () => {
    if (!result) return;
    addEntry({
      date: params.date || todayKey(),
      meal,
      name: result.name,
      grams: Math.round(total.grams),
      kcal: round1(total.kcal),
      protein: round1(total.protein),
      carbs: round1(total.carbs),
      fat: round1(total.fat),
      ai: true,
    });
    if (router.canDismiss()) router.dismissAll();
  };

  const macroMax = Math.max(total.protein, total.carbs, total.fat, 1);

  return (
    <Screen>
      <StackHeader title="AI tarama" />
      <ScrollView contentContainerClassName="px-4 pb-8">
        {!isGeminiConfigured ? (
          <Card>
            <Text className="text-lg font-bold text-ink">Gemini anahtarı eksik</Text>
            <Text className="mt-1 text-sm text-slate-600">
              AI taramayı kullanmak için aistudio.google.com/apikey adresinden ücretsiz bir anahtar al
              ve src/lib/geminiConfig.ts dosyasına yapıştır.
            </Text>
          </Card>
        ) : (
          <>
            {uri ? (
              <View className="overflow-hidden rounded-3xl bg-black">
                <Image source={{ uri }} className="h-72 w-full" resizeMode="cover" />
                <View className="absolute left-3 top-3 flex-row items-center rounded-full bg-ink/80 px-3 py-2">
                  <Ionicons name="sparkles" size={14} color="#4ADE80" />
                  <Text className="ml-2 text-xs font-bold text-white">
                    {loading ? "Analiz ediliyor…" : "AI analizi"}
                  </Text>
                </View>
                {loading ? (
                  <View className="absolute inset-0 items-center justify-center bg-black/40">
                    <ActivityIndicator size="large" color="#fff" />
                  </View>
                ) : null}
              </View>
            ) : (
              <Card className="items-center py-10">
                <IconBubble name="camera-outline" size={72} bg="bg-brand-soft" color={COLORS.brandDark} />
                <Text className="mt-4 text-xl font-extrabold text-ink">Tabağının fotoğrafını çek</Text>
                <Text className="mt-1 text-center text-sm text-slate-600">
                  Yapay zekâ tabaktaki besinleri tanır; kalori ve makroları tahmin eder.
                </Text>
              </Card>
            )}

            {error ? <Text className="mt-3 text-center text-sm text-fat">{error}</Text> : null}

            {result ? (
              <>
                <Card className="mt-3">
                  <View className="flex-row items-start">
                    <View className="flex-1 pr-3">
                      <Text className="text-[11px] font-bold tracking-widest text-brand-dark">
                        AI TAHMİNİ
                      </Text>
                      <Text className="text-2xl font-extrabold text-ink">{result.name}</Text>
                      {result.description ? (
                        <Text className="mt-1 text-sm text-slate-600">{result.description}</Text>
                      ) : null}
                    </View>
                    <View className="items-end">
                      <Text className="text-4xl font-extrabold text-ink">{fmt(total.kcal)}</Text>
                      <Text className="text-xs text-slate-500">kcal</Text>
                      <Text className="mt-1 text-xs font-bold text-brand-dark">
                        günlük hedefin %{Math.round((total.kcal / goalKcal) * 100)}'i
                      </Text>
                    </View>
                  </View>

                  <View className="-mx-1 mt-4 flex-row">
                    {[
                      { label: "Protein", value: total.protein, color: COLORS.protein },
                      { label: "Karb.", value: total.carbs, color: COLORS.carbs },
                      { label: "Yağ", value: total.fat, color: COLORS.fat },
                    ].map((m) => (
                      <View key={m.label} className="mx-1 flex-1 rounded-2xl bg-bg p-3">
                        <Text className="text-xs text-slate-600">{m.label}</Text>
                        <Text className="mb-2 text-2xl font-extrabold text-ink">
                          {Math.round(m.value)}
                          <Text className="text-sm font-semibold"> g</Text>
                        </Text>
                        <Bar pct={(m.value / macroMax) * 100} color={m.color} />
                      </View>
                    ))}
                  </View>

                  <View className="mt-4">
                    {result.items.map((i, idx) => (
                      <View key={idx} className="flex-row items-center border-t border-slate-100 py-2.5">
                        <View className="mr-3 h-2.5 w-2.5 rounded-full bg-brand" />
                        <Text className="flex-1 text-sm font-semibold text-ink" numberOfLines={1}>
                          {i.name}
                        </Text>
                        <Text className="text-xs text-slate-600">
                          ~{Math.round(i.grams * mult)} g • {fmt(i.kcal * mult)} kcal
                        </Text>
                      </View>
                    ))}
                  </View>

                  <View className="mt-3 rounded-2xl bg-bg p-3">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm font-semibold text-ink">Porsiyon çarpanı</Text>
                      <Text className="text-lg font-extrabold text-brand-dark">
                        {String(mult).replace(".", ",")}x (%{Math.round(mult * 100)})
                      </Text>
                    </View>
                    <View className="mt-2 flex-row items-center">
                      <Pressable
                        onPress={() => setMult((m) => Math.max(0.25, m - 0.25))}
                        className="h-10 w-10 items-center justify-center rounded-full bg-white"
                      >
                        <Ionicons name="remove" size={20} color={COLORS.ink} />
                      </Pressable>
                      <View className="mx-3 flex-1">
                        <Bar pct={(mult / 3) * 100} color={COLORS.brand} height={8} />
                      </View>
                      <Pressable
                        onPress={() => setMult((m) => Math.min(3, m + 0.25))}
                        className="h-10 w-10 items-center justify-center rounded-full bg-white"
                      >
                        <Ionicons name="add" size={20} color={COLORS.ink} />
                      </Pressable>
                    </View>
                  </View>
                </Card>

                <Text className="mb-2 mt-4 text-xs font-bold tracking-widest text-slate-600">ÖĞÜN</Text>
                <View className="flex-row flex-wrap">
                  {MEALS.map((m) => (
                    <Chip key={m.key} label={m.label} active={meal === m.key} dark onPress={() => setMeal(m.key)} />
                  ))}
                </View>

                <View className="mt-2">
                  <PrimaryButton label="Onayla ve ekle" icon="checkmark-circle-outline" onPress={confirm} />
                </View>
                <Text className="mt-3 text-center text-xs text-slate-500">
                  Değerler fotoğraftan yapılan tahmindir; gerçek değerler farklı olabilir.
                </Text>
              </>
            ) : null}

            {!loading ? (
              <View className="mt-4 flex-row">
                <Pressable
                  onPress={() => pick("library")}
                  className="mr-2 h-14 flex-1 flex-row items-center justify-center rounded-full bg-pill"
                >
                  <Ionicons name="images-outline" size={20} color={COLORS.ink} />
                  <Text className="ml-2 text-sm font-bold text-ink">Galeriden seç</Text>
                </Pressable>
                <Pressable
                  onPress={() => pick("camera")}
                  className={`h-14 flex-1 flex-row items-center justify-center rounded-full ${
                    result ? "bg-pill" : "bg-brand"
                  }`}
                >
                  <Ionicons name={result ? "refresh" : "camera"} size={20} color={result ? COLORS.ink : "#fff"} />
                  <Text className={`ml-2 text-sm font-bold ${result ? "text-ink" : "text-white"}`}>
                    {result ? "Tekrar tara" : "Fotoğraf çek"}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
