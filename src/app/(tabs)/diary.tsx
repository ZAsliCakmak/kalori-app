import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { FormModal } from "@/components/FormModal";
import { COLORS, IconBubble, MacroCards, Screen, TabHeader } from "@/components/ui";
import {
  DAYS_SHORT,
  fmt,
  keyToDate,
  macroTargets,
  parseNum,
  shiftDate,
  sumEntries,
  todayKey,
  weekOf,
} from "@/lib/calc";
import { useStore } from "@/lib/store";
import { MEALS, type Entry } from "@/lib/types";

export default function DiaryScreen() {
  const router = useRouter();
  const { entries, exercises, goalKcal, updateGrams, removeEntry, addExercise, removeExercise } = useStore();
  const [date, setDate] = useState(todayKey());
  const [exerciseOpen, setExerciseOpen] = useState(false);

  const [editing, setEditing] = useState<Entry | null>(null);

  const week = weekOf(date);
  const logged = useMemo(() => new Set(entries.map((e) => e.date)), [entries]);
  const dayEntries = useMemo(() => entries.filter((e) => e.date === date), [entries, date]);
  const dayExercises = useMemo(() => exercises.filter((e) => e.date === date), [exercises, date]);
  const totals = sumEntries(dayEntries);
  const burned = dayExercises.reduce((s, e) => s + e.kcal, 0);
  const left = goalKcal - totals.kcal + burned;

  return (
    <Screen>
      <TabHeader title="Günlük" />
      <ScrollView contentContainerClassName="px-5 pb-8">
        {/* Hafta şeridi */}
        <View className="flex-row items-center">
          <Pressable onPress={() => setDate(shiftDate(date, -7))} hitSlop={10} className="pr-1">
            <Ionicons name="chevron-back" size={20} color={COLORS.ink} />
          </Pressable>
          {week.map((k) => {
            const d = keyToDate(k);
            const active = k === date;
            return (
              <Pressable
                key={k}
                onPress={() => setDate(k)}
                className={`mx-0.5 flex-1 items-center rounded-xl py-2 ${active ? "bg-ink" : "bg-white"}`}
              >
                <Text className={`text-[11px] ${active ? "text-white" : "text-slate-600"}`}>
                  {DAYS_SHORT[d.getDay()]}
                </Text>
                <Text className={`text-lg font-extrabold ${active ? "text-white" : "text-ink"}`}>
                  {d.getDate()}
                </Text>
                <View
                  className={`mt-0.5 h-1.5 w-1.5 rounded-full ${logged.has(k) ? "bg-brand" : "bg-transparent"}`}
                />
              </Pressable>
            );
          })}
          <Pressable onPress={() => setDate(shiftDate(date, 7))} hitSlop={10} className="pl-1">
            <Ionicons name="chevron-forward" size={20} color={COLORS.ink} />
          </Pressable>
        </View>

        {/* Günlük enerji bütçesi */}
        <View className="mt-3 flex-row items-center rounded-2xl bg-white p-4">
          <IconBubble name="flame-outline" color={COLORS.brandDark} bg="bg-brand-soft" />
          <View className="ml-3 flex-1">
            <Text className="text-xs text-slate-600">Günlük enerji bütçesi</Text>
            <Text className="text-sm text-slate-600">
              <Text className="text-xl font-extrabold text-ink">{fmt(totals.kcal)}</Text> /{" "}
              {fmt(goalKcal + burned)} kcal
            </Text>
          </View>
          <View className={`rounded-full px-3 py-1.5 ${left < 0 ? "bg-red-100" : "bg-brand-soft"}`}>
            <Text className={`text-xs font-bold ${left < 0 ? "text-fat" : "text-brand-dark"}`}>
              {left < 0 ? `${fmt(-left)} kcal fazla` : `${fmt(left)} kcal kaldı`}
            </Text>
          </View>
        </View>

        <View className="mt-3">
          <MacroCards totals={totals} targets={macroTargets(goalKcal)} />
        </View>

        {/* Öğünler */}
        {MEALS.map((meal) => {
          const items = dayEntries.filter((e) => e.meal === meal.key);
          const mealKcal = items.reduce((s, e) => s + e.kcal, 0);
          return (
            <View key={meal.key} className="mt-3 rounded-3xl bg-white p-4">
              <View className="flex-row items-center">
                <IconBubble name={meal.icon} size={40} />
                <Text className="ml-3 flex-1 text-xl font-bold text-ink">{meal.label}</Text>
                <Text className="text-xl font-extrabold text-ink">{fmt(mealKcal)}</Text>
                <Text className="ml-1 text-xs text-slate-500">kcal</Text>
              </View>

              {items.map((e) => (
                <View key={e.id} className="mt-2 flex-row items-center rounded-xl bg-bg p-2.5">
                  {e.image ? (
                    <Image source={{ uri: e.image }} className="h-11 w-11 rounded-lg bg-pill" />
                  ) : (
                    <View className="h-11 w-11 items-center justify-center rounded-lg bg-pill">
                      <Ionicons
                        name={e.ai ? "sparkles" : e.quick ? "flash-outline" : "nutrition-outline"}
                        size={20}
                        color={COLORS.ink}
                      />
                    </View>
                  )}
                  <View className="ml-3 flex-1">
                    <Text className="text-sm font-bold text-ink" numberOfLines={1}>
                      {e.name}
                    </Text>
                    <Text className="text-xs text-slate-600" numberOfLines={1}>
                      {e.quick ? "Hızlı giriş" : `${String(e.grams).replace(".", ",")} g`}
                      {e.ai ? " • AI tarama" : ""} • P {Math.round(e.protein)}g • K {Math.round(e.carbs)}g • Y{" "}
                      {Math.round(e.fat)}g
                    </Text>
                  </View>
                  <Text className="mx-2 text-sm font-bold text-ink">{fmt(e.kcal)} kcal</Text>
                  {!e.quick && e.grams > 0 && (
                    <Pressable
                      onPress={() => setEditing(e)}
                      accessibilityRole="button"
                      accessibilityLabel={`${e.name} gramını düzenle`}
                      className="mr-2 p-2"
                    >
                      <Ionicons name="pencil-outline" size={18} color={COLORS.brandDark} />
                    </Pressable>
                  )}
                  <Pressable onPress={() => removeEntry(e.id)} hitSlop={10}>
                    <Ionicons name="trash-outline" size={18} color="#94a3b8" />
                  </Pressable>
                </View>
              ))}

              <Pressable
                onPress={() => router.push({ pathname: "/add", params: { meal: meal.key, date } })}
                className="mt-2 h-12 flex-row items-center justify-center rounded-full bg-pill active:opacity-70"
              >
                <Ionicons name="add-circle-outline" size={18} color={COLORS.brandDark} />
                <Text className="ml-2 text-sm font-bold text-ink">Besin ekle</Text>
              </Pressable>
            </View>
          );
        })}

        {/* Egzersiz */}
        <View className="mt-3 rounded-3xl bg-white p-4">
          <View className="flex-row items-center">
            <IconBubble name="fitness-outline" size={40} bg="bg-orange-100" color="#EA580C" />
            <Text className="ml-3 flex-1 text-xl font-bold text-ink">Egzersiz</Text>
            <Text className="mr-3 text-sm font-bold text-fat">+{fmt(burned)} kcal</Text>
            <Pressable
              onPress={() => setExerciseOpen(true)}
              className="flex-row items-center rounded-full bg-pill px-3 py-2"
            >
              <Ionicons name="add" size={16} color={COLORS.ink} />
              <Text className="ml-1 text-sm font-bold text-ink">Ekle</Text>
            </Pressable>
          </View>
          {dayExercises.length === 0 ? (
            <Text className="mt-3 text-sm text-slate-500">Bu gün için egzersiz girilmedi.</Text>
          ) : null}
          {dayExercises.map((x) => (
            <View key={x.id} className="mt-2 flex-row items-center rounded-xl bg-bg p-2.5">
              <IconBubble name="walk-outline" size={40} />
              <View className="ml-3 flex-1">
                <Text className="text-sm font-bold text-ink" numberOfLines={1}>{x.name}</Text>
                <Text className="text-xs text-slate-600">{x.minutes} dk</Text>
              </View>
              <Text className="mx-2 text-sm font-bold text-fat">+{fmt(x.kcal)} kcal</Text>
              <Pressable onPress={() => removeExercise(x.id)} hitSlop={10}>
                <Ionicons name="trash-outline" size={18} color="#94a3b8" />
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>

      <FormModal
        visible={editing !== null}
        title={editing?.name ?? "Gram düzenle"}
        fields={[{
          key: "grams", label: "Yeni miktar", unit: "g", numeric: true, required: true,
          validate: (s) => /^\d+(?:[.,]\d)?$/.test(s) && Number.isFinite(Number(s.replace(",", "."))) && parseNum(s) > 0,
        }]}
        initial={{ grams: String(editing?.grams ?? "").replace(".", ",") }}
        onClose={() => setEditing(null)}
        onSubmit={({ grams }) => {
          if (editing) updateGrams(editing, parseNum(grams));
        }}
      />
      <FormModal
        visible={exerciseOpen}
        title="Egzersiz ekle"
        submitLabel="Ekle"
        fields={[
          { key: "name", label: "Egzersiz", placeholder: "Örn. Koşu", required: true },
          { key: "minutes", label: "Süre", unit: "dk", numeric: true, required: true },
          { key: "kcal", label: "Yakılan kalori", unit: "kcal", numeric: true, required: true },
        ]}
        onClose={() => setExerciseOpen(false)}
        onSubmit={(v) => {
          const kcal = Math.round(parseNum(v.kcal));
          if (kcal <= 0) return;
          addExercise({ date, name: v.name.trim(), minutes: Math.round(parseNum(v.minutes)), kcal });
        }}
      />
    </Screen>
  );
}
