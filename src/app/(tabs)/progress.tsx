import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { FormModal } from "@/components/FormModal";
import { BarChart, LineChart } from "@/components/charts";
import { COLORS, Card, Screen, Segmented, TabHeader } from "@/components/ui";
import {
  DAYS_SHORT,
  MACRO_SPLIT,
  fmt,
  fmt1,
  keyToDate,
  lastDays,
  macroTargets,
  parseNum,
  shortDate,
  streak,
  todayKey,
} from "@/lib/calc";
import { useStore } from "@/lib/store";

type Range = 7 | 30 | 90;

export default function ProgressScreen() {
  const { entries, weights, profile, goalKcal, logWeight } = useStore();
  const [range, setRange] = useState<Range>(7);
  const [weightOpen, setWeightOpen] = useState(false);

  const days = useMemo(() => lastDays(range), [range]);
  const byDay = useMemo(() => {
    const map: Record<string, { kcal: number; protein: number; carbs: number; fat: number }> = {};
    for (const e of entries) {
      const d = (map[e.date] ??= { kcal: 0, protein: 0, carbs: 0, fat: 0 });
      d.kcal += e.kcal;
      d.protein += e.protein;
      d.carbs += e.carbs;
      d.fat += e.fat;
    }
    return map;
  }, [entries]);

  // Kalori grafiği: 7 ve 30 günde günlük, 90 günde haftalık ortalama
  const bars = useMemo(() => {
    if (range !== 90) {
      return days.map((k) => ({
        label: range === 7 ? DAYS_SHORT[keyToDate(k).getDay()] : shortDate(keyToDate(k)),
        value: byDay[k]?.kcal ?? 0,
      }));
    }
    const out: { label: string; value: number }[] = [];
    for (let i = 0; i < days.length; i += 7) {
      const chunk = days.slice(i, i + 7).filter((k) => byDay[k]);
      const avg = chunk.length ? chunk.reduce((s, k) => s + byDay[k].kcal, 0) / chunk.length : 0;
      out.push({ label: shortDate(keyToDate(days[i])), value: avg });
    }
    return out;
  }, [days, byDay, range]);

  const loggedDays = days.filter((k) => byDay[k]);
  const avgKcal = loggedDays.length
    ? loggedDays.reduce((s, k) => s + byDay[k].kcal, 0) / loggedDays.length
    : 0;
  const under = loggedDays.filter((k) => byDay[k].kcal <= goalKcal).length;
  const over = loggedDays.length - under;

  const avg = (key: "protein" | "carbs" | "fat") =>
    loggedDays.length ? loggedDays.reduce((s, k) => s + byDay[k][key], 0) / loggedDays.length : 0;
  const macroAvg = { protein: avg("protein"), carbs: avg("carbs"), fat: avg("fat") };
  const macroKcal = macroAvg.protein * 4 + macroAvg.carbs * 4 + macroAvg.fat * 9;
  const share = {
    protein: macroKcal ? (macroAvg.protein * 4) / macroKcal : MACRO_SPLIT.protein,
    carbs: macroKcal ? (macroAvg.carbs * 4) / macroKcal : MACRO_SPLIT.carbs,
    fat: macroKcal ? (macroAvg.fat * 9) / macroKcal : MACRO_SPLIT.fat,
  };
  const targets = macroTargets(goalKcal);

  const rangeWeights = weights.filter((w) => w.date >= days[0]);
  const points = (rangeWeights.length ? rangeWeights : weights.slice(-1)).map((w) => ({
    label: shortDate(keyToDate(w.date)),
    value: w.kg,
  }));
  const change = rangeWeights.length > 1 ? rangeWeights[rangeWeights.length - 1].kg - rangeWeights[0].kg : 0;

  const week = lastDays(7);
  const days7 = streak(entries);

  const macroRows = [
    { key: "protein", label: "Protein", color: COLORS.protein, text: "text-protein" },
    { key: "carbs", label: "Karb.", color: COLORS.carbs, text: "text-carbs" },
    { key: "fat", label: "Yağ", color: COLORS.fat, text: "text-fat" },
  ] as const;

  return (
    <Screen>
      <TabHeader title="İlerleme" />
      <ScrollView contentContainerClassName="px-5 pb-8">
        <Segmented
          value={range}
          onChange={setRange}
          options={[
            { value: 7, label: "Hafta" },
            { value: 30, label: "Ay" },
            { value: 90, label: "3 Ay" },
          ]}
        />

        {/* Seri */}
        <Card className="mt-4">
          <View className="flex-row items-center">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-orange-100">
              <Ionicons name="flame" size={24} color="#EA580C" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-xl font-extrabold text-ink">{days7} günlük seri</Text>
              <Text className="text-sm text-slate-600">
                {days7 > 0 ? "Her gün kayıt girmeye devam et." : "Bugün ilk kaydını girerek seriyi başlat."}
              </Text>
            </View>
          </View>
          <View className="mt-4 flex-row rounded-2xl bg-bg py-3">
            {week.map((k) => {
              const done = !!byDay[k];
              return (
                <View key={k} className="flex-1 items-center">
                  <Text className={`mb-1 text-xs ${k === todayKey() ? "font-bold text-brand-dark" : "text-slate-600"}`}>
                    {DAYS_SHORT[keyToDate(k).getDay()]}
                  </Text>
                  <View
                    className={`h-7 w-7 items-center justify-center rounded-full ${done ? "bg-brand" : "bg-pill"}`}
                  >
                    {done ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
                  </View>
                </View>
              );
            })}
          </View>
        </Card>

        {/* Kilo */}
        <Card className="mt-3">
          <View className="flex-row items-start justify-between">
            <View>
              <Text className="text-xl font-bold text-ink">Kilo eğilimi</Text>
              <Text className="text-xs text-slate-600">Hedef: {fmt1(profile.targetWeight)} kg</Text>
            </View>
            <Pressable
              onPress={() => setWeightOpen(true)}
              className="flex-row items-center rounded-full bg-pill px-3 py-2"
            >
              <Ionicons name="add" size={16} color={COLORS.ink} />
              <Text className="ml-1 text-sm font-bold text-ink">Kilo gir</Text>
            </Pressable>
          </View>
          <View className="mt-2 flex-row items-end">
            <Text className="text-4xl font-extrabold text-ink">{fmt1(profile.weight)}</Text>
            <Text className="mb-1 ml-1 text-sm text-slate-500">kg</Text>
            {change !== 0 ? (
              <View className="mb-1 ml-3 rounded-full bg-brand-soft px-3 py-1">
                <Text className="text-xs font-bold text-brand-dark">
                  {change > 0 ? "+" : "−"}
                  {fmt1(Math.abs(change))} kg
                </Text>
              </View>
            ) : null}
          </View>
          <View className="mt-3">
            {points.length > 0 ? (
              <LineChart points={points} target={profile.targetWeight} />
            ) : (
              <Text className="py-6 text-center text-sm text-slate-500">
                Grafiği görmek için kilonu gir.
              </Text>
            )}
          </View>
        </Card>

        {/* Günlük kalori */}
        <Card className="mt-3">
          <View className="mb-4 flex-row items-start justify-between">
            <View>
              <Text className="text-xl font-bold text-ink">
                {range === 90 ? "Haftalık ortalama kalori" : "Günlük kalori"}
              </Text>
              <Text className="text-xs text-slate-600">Hedef: {fmt(goalKcal)} kcal</Text>
            </View>
            <View className="rounded-full bg-pill px-3 py-1.5">
              <Text className="text-xs text-slate-600">
                Ort: <Text className="font-bold text-ink">{fmt(avgKcal)}</Text> kcal
              </Text>
            </View>
          </View>
          <BarChart data={bars} goal={goalKcal} />
          <View className="mt-4 flex-row justify-between border-t border-slate-100 pt-3">
            <View className="flex-row items-center">
              <View className="mr-2 h-2.5 w-2.5 rounded-full bg-brand" />
              <Text className="text-xs text-slate-600">Hedef içinde ({under} gün)</Text>
            </View>
            <View className="flex-row items-center">
              <View className="mr-2 h-2.5 w-2.5 rounded-full bg-carbs" />
              <Text className="text-xs text-slate-600">Hedef üstü ({over} gün)</Text>
            </View>
          </View>
        </Card>

        {/* Makro dağılımı */}
        <Card className="mt-3">
          <Text className="text-xl font-bold text-ink">Ortalama makro dağılımı</Text>
          <Text className="text-xs text-slate-600">Kayıt girilen günlerin ortalaması</Text>
          <View className="mt-3 h-2.5 flex-row overflow-hidden rounded-full bg-pill">
            {macroRows.map((m) => (
              <View key={m.key} style={{ flex: share[m.key], backgroundColor: m.color }} />
            ))}
          </View>
          <View className="-mx-1 mt-4 flex-row">
            {macroRows.map((m) => (
              <View key={m.key} className="mx-1 flex-1 rounded-2xl bg-bg p-3">
                <Text className={`text-xs font-bold ${m.text}`}>
                  {m.label} %{Math.round(share[m.key] * 100)}
                </Text>
                <Text className="text-2xl font-extrabold text-ink">
                  {Math.round(macroAvg[m.key])}
                  <Text className="text-sm font-semibold">g</Text>
                </Text>
                <Text className="text-xs text-slate-500">Hedef: {targets[m.key]}g</Text>
              </View>
            ))}
          </View>
        </Card>
      </ScrollView>

      <FormModal
        visible={weightOpen}
        title="Bugünkü kilon"
        fields={[{ key: "kg", label: "Kilo", unit: "kg", numeric: true, required: true }]}
        initial={{ kg: fmt1(profile.weight) }}
        onClose={() => setWeightOpen(false)}
        onSubmit={(v) => {
          const kg = parseNum(v.kg);
          if (kg >= 30 && kg <= 300) logWeight(kg);
        }}
      />
    </Screen>
  );
}
