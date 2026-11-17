import React, { useState } from "react";
import { Text, View } from "react-native";
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from "react-native-svg";
import { COLORS } from "./ui";

/** Günlük kalori çubuk grafiği. Hedefin üstündeki günler turuncu gösterilir. */
export function BarChart({
  data,
  goal,
  height = 150,
}: {
  data: { label: string; value: number }[];
  goal: number;
  height?: number;
}) {
  const max = Math.max(goal * 1.15, ...data.map((d) => d.value), 1);
  const goalTop = height - (goal / max) * height;
  const showLabels = data.length <= 14;
  return (
    <View>
      <View style={{ height }} className="flex-row items-end">
        <View
          className="absolute left-0 right-0 border-t border-slate-300"
          style={{ top: goalTop }}
        />
        {data.map((d, i) => {
          const h = Math.max(d.value > 0 ? 4 : 0, (d.value / max) * height);
          const over = d.value > goal;
          return (
            <View key={i} className="flex-1 items-center justify-end" style={{ height }}>
              <View
                style={{
                  height: h,
                  width: showLabels ? "62%" : "70%",
                  backgroundColor: over ? COLORS.carbs : COLORS.brand,
                  borderTopLeftRadius: 999,
                  borderTopRightRadius: 999,
                }}
              />
            </View>
          );
        })}
      </View>
      {showLabels ? (
        <View className="mt-2 flex-row">
          {data.map((d, i) => (
            <Text key={i} className="flex-1 text-center text-[11px] text-slate-500">
              {d.label}
            </Text>
          ))}
        </View>
      ) : (
        <View className="mt-2 flex-row justify-between">
          <Text className="text-[11px] text-slate-500">{data[0]?.label}</Text>
          <Text className="text-[11px] text-slate-500">{data[data.length - 1]?.label}</Text>
        </View>
      )}
    </View>
  );
}

/** Kilo eğilimi çizgi grafiği. */
export function LineChart({
  points,
  target,
  height = 130,
}: {
  points: { label: string; value: number }[];
  target?: number;
  height?: number;
}) {
  const [width, setWidth] = useState(0);
  const pad = 10;
  const values = points.map((p) => p.value);
  if (target) values.push(target);
  const min = Math.min(...values) - 0.5;
  const max = Math.max(...values) + 0.5;
  const x = (i: number) =>
    points.length === 1 ? width / 2 : pad + (i * (width - pad * 2)) / (points.length - 1);
  const y = (v: number) => pad + (1 - (v - min) / (max - min)) * (height - pad * 2);

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.value)}`).join(" ");
  const area =
    points.length > 1
      ? `${line} L${x(points.length - 1)},${height} L${x(0)},${height} Z`
      : "";

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 ? (
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={COLORS.brand} stopOpacity={0.25} />
              <Stop offset="1" stopColor={COLORS.brand} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          {target ? (
            <Line
              x1={0}
              x2={width}
              y1={y(target)}
              y2={y(target)}
              stroke="#CBD5E1"
              strokeDasharray="4 4"
            />
          ) : null}
          {area ? <Path d={area} fill="url(#fill)" /> : null}
          {points.length > 1 ? <Path d={line} stroke={COLORS.brand} strokeWidth={2.5} fill="none" /> : null}
          {points.map((p, i) => (
            <Circle
              key={i}
              cx={x(i)}
              cy={y(p.value)}
              r={4}
              fill={i === points.length - 1 ? COLORS.brand : "#fff"}
              stroke={COLORS.brand}
              strokeWidth={2}
            />
          ))}
        </Svg>
      ) : (
        <View style={{ height }} />
      )}
      <View className="mt-1 flex-row justify-between">
        <Text className="text-[11px] text-slate-500">{points[0]?.label}</Text>
        {points.length > 1 ? (
          <Text className="text-[11px] font-bold text-brand-dark">
            {points[points.length - 1]?.label}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
