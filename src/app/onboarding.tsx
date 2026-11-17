import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Bar, COLORS, IconBubble, PrimaryButton, Screen, Segmented } from "@/components/ui";
import { dailyGoal, fmt, fmt1, parseNum, shortDate, targetDate } from "@/lib/calc";
import { useStore } from "@/lib/store";
import { ACTIVITIES, GOALS, Gender, Goal, Profile } from "@/lib/types";

function NumberCard({
  label,
  unit,
  value,
  onChange,
  accent,
  note,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  accent?: boolean;
  note?: string;
}) {
  return (
    <View className="m-1 flex-1 rounded-3xl bg-white p-4">
      <Text className="text-sm text-slate-600">{label}</Text>
      <View className="mt-1 flex-row items-end">
        <TextInput
          value={value}
          onChangeText={onChange}
          keyboardType="decimal-pad"
          selectTextOnFocus
          className={`min-w-[56px] p-0 text-3xl font-extrabold ${accent ? "text-brand-dark" : "text-ink"}`}
        />
        <Text className="mb-1.5 ml-1 text-sm text-slate-500">{unit}</Text>
      </View>
      {note ? (
        <View className="mt-2 self-start rounded-full bg-brand-soft px-2.5 py-1">
          <Text className="text-xs font-semibold text-brand-dark">{note}</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, saveProfile } = useStore();

  const [name, setName] = useState(profile.name);
  const [goal, setGoal] = useState<Goal>(profile.goal);
  const [gender, setGender] = useState<Gender>(profile.gender);
  const [age, setAge] = useState(String(profile.age));
  const [height, setHeight] = useState(String(profile.height));
  const [weight, setWeight] = useState(String(profile.weight).replace(".", ","));
  const [target, setTarget] = useState(String(profile.targetWeight).replace(".", ","));
  const [activity, setActivity] = useState(profile.activity);

  const draft: Profile = {
    ...profile,
    name: name.trim(),
    goal,
    gender,
    age: parseNum(age),
    height: parseNum(height),
    weight: parseNum(weight),
    targetWeight: parseNum(target),
    activity,
  };
  const valid =
    draft.age >= 10 && draft.age <= 100 &&
    draft.height >= 100 && draft.height <= 250 &&
    draft.weight >= 30 && draft.weight <= 300 &&
    draft.targetWeight >= 30 && draft.targetWeight <= 300;

  const diff = draft.targetWeight - draft.weight;
  const eta = valid ? targetDate(draft) : null;

  const next = () => {
    if (!valid) return;
    saveProfile(draft);
    router.push("/plan");
  };

  return (
    <Screen>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerClassName="px-5 pb-8 pt-3" keyboardShouldPersistTaps="handled">
          <View className="mb-2 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="mr-2 h-2 w-2 rounded-full bg-brand" />
              <Text className="text-xs font-semibold text-ink">Hedef ayarı</Text>
            </View>
            <Text className="text-xs font-bold text-brand-dark">Adım 1 / 2</Text>
          </View>
          <Bar pct={50} color={COLORS.brand} />

          <Text className="mt-5 text-3xl font-extrabold text-ink">Hedefin ne?</Text>
          <Text className="mt-1 text-sm text-slate-600">
            Günlük kalori ve makro planını bu bilgilere göre hesaplıyoruz.
          </Text>

          <View className="mt-4">
            {GOALS.map((g) => {
              const active = goal === g.value;
              return (
                <Pressable
                  key={g.value}
                  onPress={() => setGoal(g.value)}
                  className={`mb-2 flex-row items-center rounded-3xl p-4 ${active ? "bg-brand-soft" : "bg-white"}`}
                >
                  <IconBubble name={g.icon} color={active ? COLORS.brandDark : COLORS.ink} />
                  <View className="ml-3 flex-1">
                    <Text className="text-lg font-bold text-ink">{g.label}</Text>
                    <Text className="text-sm text-slate-600">{g.hint}</Text>
                  </View>
                  {active ? <Ionicons name="checkmark-circle" size={26} color={COLORS.brand} /> : null}
                </Pressable>
              );
            })}
          </View>

          <Text className="mb-2 mt-5 text-lg font-bold text-ink">Adın</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="İsteğe bağlı"
            placeholderTextColor="#94a3b8"
            className="h-14 rounded-3xl bg-white px-5 text-base font-semibold text-ink"
          />

          <View className="mb-2 mt-5 flex-row items-end justify-between">
            <Text className="text-lg font-bold text-ink">Hakkında</Text>
            <Text className="text-xs text-slate-500">BMR hesabında kullanılır</Text>
          </View>
          <Segmented
            dark
            value={gender}
            onChange={setGender}
            options={[
              { value: "kadin", label: "Kadın" },
              { value: "erkek", label: "Erkek" },
              { value: "diger", label: "Diğer" },
            ]}
          />

          <View className="-mx-1 mt-2 flex-row">
            <NumberCard label="Yaş" unit="yıl" value={age} onChange={setAge} />
            <NumberCard label="Boy" unit="cm" value={height} onChange={setHeight} />
          </View>
          <View className="-mx-1 flex-row">
            <NumberCard label="Mevcut kilo" unit="kg" value={weight} onChange={setWeight} />
            <NumberCard
              label="Hedef kilo"
              unit="kg"
              value={target}
              onChange={setTarget}
              accent
              note={valid && diff !== 0 ? `${diff > 0 ? "+" : "−"}${fmt1(Math.abs(diff))} kg` : undefined}
            />
          </View>

          <View className="mb-2 mt-5 flex-row items-end justify-between">
            <Text className="text-lg font-bold text-ink">Günlük hareket düzeyi</Text>
            <Text className="text-xs text-slate-500">TDEE çarpanı</Text>
          </View>
          {ACTIVITIES.map((a) => {
            const active = activity === a.value;
            return (
              <Pressable
                key={a.value}
                onPress={() => setActivity(a.value)}
                className={`mb-2 flex-row items-center rounded-2xl p-3 ${active ? "bg-brand-soft" : "bg-white"}`}
              >
                <IconBubble
                  name={a.icon}
                  size={40}
                  bg={active ? "bg-brand" : "bg-pill"}
                  color={active ? "#fff" : COLORS.ink}
                />
                <View className="ml-3 flex-1">
                  <Text className="text-sm font-bold text-ink">{a.label}</Text>
                  <Text className="text-xs text-slate-600">{a.hint}</Text>
                </View>
                <Text className={`text-xs font-bold ${active ? "text-brand-dark" : "text-slate-600"}`}>
                  {String(a.value).replace(".", ",")}x
                </Text>
              </Pressable>
            );
          })}

          <View className="mt-3 flex-row items-center rounded-3xl bg-pill p-4">
            <IconBubble name="sparkles" bg="bg-brand" color="#fff" />
            <View className="ml-3 flex-1">
              <Text className="text-sm text-ink">
                Tahmini hedef:{" "}
                <Text className="text-lg font-extrabold text-brand-dark">
                  {valid ? fmt(dailyGoal(draft)) : "—"} kcal
                </Text>{" "}
                / gün
              </Text>
              {eta ? (
                <Text className="mt-0.5 text-sm text-slate-600">
                  Bu tempoyla {fmt1(draft.targetWeight)} kg hedefine yaklaşık{" "}
                  <Text className="font-bold text-brand-dark">{shortDate(eta)}</Text> civarında ulaşılır.
                </Text>
              ) : null}
            </View>
          </View>
        </ScrollView>

        <View className="bg-bg px-5 pt-2" style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
          <PrimaryButton label="Günlük plana devam et  →" onPress={next} disabled={!valid} />
          <Text className="mt-2 text-center text-xs text-slate-500">
            Kalori ve makro hedeflerini Profil sekmesinden istediğin zaman değiştirebilirsin.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
