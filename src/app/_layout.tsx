import "../../global.css";

import { Stack } from "expo-router/stack";
import { StatusBar } from "expo-status-bar";
import { StoreProvider } from "@/lib/store";

export default function RootLayout() {
  return (
    <StoreProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F6F6FD" } }} />
    </StoreProvider>
  );
}
