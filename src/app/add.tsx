import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FormModal } from "@/components/FormModal";
import { COLORS, Chip, IconBubble, MacroLine, Screen, StackHeader } from "@/components/ui";
import { searchFoods } from "@/lib/api";
import { fmt, mealForNow, parseNum, round1, sumEntries, todayKey } from "@/lib/calc";
import { COMMON_FOODS, searchCommon } from "@/lib/commonFoods";
import { useStore } from "@/lib/store";
import { Food, MEALS, MealKey, mealLabel } from "@/lib/types";

type Tab = "recent" | "fav" | "common";

const portion = (f: Food) => f.serving?.grams ?? 100;

export default function AddScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ meal?: string; date?: string }>();
  const { entries, exercises, favorites, goalKcal, selectFood, addEntry } = useStore();

  const date = params.date || todayKey();
  const [meal, setMeal] = useState<MealKey>(
    MEALS.some((m) => m.key === params.meal) ? (params.meal as MealKey) : mealForNow()
  );
  const [mealOpen, setMealOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("recent");
  const [query, setQuery] = useState("");
  const [remote, setRemote] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [staged, setStaged] = useState<Food[]>([]);
  const [quickOpen, setQuickOpen] = useState(false);

  // Yazmayı bırakınca (800 ms; arama limiti dakikada 10 istek) Open Food Facts'te ara
  useEffect(() => {
    const q = query.trim();
    setError(null);
    if (q.length < 2) {
      setRemote([]);
      setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        setRemote(await searchFoods(q, ctrl.signal));
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setRemote([]);
        setError("Çevrimiçi sonuçlar alınamadı. Bağlantını kontrol edip tekrar dene.");
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 800);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  // Son eklenenler: günlükteki kayıtlardan, en yeniden eskiye, tekrarsız
  const recents = useMemo(() => {
    const seen = new Set<string>();
    const out: Food[] = [];
    for (let i = entries.length - 1; i >= 0 && out.length < 20; i--) {
      const f = entries[i].food;
      if (f && !seen.has(f.id)) {
        seen.add(f.id);
        out.push(f);
      }
    }
    return out;
  }, [entries]);

  const searching = query.trim().length > 0;
  const data = searching
    ? [...searchCommon(query), ...remote]
    : tab === "recent"
      ? recents
      : tab === "fav"
        ? favorites
        : COMMON_FOODS;

  const left =
    goalKcal -
    sumEntries(entries.filter((e) => e.date === date)).kcal +
    exercises.filter((e) => e.date === date).reduce((s, e) => s + e.kcal, 0);

  const open = (food: Food) => {
    selectFood(food);
    router.push({ pathname: "/food", params: { meal, date } });
  };

  const logStaged = () => {
    for (const f of staged) {
      const g = portion(f);
      const k = g / 100;
      addEntry({
        date,
        meal,
        name: f.name,
        brand: f.brand,
        image: f.image,
        grams: g,
        kcal: round1(f.kcal * k),
        protein: round1(f.protein * k),
        carbs: round1(f.carbs * k),
        fat: round1(f.fat * k),
        food: f,
      });
    }
    router.back();
  };

  const stagedKcal = staged.reduce((s, f) => s + (f.kcal * portion(f)) / 100, 0);

  const emptyText = searching
    ? "Sonuç bulunamadı. Farklı bir kelime dene."
    : tab === "recent"
      ? "Henüz kayıt yok. Arama yap ya da Temel besinler sekmesine bak."
      : tab === "fav"
        ? "Favori besinin yok. Besin detayında kalp simgesine dokun."
        : "";

  return (
    <Screen>
      <StackHeader title="Besin ekle" />

      <View className="px-5">
        <View className="flex-row items-center justify-between">
          <Pressable
            onPress={() => setMealOpen((v) => !v)}
            className="flex-row items-center rounded-full bg-pill px-4 py-2"
          >
            <View className="mr-2 h-2 w-2 rounded-full bg-carbs" />
            <Text className="text-lg font-bold text-ink">{mealLabel(meal)}</Text>
            <Ionicons name={mealOpen ? "chevron-up" : "chevron-down"} size={16} color={COLORS.ink} style={{ marginLeft: 6 }} />
          </Pressable>
          <View className="rounded-full bg-pill px-3 py-2">
            <Text className="text-xs text-slate-600">
              <Text className="font-bold text-ink">{fmt(Math.max(0, left))}</Text> kcal kaldı
            </Text>
          </View>
        </View>
        {mealOpen ? (
          <View className="mt-2 flex-row flex-wrap">
            {MEALS.map((m) => (
              <Chip
                key={m.key}
                label={m.label}
                active={meal === m.key}
                dark
                onPress={() => {
                  setMeal(m.key);
                  setMealOpen(false);
                }}
              />
            ))}
          </View>
        ) : null}

        <View className="mt-3 flex-row items-center rounded-2xl bg-white pl-4 pr-2">
          <Ionicons name="search" size={20} color="#64748B" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Besin veya marka ara…"
            placeholderTextColor="#94a3b8"
            autoCorrect={false}
            returnKeyType="search"
            className="ml-2 h-14 flex-1 text-base text-ink"
          />
          {loading ? (
            <ActivityIndicator color={COLORS.brand} style={{ marginRight: 8 }} />
          ) : query ? (
            <Pressable onPress={() => setQuery("")} hitSlop={10} className="mr-2">
              <Ionicons name="close-circle" size={20} color="#94a3b8" />
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => router.push({ pathname: "/barcode", params: { meal, date } })}
            className="h-10 w-10 items-center justify-center rounded-full bg-pill"
          >
            <Ionicons name="barcode-outline" size={22} color={COLORS.ink} />
          </Pressable>
        </View>
        {error ? <Text className="mt-2 text-xs text-fat">{error}</Text> : null}

        {!searching ? (
          <>
            <Pressable
              onPress={() => setQuickOpen(true)}
              className="mt-3 flex-row items-center rounded-2xl bg-white p-3 active:opacity-70"
            >
              <IconBubble name="flash-outline" color="#B45309" />
              <View className="ml-3 flex-1">
                <Text className="text-base font-bold text-ink">Hızlı kalori</Text>
                <Text className="text-xs text-slate-600">Kalori ve makroları elle gir</Text>
              </View>
              <View className="h-9 w-9 items-center justify-center rounded-full bg-pill">
                <Ionicons name="add" size={20} color={COLORS.ink} />
              </View>
            </Pressable>

            <View className="mt-3 flex-row rounded-full bg-pill p-1">
              {(
                [
                  { value: "recent", label: "Son eklenenler" },
                  { value: "fav", label: "Favoriler" },
                  { value: "common", label: "Temel besinler" },
                ] as { value: Tab; label: string }[]
              ).map((o) => (
                <Pressable
                  key={o.value}
                  onPress={() => setTab(o.value)}
                  className={`flex-1 items-center rounded-full py-2.5 ${tab === o.value ? "bg-white" : ""}`}
                >
                  <Text className={`text-xs font-bold ${tab === o.value ? "text-ink" : "text-slate-600"}`}>
                    {o.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}
      </View>

      <FlatList
        data={data}
        keyExtractor={(f) => f.id}
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="px-5 pb-6 pt-3"
        ListEmptyComponent={
          loading ? undefined : (
            <Text className="mt-8 text-center text-sm text-slate-500">{emptyText}</Text>
          )
        }
        renderItem={({ item }) => {
          const g = portion(item);
          const k = g / 100;
          const count = staged.filter((f) => f.id === item.id).length;
          return (
            <Pressable
              onPress={() => open(item)}
              className="mb-2 flex-row items-center rounded-2xl bg-white p-3 active:opacity-70"
            >
              {item.image ? (
                <Image source={{ uri: item.image }} className="h-12 w-12 rounded-full bg-pill" />
              ) : (
                <IconBubble name="nutrition-outline" size={48} />
              )}
              <View className="ml-3 flex-1">
                <Text className="text-base font-bold text-ink" numberOfLines={1}>
                  {item.name}
                </Text>
                <Text className="text-xs text-slate-600" numberOfLines={1}>
                  {item.serving ? `${item.serving.label} (${Math.round(g)} g)` : "100 g"}
                  {item.brand ? ` • ${item.brand}` : ""}
                </Text>
                <MacroLine p={item.protein * k} c={item.carbs * k} f={item.fat * k} />
              </View>
              <View className="mx-2 items-end">
                <Text className="text-2xl font-extrabold text-ink">{fmt(item.kcal * k)}</Text>
                <Text className="text-[11px] text-slate-500">kcal</Text>
              </View>
              <Pressable
                onPress={() => setStaged((s) => [...s, item])}
                hitSlop={6}
                className="h-11 w-11 items-center justify-center rounded-full bg-brand active:bg-brand-dark"
              >
                {count > 0 ? (
                  <Text className="text-base font-extrabold text-white">{count}</Text>
                ) : (
                  <Ionicons name="add" size={24} color="#fff" />
                )}
              </Pressable>
            </Pressable>
          );
        }}
      />

      {/* Alt çubuk */}
      <View className="px-4" style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
        <View className="flex-row items-center rounded-full bg-ink p-2 pl-4">
          <View className="h-9 w-9 items-center justify-center rounded-full bg-brand">
            <Text className="font-extrabold text-white">{staged.length}</Text>
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-sm font-bold text-white">
              {staged.length ? `${staged.length} besin • ${fmt(stagedKcal)} kcal` : "Besin seçilmedi"}
            </Text>
            {staged.length ? (
              <Pressable onPress={() => setStaged([])} hitSlop={6}>
                <Text className="text-xs text-slate-300">Temizle</Text>
              </Pressable>
            ) : (
              <Text className="text-xs text-slate-300">+ ile hızlı ekle</Text>
            )}
          </View>
          <Pressable
            onPress={logStaged}
            disabled={!staged.length}
            className={`h-12 items-center justify-center rounded-full px-5 ${
              staged.length ? "bg-brand" : "bg-slate-500"
            }`}
          >
            <Text className="text-sm font-extrabold text-white">{mealLabel(meal)} öğününe ekle</Text>
          </Pressable>
        </View>
      </View>

      <FormModal
        visible={quickOpen}
        title="Hızlı kalori"
        submitLabel="Ekle"
        fields={[
          { key: "name", label: "Ad", placeholder: "Örn. Ev yemeği" },
          { key: "kcal", label: "Kalori", unit: "kcal", numeric: true, required: true },
          { key: "protein", label: "Protein", unit: "g", numeric: true },
          { key: "carbs", label: "Karbonhidrat", unit: "g", numeric: true },
          { key: "fat", label: "Yağ", unit: "g", numeric: true },
        ]}
        onClose={() => setQuickOpen(false)}
        onSubmit={(v) => {
          const kcal = parseNum(v.kcal ?? "");
          if (kcal <= 0) return;
          addEntry({
            date,
            meal,
            name: (v.name ?? "").trim() || "Hızlı kalori",
            grams: 0,
            kcal: round1(kcal),
            protein: round1(parseNum(v.protein ?? "")),
            carbs: round1(parseNum(v.carbs ?? "")),
            fat: round1(parseNum(v.fat ?? "")),
            quick: true,
          });
          router.back();
        }}
      />
    </Screen>
  );
}
