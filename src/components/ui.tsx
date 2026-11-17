import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import { fmt } from "@/lib/calc";
import { IconName } from "@/lib/types";

export const COLORS = {
  brand: "#22C55E",
  brandDark: "#15803D",
  ink: "#131A2E",
  pill: "#ECEEFA",
  protein: "#1D5FD1",
  carbs: "#F9903C",
  fat: "#C0261F",
  muted: "#64748B",
};

export function Screen({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      {children}
    </View>
  );
}

function Logo() {
  return (
    <View className="h-10 w-10 items-center justify-center rounded-xl bg-brand">
      <Ionicons name="leaf" size={20} color="#fff" />
    </View>
  );
}

/** Sekme ekranlarının üst başlığı. */
export function TabHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <View className="flex-row items-center px-5 pb-3 pt-2">
      <Logo />
      <View className="ml-3 flex-1">
        <Text className="text-[11px] font-bold tracking-widest text-brand-dark">KALORİ</Text>
        <Text className="text-xl font-extrabold text-ink">{title}</Text>
      </View>
      {right}
    </View>
  );
}

/** Alt ekranların (besin ekle, tarama vb.) üst başlığı. */
export function StackHeader({ title }: { title: string }) {
  const router = useRouter();
  return (
    <View className="flex-row items-center px-4 pb-3 pt-2">
      <Pressable onPress={() => router.back()} hitSlop={12} className="mr-2 h-10 w-8 justify-center">
        <Ionicons name="chevron-back" size={26} color={COLORS.ink} />
      </Pressable>
      <Logo />
      <Text className="ml-3 flex-1 text-xl font-bold text-ink">{title}</Text>
      <Pressable onPress={() => router.canDismiss() && router.dismissAll()} hitSlop={12} className="h-10 w-10 items-center justify-center">
        <Ionicons name="close" size={26} color={COLORS.ink} />
      </Pressable>
    </View>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <View className={`rounded-3xl bg-white p-5 ${className}`}>{children}</View>;
}

export function IconBubble({
  name,
  color = COLORS.ink,
  bg = "bg-pill",
  size = 44,
}: {
  name: IconName;
  color?: string;
  bg?: string;
  size?: number;
}) {
  return (
    <View className={`items-center justify-center rounded-full ${bg}`} style={{ width: size, height: size }}>
      <Ionicons name={name} size={size * 0.45} color={color} />
    </View>
  );
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  dark = false,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  dark?: boolean;
}) {
  return (
    <View className="flex-row rounded-full bg-pill p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => onChange(o.value)}
            className={`flex-1 items-center rounded-full py-2.5 ${
              active ? (dark ? "bg-ink" : "bg-white") : ""
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                active ? (dark ? "text-white" : "text-ink") : "text-slate-600"
              }`}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Bar({ pct, color, height = 6 }: { pct: number; color: string; height?: number }) {
  const w = Math.max(0, Math.min(100, pct));
  return (
    <View className="overflow-hidden rounded-full bg-pill" style={{ height }}>
      <View className="rounded-full" style={{ height, width: `${w}%`, backgroundColor: color }} />
    </View>
  );
}

/** Tek renkli ilerleme halkası. */
export function Ring({
  pct,
  size = 110,
  stroke = 10,
  color = COLORS.brandDark,
  children,
}: {
  pct: number;
  size?: number;
  stroke?: number;
  color?: string;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, pct));
  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={COLORS.pill} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${(c * p) / 100} ${c}`}
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      {children}
    </View>
  );
}

/** Çok dilimli halka (makro dağılımı). */
export function Donut({
  parts,
  size = 110,
  stroke = 12,
  children,
}: {
  parts: { value: number; color: string }[];
  size?: number;
  stroke?: number;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const total = parts.reduce((s, p) => s + p.value, 0);
  let offset = 0;
  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={COLORS.pill} strokeWidth={stroke} fill="none" />
        {total > 0 &&
          parts.map((p, i) => {
            const len = (c * p.value) / total;
            const el = (
              <Circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke={p.color}
                strokeWidth={stroke}
                fill="none"
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-offset}
                rotation={-90}
                origin={`${size / 2}, ${size / 2}`}
              />
            );
            offset += len;
            return el;
          })}
      </Svg>
      {children}
    </View>
  );
}

const MACROS = [
  { key: "protein", label: "Protein", color: COLORS.protein, text: "text-protein" },
  { key: "carbs", label: "Karb.", color: COLORS.carbs, text: "text-carbs" },
  { key: "fat", label: "Yağ", color: COLORS.fat, text: "text-fat" },
] as const;

/** Üçlü makro kartı satırı: alınan / hedef. */
export function MacroCards({
  totals,
  targets,
}: {
  totals: { protein: number; carbs: number; fat: number };
  targets: { protein: number; carbs: number; fat: number };
}) {
  return (
    <View className="-mx-1 flex-row">
      {MACROS.map((m) => {
        const val = totals[m.key];
        const target = targets[m.key];
        const pct = target ? Math.round((val / target) * 100) : 0;
        return (
          <View key={m.key} className="mx-1 flex-1 rounded-2xl bg-white p-3">
            <View className="flex-row items-center justify-between">
              <Text className={`text-xs font-bold ${m.text}`}>{m.label}</Text>
              <Text className="text-xs text-slate-500">%{pct}</Text>
            </View>
            <View className="my-2">
              <Bar pct={pct} color={m.color} />
            </View>
            <View className="flex-row items-end justify-between">
              <Text className="text-lg font-extrabold text-ink">{Math.round(val)}g</Text>
              <Text className="mb-0.5 text-xs text-slate-500">/{target}g</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** "P 12g · K 30g · Y 5g" renkli makro satırı. */
export function MacroLine({ p, c, f }: { p: number; c: number; f: number }) {
  return (
    <View className="flex-row items-center">
      <Text className="text-xs font-semibold text-protein">P {Math.round(p)}g</Text>
      <Text className="mx-1.5 text-xs text-slate-300">•</Text>
      <Text className="text-xs font-semibold text-carbs">K {Math.round(c)}g</Text>
      <Text className="mx-1.5 text-xs text-slate-300">•</Text>
      <Text className="text-xs font-semibold text-fat">Y {Math.round(f)}g</Text>
    </View>
  );
}

export function Kcal({ value, size = "text-2xl" }: { value: number; size?: string }) {
  return (
    <View className="flex-row items-end">
      <Text className={`${size} font-extrabold text-ink`}>{fmt(value)}</Text>
      <Text className="mb-1 ml-1 text-xs text-slate-500">kcal</Text>
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  icon,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: IconName;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`h-14 flex-row items-center justify-center rounded-full ${
        disabled ? "bg-slate-300" : "bg-brand active:bg-brand-dark"
      }`}
    >
      {icon ? <Ionicons name={icon} size={20} color="#fff" style={{ marginRight: 8 }} /> : null}
      <Text className="text-base font-bold text-white">{label}</Text>
    </Pressable>
  );
}

export function Chip({
  label,
  active,
  onPress,
  dark = false,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  dark?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`mb-2 mr-2 rounded-full px-4 py-2.5 ${
        active ? (dark ? "bg-ink" : "bg-brand-dark") : "bg-white"
      }`}
    >
      <Text className={`text-sm font-semibold ${active ? "text-white" : "text-ink"}`}>{label}</Text>
    </Pressable>
  );
}
