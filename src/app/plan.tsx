import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Bar, COLORS, Donut, IconBubble, PrimaryButton, Screen } from "@/components/ui";
import {
  MACRO_SPLIT,
  bmr,
  dailyGoal,
  fmt,
  fmt1,
  macroTargets,
  shortDate,
  targetDate,
  tdee,
} from "@/lib/calc";
import { useStore } from "@/lib/store";

export default function PlanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, saveProfile } = useStore();

  const goal = dailyGoal(profile);
  const delta = goal - tdee(profile);
  const macros = macroTargets(goal);
  const eta = targetDate(profile);

  const rows = [
    { label: "Protein", grams: macros.protein, kcal: macros.protein * 4, pct: MACRO_SPLIT.protein, color: COLORS.protein },
    { label: "Karbonhidrat", grams: macros.carbs, kcal: macros.carbs * 4, pct: MACRO_SPLIT.carbs, color: COLORS.carbs },
    { label: "Yağ", grams: macros.fat, kcal: macros.fat * 9, pct: MACRO_SPLIT.fat, color: COLORS.brand },
  ];

  const start = () => {
    const first = !profile.onboarded;
    if (first) saveProfile({ ...profile, onboarded: true });
    if (router.canDismiss()) router.dismissAll();
    if (first) router.replace("/");
  };

  return (
    <Screen>
      <ScrollView contentContainerClassName="px-5 pb-8 pt-3">
        <View className="self-center rounded-full bg-pill px-4 py-2">
          <Text className="text-xs font-bold tracking-widest text-ink">
            <Text className="text-brand">● </Text>ADIM 2 / 2 • HESAPLANDI
          </Text>
        </View>
        <Text className="mt-3 text-center text-3xl font-extrabold text-ink">Günlük planın</Text>
        <Text className="mt-1 text-center text-sm text-slate-600">
          Bazal metabolizma hızına, hedef kilona ve hareket düzeyine göre hesaplandı.
        </Text>

        <View className="mt-5 items-center rounded-3xl bg-white p-6">
          <Donut
            size={220}
            stroke={18}
            parts={rows.map((r) => ({ value: r.pct, color: r.color }))}
          >
            <Text className="text-xs font-bold tracking-widest text-slate-600">GÜNLÜK BÜTÇE</Text>
            <Text className="text-5xl font-extrabold text-ink">{fmt(goal)}</Text>
            <Text className="text-sm font-bold text-brand-dark">kcal / gün</Text>
          </Donut>
          <View className="mt-5 flex-row">
            <View className="mr-2 rounded-full bg-pill px-4 py-2">
              <Text className="text-xs text-ink">
                BMR <Text className="font-bold">{fmt(bmr(profile))}</Text> kcal
              </Text>
            </View>
            <View className="rounded-full bg-pill px-4 py-2">
              <Text className="text-xs font-bold text-brand-dark">
                {delta === 0
                  ? "Denge"
                  : `${delta < 0 ? "Açık −" : "Fazla +"}${fmt(Math.abs(delta))} kcal`}
              </Text>
            </View>
          </View>
        </View>

        <Text className="mb-2 mt-5 text-xl font-bold text-ink">Hedef makro dağılımı</Text>
        <View className="-mx-1 flex-row">
          {rows.map((r) => (
            <View key={r.label} className="mx-1 flex-1 rounded-2xl bg-white p-3">
              <Text className="text-right text-xs text-slate-600">%{Math.round(r.pct * 100)}</Text>
              <Text className="text-xs text-slate-600" numberOfLines={1}>{r.label}</Text>
              <Text className="text-2xl font-extrabold text-ink">
                {r.grams}
                <Text className="text-sm font-semibold"> g</Text>
              </Text>
              <Text className="mb-2 text-xs text-slate-500">{fmt(r.kcal)} kcal</Text>
              <Bar pct={r.pct * 100} color={r.color} />
            </View>
          ))}
        </View>

        {eta ? (
          <View className="mt-4 flex-row items-center rounded-2xl bg-white p-4">
            <IconBubble name="calendar-outline" color={COLORS.brandDark} />
            <View className="ml-3 flex-1">
              <Text className="text-base font-bold text-ink">Tahmini hedef tarihi: {shortDate(eta)}</Text>
              <Text className="text-sm text-slate-600">
                {fmt1(profile.weight)} kg → {fmt1(profile.targetWeight)} kg
              </Text>
            </View>
            <Ionicons name="checkmark-circle-outline" size={22} color="#94a3b8" />
          </View>
        ) : null}

        <Text className="mt-4 text-center text-xs text-slate-500">
          Hesaplama Mifflin-St Jeor denklemine dayanır; genel bilgi amaçlıdır, tıbbi tavsiye değildir.
        </Text>
      </ScrollView>

      <View className="bg-bg px-5 pt-2" style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
        <PrimaryButton
          label={profile.onboarded ? "Tamam" : "Takibe başla  →"}
          onPress={start}
        />
      </View>
    </Screen>
  );
}
