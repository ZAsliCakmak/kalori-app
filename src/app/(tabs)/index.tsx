import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { Hydration } from "@/components/Hydration";
import { COLORS, Card, IconBubble, MacroCards, MacroLine, Ring, Screen, Segmented, TabHeader } from "@/components/ui";
import { fmt, greeting, keyToDate, macroTargets, shiftDate, shortDate, streak, sumEntries, todayKey } from "@/lib/calc";
import { useStore } from "@/lib/store";
import { MEALS } from "@/lib/types";

export default function HomeScreen() {
  const router = useRouter();
  const { profile, entries, exercises, goalKcal } = useStore();
  const [offset, setOffset] = useState(0);
  const date = shiftDate(todayKey(), offset);

  const dayEntries = useMemo(() => entries.filter((e) => e.date === date), [entries, date]);
  const totals = useMemo(() => sumEntries(dayEntries), [dayEntries]);
  const burned = useMemo(
    () => exercises.filter((e) => e.date === date).reduce((s, e) => s + e.kcal, 0),
    [exercises, date]
  );
  const targets = macroTargets(goalKcal);
  const left = goalKcal - totals.kcal + burned;
  const pct = Math.round((totals.kcal / goalKcal) * 100);
  const days = streak(entries);
  const loggedMeals = MEALS.filter((m) => dayEntries.some((e) => e.meal === m.key)).length;

  return (
    <Screen>
      <TabHeader title="Ana sayfa" />
      <ScrollView contentContainerClassName="px-5 pb-8">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-2xl font-extrabold text-ink">
              {greeting()}
              {profile.name ? `, ${profile.name}` : ""} 👋
            </Text>
            <Text className="mt-0.5 text-sm text-slate-600">
              {shortDate(keyToDate(date))} • Hedef: {fmt(goalKcal)} kcal
            </Text>
          </View>
          {days > 0 ? (
            <View className="flex-row items-center rounded-full bg-orange-100 px-3 py-2">
              <Ionicons name="flame" size={16} color="#EA580C" />
              <Text className="ml-1 text-sm font-bold text-ink">{days} gün seri</Text>
            </View>
          ) : null}
        </View>

        <View className="mt-4">
          <Segmented
            dark
            value={offset}
            onChange={setOffset}
            options={[
              { value: -1, label: "Dün" },
              { value: 0, label: "Bugün" },
              { value: 1, label: "Yarın" },
            ]}
          />
        </View>

        <Card className="mt-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xs font-bold tracking-widest text-slate-600">
                {left < 0 ? "HEDEFİN ÜZERİNDE" : "KALAN KALORİ"}
              </Text>
              <View className="flex-row items-end">
                <Text className={`text-5xl font-extrabold ${left < 0 ? "text-fat" : "text-ink"}`}>
                  {fmt(Math.abs(left))}
                </Text>
                <Text className="mb-2 ml-1 text-sm text-slate-500">kcal</Text>
              </View>
              <Text className="text-sm text-slate-600">
                <Text className="font-bold text-brand-dark">{fmt(totals.kcal)} alındı</Text> / {fmt(goalKcal)}
              </Text>
            </View>
            <Ring pct={pct} size={104}>
              <Text className="text-2xl font-extrabold text-brand-dark">%{pct}</Text>
              <Text className="text-xs text-slate-500">hedef</Text>
            </Ring>
          </View>

          <View className="mt-4 flex-row rounded-2xl bg-bg py-3">
            {[
              { label: "Alınan", value: totals.kcal, color: "text-ink" },
              { label: "Yakılan", value: burned, color: "text-ink" },
              { label: "Net", value: totals.kcal - burned, color: "text-brand-dark" },
            ].map((x) => (
              <View key={x.label} className="flex-1 items-center">
                <Text className="text-xs text-slate-600">{x.label}</Text>
                <Text className={`text-xl font-extrabold ${x.color}`}>{fmt(x.value)}</Text>
                <Text className="text-xs text-slate-500">kcal</Text>
              </View>
            ))}
          </View>
        </Card>

        <View className="mt-3">
          <MacroCards totals={totals} targets={targets} />
        </View>

        <Pressable
          onPress={() => router.push({ pathname: "/scan", params: { date } })}
          className="mt-3 overflow-hidden rounded-3xl active:opacity-90"
        >
          <LinearGradient
            colors={["#22C55E", "#15803D"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flexDirection: "row", alignItems: "center", padding: 16 }}
          >
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
              <Ionicons name="camera-outline" size={24} color="#fff" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-lg font-extrabold text-white">AI Hızlı Tarama</Text>
              <Text className="text-xs text-white/90">Tabağının fotoğrafını çek, değerleri tahmin edelim</Text>
            </View>
            <View className="rounded-full bg-white px-4 py-2">
              <Text className="text-sm font-bold text-brand-dark">Tara</Text>
            </View>
          </LinearGradient>
        </Pressable>

        <View className="mt-3">
          <Hydration date={date} />
        </View>

        <View className="mb-2 mt-5 flex-row items-end justify-between">
          <Text className="text-xl font-bold text-ink">Günün öğünleri</Text>
          <Text className="text-xs text-slate-600">
            {loggedMeals} / {MEALS.length} girildi
          </Text>
        </View>

        {MEALS.map((meal) => {
          const items = dayEntries.filter((e) => e.meal === meal.key);
          const add = () => router.push({ pathname: "/add", params: { meal: meal.key, date } });
          if (items.length === 0) {
            return (
              <Pressable
                key={meal.key}
                onPress={() => router.navigate({ pathname: "/diary", params: { date } })}
                className="mb-2 flex-row items-center rounded-3xl bg-pill p-4 active:opacity-70"
              >
                <IconBubble name={meal.icon} bg="bg-white" />
                <View className="ml-3 flex-1">
                  <Text className="text-lg font-bold text-ink">{meal.label}</Text>
                  <Text className="text-xs text-slate-600">{meal.hint}</Text>
                </View>
                <Pressable
  accessibilityRole="button"
  onPress={(event) => {
    event.stopPropagation();
    add();
  }}
  className="flex-row items-center rounded-full bg-white px-3 py-2"
>
  <Ionicons name="add" size={16} color={COLORS.brandDark} />
  <Text className="ml-1 text-sm font-bold text-brand-dark">Ekle</Text>
</Pressable>
              </Pressable>
            );
          }
          const t = sumEntries(items);
          const image = items.find((e) => e.image)?.image;
          const title = items[0].name + (items.length > 1 ? ` +${items.length - 1}` : "");
          return (
            <Pressable
              key={meal.key}
              onPress={() => router.navigate({ pathname: "/diary", params: { date } })}
              className="mb-2 flex-row items-center rounded-3xl bg-white p-3 active:opacity-70"
            >
              {image ? (
                <Image source={{ uri: image }} className="h-14 w-14 rounded-2xl bg-pill" />
              ) : (
                <IconBubble name={meal.icon} size={56} />
              )}
              <View className="ml-3 flex-1">
                <Text className="text-[11px] font-bold tracking-widest text-brand-dark">
                  {meal.label.toLocaleUpperCase("tr-TR")}
                </Text>
                <Text className="text-base font-bold text-ink" numberOfLines={1}>
                  {title}
                </Text>
                <MacroLine p={t.protein} c={t.carbs} f={t.fat} />
              </View>
              <View className="items-end">
                <Text className="text-xl font-extrabold text-ink">{fmt(t.kcal)}</Text>
                <Text className="text-xs text-slate-500">kcal</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </Screen>
  );
}
