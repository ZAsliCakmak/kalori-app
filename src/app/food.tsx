import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, Card, Donut, IconBubble, Screen, StackHeader } from "@/components/ui";
import { fmt, fmt1, mealForNow, parseNum, round1, todayKey } from "@/lib/calc";
import { useStore } from "@/lib/store";
import { IconName, MEALS, MealKey } from "@/lib/types";

const MULTS = [0.5, 1, 1.5, 2];

export default function FoodScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ meal?: string; date?: string }>();
  const { selectedFood: food, favorites, goalKcal, addEntry, toggleFavorite } = useStore();

  const base = food?.serving?.grams ?? 100;
  const [meal, setMeal] = useState<MealKey>(
    MEALS.some((m) => m.key === params.meal) ? (params.meal as MealKey) : mealForNow()
  );
  const [gramsText, setGramsText] = useState(String(Math.round(base)));

  if (!food) {
    return (
      <Screen>
        <StackHeader title="Besin" />
        <View className="flex-1 items-center justify-center">
          <Text className="text-slate-500">Besin seçilmedi.</Text>
        </View>
      </Screen>
    );
  }

  const grams = parseNum(gramsText);
  const mult = grams / base;
  const k = grams / 100;
  const kcal = food.kcal * k;
  const p = food.protein * k;
  const c = food.carbs * k;
  const f = food.fat * k;
  const macroKcal = p * 4 + c * 4 + f * 9;
  const isFav = favorites.some((x) => x.id === food.id);

  const setMult = (m: number) => setGramsText(String(Math.round(base * Math.max(0.5, m))));

  const save = () => {
    if (grams <= 0) return;
    addEntry({
      date: params.date || todayKey(),
      meal,
      name: food.name,
      brand: food.brand,
      image: food.image,
      grams: round1(grams),
      kcal: round1(kcal),
      protein: round1(p),
      carbs: round1(c),
      fat: round1(f),
      food,
    });
    if (router.canDismiss()) router.dismissAll();
  };

  const macros = [
    { label: "Protein", value: p, kcal: p * 4, color: COLORS.brandDark },
    { label: "Karbonhidrat", value: c, kcal: c * 4, color: COLORS.carbs },
    { label: "Yağ", value: f, kcal: f * 9, color: COLORS.protein },
  ];
  const top = [...macros].sort((a, b) => b.kcal - a.kcal)[0];

  const details: { label: string; icon: IconName; value?: number; unit: string }[] = [
    { label: "Lif", icon: "leaf-outline", value: food.fiber, unit: "g" },
    { label: "Şeker", icon: "water-outline", value: food.sugar, unit: "g" },
    { label: "Doymuş yağ", icon: "ellipse-outline", value: food.satFat, unit: "g" },
    { label: "Sodyum", icon: "apps-outline", value: food.sodium, unit: "mg" },
  ].filter((d) => d.value !== undefined) as any;

  return (
    <Screen>
      <StackHeader title="Besin detayı" />
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerClassName="pb-6" keyboardShouldPersistTaps="handled">
          {food.image ? (
            <Image source={{ uri: food.image }} className="h-56 w-full bg-pill" resizeMode="cover" />
          ) : null}

          <View className={`px-4 ${food.image ? "-mt-6" : ""}`}>
            <Card>
              <View className="flex-row items-start">
                <View className="flex-1 pr-3">
                  {food.brand ? (
                    <View className="mb-2 self-start rounded-full bg-pill px-3 py-1">
                      <Text className="text-xs text-ink">{food.brand}</Text>
                    </View>
                  ) : null}
                  <Text className="text-2xl font-extrabold text-ink">{food.name}</Text>
                  <Text className="mt-1 text-sm text-slate-600">100 g: {fmt(food.kcal)} kcal</Text>
                </View>
                <View className="items-end">
                  <Pressable onPress={() => toggleFavorite(food)} hitSlop={10} className="mb-2">
                    <Ionicons
                      name={isFav ? "heart" : "heart-outline"}
                      size={26}
                      color={isFav ? "#E11D48" : COLORS.ink}
                    />
                  </Pressable>
                  <Text className="text-4xl font-extrabold text-brand-dark">{fmt(kcal)}</Text>
                  <Text className="text-xs text-slate-500">kcal • seçili porsiyon</Text>
                </View>
              </View>
            </Card>

            {/* Porsiyon */}
            <Card className="mt-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-bold text-ink">Porsiyon</Text>
                <Text className="text-xs font-semibold text-brand-dark">
                  {food.serving ? `${food.serving.label} (${Math.round(base)} g)` : "100 g"}
                </Text>
              </View>
              <View className="mt-3 flex-row items-center rounded-2xl bg-pill p-2">
                <Pressable
                  onPress={() => setMult(mult - 0.5)}
                  className="h-12 w-12 items-center justify-center rounded-full bg-white"
                >
                  <Ionicons name="remove" size={22} color={COLORS.ink} />
                </Pressable>
                <View className="flex-1 items-center">
                  <View className="flex-row items-end">
                    <TextInput
                      value={gramsText}
                      onChangeText={setGramsText}
                      keyboardType="decimal-pad"
                      selectTextOnFocus
                      className="min-w-[60px] p-0 text-center text-3xl font-extrabold text-ink"
                    />
                    <Text className="mb-1 ml-1 text-base font-semibold text-ink">g</Text>
                  </View>
                  <Text className="text-xs text-slate-600">{fmt1(mult)} porsiyon</Text>
                </View>
                <Pressable
                  onPress={() => setMult(mult + 0.5)}
                  className="h-12 w-12 items-center justify-center rounded-full bg-white"
                >
                  <Ionicons name="add" size={22} color={COLORS.ink} />
                </Pressable>
              </View>
              <View className="-mx-1 mt-3 flex-row">
                {MULTS.map((m) => {
                  const active = Math.abs(mult - m) < 0.01;
                  return (
                    <Pressable
                      key={m}
                      onPress={() => setMult(m)}
                      className={`mx-1 flex-1 items-center rounded-full py-2 ${active ? "bg-brand-dark" : "bg-pill"}`}
                    >
                      <Text className={`text-sm font-bold ${active ? "text-white" : "text-ink"}`}>
                        {String(m).replace(".", ",")}x
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Card>

            {/* Makrolar */}
            <Card className="mt-3">
              <Text className="mb-3 text-lg font-bold text-ink">Makro besinler</Text>
              <View className="flex-row items-center">
                <Donut size={112} parts={macros.map((m) => ({ value: m.kcal, color: m.color }))}>
                  <Text className="text-xs text-slate-600">{top.label}</Text>
                  <Text className="text-xl font-extrabold text-ink">
                    %{macroKcal ? Math.round((top.kcal / macroKcal) * 100) : 0}
                  </Text>
                </Donut>
                <View className="ml-4 flex-1">
                  {macros.map((m) => (
                    <View key={m.label} className="mb-2 flex-row items-center rounded-full bg-bg px-3 py-2">
                      <View className="mr-2 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: m.color }} />
                      <Text className="flex-1 text-sm text-ink">{m.label}</Text>
                      <Text className="text-base font-extrabold text-ink">{fmt1(m.value)} g</Text>
                    </View>
                  ))}
                </View>
              </View>
            </Card>

            {/* Besin değerleri */}
            {details.length > 0 ? (
              <Card className="mt-3">
                <Text className="mb-1 text-lg font-bold text-ink">Besin değerleri</Text>
                {details.map((d) => (
                  <View key={d.label} className="flex-row items-center border-b border-slate-100 py-2.5">
                    <Ionicons name={d.icon} size={18} color={COLORS.ink} />
                    <Text className="ml-3 flex-1 text-sm text-ink">{d.label}</Text>
                    <Text className="text-sm font-bold text-ink">
                      {d.unit === "mg" ? fmt((d.value ?? 0) * k) : fmt1((d.value ?? 0) * k)} {d.unit}
                    </Text>
                  </View>
                ))}
              </Card>
            ) : null}

            {/* Öğün */}
            <Card className="mt-3">
              <Text className="mb-3 text-lg font-bold text-ink">Öğüne ekle</Text>
              <View className="-mx-1 flex-row">
                {MEALS.map((m) => {
                  const active = meal === m.key;
                  return (
                    <Pressable
                      key={m.key}
                      onPress={() => setMeal(m.key)}
                      className={`mx-1 flex-1 items-center rounded-2xl py-3 ${active ? "bg-brand-dark" : "bg-pill"}`}
                    >
                      <Ionicons name={m.icon} size={20} color={active ? "#fff" : COLORS.ink} />
                      <Text
                        className={`mt-1 text-[11px] font-bold ${active ? "text-white" : "text-ink"}`}
                        numberOfLines={1}
                      >
                        {m.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Card>

            <Text className="mt-3 text-center text-xs text-slate-500">
              Değerler yaklaşıktır • günlük hedefin %{Math.round((kcal / goalKcal) * 100)}'i
            </Text>
          </View>
        </ScrollView>

        <View
          className="flex-row items-center border-t border-slate-100 bg-white px-5 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        >
          <View className="flex-1">
            <Text className="text-xs text-slate-600">Eklenecek toplam</Text>
            <Text className="text-lg font-extrabold text-ink">
              {fmt(kcal)} kcal <Text className="text-xs font-bold text-brand-dark">• {Math.round(p)}g protein</Text>
            </Text>
          </View>
          <Pressable
            onPress={save}
            disabled={grams <= 0}
            className={`h-14 flex-row items-center rounded-full px-6 ${
              grams > 0 ? "bg-brand-dark active:opacity-80" : "bg-slate-300"
            }`}
          >
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text className="ml-2 text-base font-bold text-white">Günlüğe ekle</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
