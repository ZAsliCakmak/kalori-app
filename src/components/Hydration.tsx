import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { fmt1 } from "@/lib/calc";
import { useStore } from "@/lib/store";
import { WATER_GOAL_ML, WATER_STEP_ML } from "@/lib/types";
import { IconBubble } from "./ui";

export function Hydration({ date }: { date: string }) {
  const { water, addWater } = useStore();
  const ml = water[date] ?? 0;
  const pct = Math.round((ml / WATER_GOAL_ML) * 100);
  return (
    <View className="flex-row items-center rounded-3xl bg-white p-4">
      <IconBubble name="water" color="#1D5FD1" />
      <View className="ml-3 flex-1">
        <Text className="text-lg font-bold text-ink">
          Su <Text className="text-sm font-semibold text-protein">%{pct}</Text>
        </Text>
        <Text className="text-sm text-slate-600">
          {fmt1(ml / 1000)} L / {fmt1(WATER_GOAL_ML / 1000)} L günlük hedef
        </Text>
      </View>
      {ml > 0 ? (
        <Pressable
          onPress={() => addWater(date, -WATER_STEP_ML)}
          hitSlop={8}
          className="mr-2 h-10 w-10 items-center justify-center rounded-full bg-pill"
        >
          <Ionicons name="remove" size={18} color="#131A2E" />
        </Pressable>
      ) : null}
      <Pressable
        onPress={() => addWater(date, WATER_STEP_ML)}
        className="h-10 flex-row items-center rounded-full bg-pill px-3 active:opacity-70"
      >
        <Ionicons name="add" size={16} color="#131A2E" />
        <Text className="ml-1 text-sm font-semibold text-ink">{WATER_STEP_ML} ml</Text>
      </Pressable>
    </View>
  );
}
