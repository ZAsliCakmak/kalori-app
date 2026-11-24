import { Ionicons } from "@expo/vector-icons";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { FormModal } from "@/components/FormModal";
import { COLORS, Card, Screen, TabHeader } from "@/components/ui";
import { MACRO_SPLIT, fmt, fmt1, macroTargets, parseNum, streak, tdee } from "@/lib/calc";
import { diaryCsv } from "@/lib/diaryCsv";
import { useStore } from "@/lib/store";
import { GOALS } from "@/lib/types";

export default function ProfileScreen() {
  const router = useRouter();
  const store = useStore();
  const { profile, entries, goalKcal, saveProfile, logWeight } = store;
  const [exporting, setExporting] = useState(false);
  const [nameOpen, setNameOpen] = useState(false);
  const [weightOpen, setWeightOpen] = useState(false);

  async function exportDiary() {
    if (exporting || !store.diaryReady) return;
    setExporting(true);
    try {
      const csv = diaryCsv(store);
      if (!csv) {
        Alert.alert("Günlük boş", "Dışa aktarmak için önce bir kayıt ekle.");
        return;
      }
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Dosya paylaşımı bu cihazda kullanılamıyor.");
        return;
      }
      const file = new File(Paths.cache, `kalori-gunlugu-${Date.now()}.csv`);
      file.create();
      file.write(csv);
      await Sharing.shareAsync(file.uri, {
        mimeType: "text/csv",
        UTI: "public.comma-separated-values-text",
        dialogTitle: "Günlüğü CSV olarak paylaş",
      });
    } catch {
      Alert.alert("CSV dışa aktarılamadı", "Tekrar dene.");
    } finally {
      setExporting(false);
    }
  }

  const targets = macroTargets(goalKcal);
  const delta = goalKcal - tdee(profile);
  const toGo = profile.targetWeight - profile.weight;
  const goalLabel = GOALS.find((g) => g.value === profile.goal)?.label ?? "";
  const loggedDays = new Set(entries.map((e) => e.date)).size;
  const initial = (profile.name || "K").trim().charAt(0).toLocaleUpperCase("tr-TR");

  const macros = [
    { label: "Protein", grams: targets.protein, pct: MACRO_SPLIT.protein, color: COLORS.protein, text: "text-protein" },
    { label: "Karb.", grams: targets.carbs, pct: MACRO_SPLIT.carbs, color: COLORS.carbs, text: "text-carbs" },
    { label: "Yağ", grams: targets.fat, pct: MACRO_SPLIT.fat, color: COLORS.fat, text: "text-fat" },
  ];

  return (
    <Screen>
      <TabHeader title="Profil" />
      <ScrollView contentContainerClassName="px-5 pb-8">
        {/* Kimlik kartı */}
        <Card className="items-center">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-brand-soft">
            <Text className="text-3xl font-extrabold text-brand-dark">{initial}</Text>
          </View>
          <Pressable onPress={() => setNameOpen(true)} className="mt-3 flex-row items-center">
            <Text className="text-2xl font-extrabold text-ink">{profile.name || "Adını ekle"}</Text>
            <Ionicons name="create-outline" size={18} color="#64748B" style={{ marginLeft: 8 }} />
          </Pressable>
          <Text className="mt-1 text-sm text-slate-600">Hedef: {goalLabel}</Text>

          <View className="mt-4 w-full flex-row rounded-2xl bg-bg py-3">
            {[
              { label: "Gün serisi", value: String(streak(entries)) },
              { label: "Kayıt", value: `${entries.length} besin` },
              { label: "Kayıtlı gün", value: String(loggedDays) },
            ].map((x) => (
              <View key={x.label} className="flex-1 items-center">
                <Text className="text-xs text-slate-600">{x.label}</Text>
                <Text className="text-lg font-extrabold text-ink">{x.value}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Özet kutuları */}
        <View className="-mx-1 mt-3 flex-row">
          <Pressable onPress={() => setWeightOpen(true)} className="mx-1 flex-1 rounded-2xl bg-white p-3">
            <Text className="text-[11px] font-bold tracking-widest text-slate-600">KİLO</Text>
            <Text className="text-2xl font-extrabold text-ink">
              {fmt1(profile.weight)}
              <Text className="text-sm font-semibold"> kg</Text>
            </Text>
            <Text className="text-xs font-semibold text-brand-dark">Güncelle</Text>
          </Pressable>
          <View className="mx-1 flex-1 rounded-2xl bg-white p-3">
            <Text className="text-[11px] font-bold tracking-widest text-slate-600">HEDEF</Text>
            <Text className="text-2xl font-extrabold text-ink">
              {fmt1(profile.targetWeight)}
              <Text className="text-sm font-semibold"> kg</Text>
            </Text>
            <Text className="text-xs text-fat">
              {toGo === 0 ? "Hedefte" : `${fmt1(Math.abs(toGo))} kg kaldı`}
            </Text>
          </View>
          <View className="mx-1 flex-1 rounded-2xl bg-white p-3">
            <Text className="text-[11px] font-bold tracking-widest text-slate-600">GÜNLÜK</Text>
            <Text className="text-2xl font-extrabold text-ink">
              {fmt(goalKcal)}
            </Text>
            <Text className="text-xs text-protein">
              kcal •{" "}
              {delta === 0 ? "Denge" : `${delta < 0 ? "Açık" : "Fazla"} ${fmt(Math.abs(delta))}`}
            </Text>
          </View>
        </View>

        {/* Beslenme planı */}
        <Card className="mt-3">
          <View className="flex-row items-start justify-between">
            <View>
              <Text className="text-[11px] font-bold tracking-widest text-brand-dark">BESLENME PLANI</Text>
              <Text className="text-lg font-bold text-ink">Günlük kalori ve makrolar</Text>
            </View>
            <View className="items-end">
              <Text className="text-3xl font-extrabold text-ink">{fmt(goalKcal)}</Text>
              <Text className="text-xs text-slate-500">kcal / gün</Text>
            </View>
          </View>
          <View className="mt-3 h-2.5 flex-row overflow-hidden rounded-full bg-pill">
            {macros.map((m) => (
              <View key={m.label} style={{ flex: m.pct, backgroundColor: m.color }} />
            ))}
          </View>
          <View className="-mx-1 mt-3 flex-row">
            {macros.map((m) => (
              <View key={m.label} className="mx-1 flex-1 rounded-2xl bg-bg p-3">
                <Text className="text-xs text-slate-600">{m.label}</Text>
                <Text className="text-xl font-extrabold text-ink">{m.grams}g</Text>
                <Text className={`text-xs font-semibold ${m.text}`}>%{Math.round(m.pct * 100)} hedef</Text>
              </View>
            ))}
          </View>
          <Pressable
            onPress={() => router.push("/onboarding")}
            className="mt-3 h-12 flex-row items-center rounded-full bg-pill px-4 active:opacity-70"
          >
            <Ionicons name="options-outline" size={18} color={COLORS.ink} />
            <Text className="ml-3 flex-1 text-sm font-bold text-ink">Hedefleri ve bilgileri düzenle</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.ink} />
          </Pressable>
        </Card>

        <Pressable
          accessibilityRole="button"
          disabled={!store.diaryReady || exporting}
          onPress={exportDiary}
          className="mt-3 h-12 flex-row items-center justify-center rounded-full bg-pill"
        >
          <Ionicons name="download-outline" size={18} color={COLORS.ink} />
          <Text className="ml-2 text-sm font-bold text-ink">
            {!store.diaryReady ? "Kayıtlar yükleniyor…" : exporting ? "CSV hazırlanıyor…" : "Günlüğü CSV olarak dışa aktar"}
          </Text>
        </Pressable>

        <Text className="mt-5 text-center text-xs text-slate-500">
          Kalori v1.0 • Besin verisi: Open Food Facts
        </Text>
      </ScrollView>

      <FormModal
        visible={nameOpen}
        title="Adın"
        fields={[{ key: "name", label: "Ad", placeholder: "Adın" }]}
        initial={{ name: profile.name }}
        onClose={() => setNameOpen(false)}
        onSubmit={(v) => saveProfile({ ...profile, name: (v.name ?? "").trim() })}
      />
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
