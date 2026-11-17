import { CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { PrimaryButton, Screen, StackHeader } from "@/components/ui";
import { getByBarcode } from "@/lib/api";
import { useStore } from "@/lib/store";

export default function BarcodeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ meal?: string; date?: string }>();
  const { selectFood } = useStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const lock = useRef(false);

  const onScan = async (code: string) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setMessage(null);
    try {
      const food = await getByBarcode(code);
      if (food) {
        selectFood(food);
        router.replace({ pathname: "/food", params: { meal: params.meal, date: params.date } });
        return;
      }
      setMessage(`Bu barkod (${code}) için kalori bilgisi bulunamadı.`);
    } catch {
      setMessage("Ürün bilgisi alınamadı. Bağlantını kontrol et.");
    }
    setBusy(false);
    setTimeout(() => (lock.current = false), 2000);
  };

  return (
    <Screen>
      <StackHeader title="Barkod tara" />
      {!permission ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#22C55E" />
        </View>
      ) : !permission.granted ? (
        <View className="flex-1 justify-center px-8">
          <Text className="mb-4 text-center text-base text-ink">
            Barkod okutmak için kamera izni gerekiyor.
          </Text>
          <PrimaryButton label="Kamera izni ver" onPress={requestPermission} />
        </View>
      ) : (
        <View className="mx-4 mb-6 flex-1 overflow-hidden rounded-3xl bg-black">
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"] }}
            onBarcodeScanned={({ data }) => onScan(data)}
          />
          <View className="absolute bottom-0 left-0 right-0 items-center bg-black/60 p-4">
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-center text-sm text-white">
                {message ?? "Ürünün barkodunu kameraya göster"}
              </Text>
            )}
          </View>
        </View>
      )}
    </Screen>
  );
}
