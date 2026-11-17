import { Ionicons } from "@expo/vector-icons";
import { Redirect, useRouter } from "expo-router";
import { Tabs, type BottomTabBarProps } from "expo-router/js-tabs";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { mealForNow } from "@/lib/calc";
import { useStore } from "@/lib/store";
import { IconName } from "@/lib/types";

const ITEMS: Record<string, { label: string; icon: IconName }> = {
  index: { label: "Ana sayfa", icon: "grid-outline" },
  diary: { label: "Günlük", icon: "book-outline" },
  progress: { label: "İlerleme", icon: "trending-up-outline" },
  profile: { label: "Profil", icon: "person-outline" },
};

function TabBar({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const item = (route: BottomTabBarProps["state"]["routes"][number], index: number) => {
    const focused = state.index === index;
    const cfg = ITEMS[route.name];
    if (!cfg) return null;
    const color = focused ? "#16A34A" : "#131A2E";
    return (
      <Pressable
        key={route.key}
        onPress={() => {
          const e = emitter.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
          if (!focused && !e.defaultPrevented) navigateToTab(route.key);
        }}
        className="flex-1 items-center pt-2"
      >
        <Ionicons name={cfg.icon} size={24} color={color} />
        <Text className="mt-1 text-[11px] font-medium" style={{ color }}>
          {cfg.label}
        </Text>
      </Pressable>
    );
  };

  const routes = state.routes;
  return (
    <View
      className="flex-row border-t border-slate-100 bg-white"
      style={{ paddingBottom: Math.max(insets.bottom, 10) }}
    >
      {routes.slice(0, 2).map((r, i) => item(r, i))}
      <View className="w-20 items-center">
        <Pressable
          onPress={() => router.push({ pathname: "/add", params: { meal: mealForNow() } })}
          className="-mt-6 h-16 w-16 items-center justify-center rounded-full bg-brand active:bg-brand-dark"
          style={{ elevation: 6, shadowColor: "#16A34A", shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } }}
        >
          <Ionicons name="add" size={32} color="#fff" />
        </Pressable>
      </View>
      {routes.slice(2).map((r, i) => item(r, i + 2))}
    </View>
  );
}

export default function TabsLayout() {
  const { ready, profile } = useStore();

  if (!ready) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator color="#22C55E" />
      </View>
    );
  }
  if (!profile.onboarded) return <Redirect href="/onboarding" />;

  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="diary" />
      <Tabs.Screen name="progress" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
