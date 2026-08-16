import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G, Line, Path, Text as SvgText } from "react-native-svg";

import type { Reading } from "@/lib/jernih-data";

type JernihLineChartProps = {
  data: Reading[];
};

export function JernihLineChart({ data }: JernihLineChartProps) {
  const geometry = useMemo(() => {
    const width = 332;
    const height = 178;
    const padding = { top: 16, right: 14, bottom: 28, left: 35 };
    const values = data.map((entry) => entry.ntu);
    const dataMin = Math.min(...values, 0);
    const dataMax = Math.max(...values, 25);
    const paddingValue = Math.max((dataMax - dataMin) * 0.18, 5);
    const min = Math.max(0, dataMin - paddingValue);
    const max = dataMax + paddingValue;
    const range = max - min || 1;
    const graphWidth = width - padding.left - padding.right;
    const graphHeight = height - padding.top - padding.bottom;
    const points = data.map((entry, index) => ({
      x: padding.left + (index / Math.max(data.length - 1, 1)) * graphWidth,
      y: padding.top + graphHeight - ((entry.ntu - min) / range) * graphHeight,
    }));
    const line = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
    return { width, height, padding, min, max, graphWidth, graphHeight, points, line };
  }, [data]);

  if (data.length < 2) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Data belum cukup untuk menampilkan tren</Text>
        <Text style={styles.emptyBody}>Riwayat akan terbentuk setelah sensor simulasi atau pengukuran manual mencatat data.</Text>
      </View>
    );
  }

  const { width, height, padding, min, max, graphWidth, graphHeight, points, line } = geometry;
  const guideFractions = [0, 0.5, 1];

  return (
    <View style={styles.container} accessibilityLabel="Grafik tren kekeruhan air dalam NTU">
      <Svg width="100%" height={178} viewBox={`0 0 ${width} ${height}`}>
        {guideFractions.map((fraction) => {
          const y = padding.top + fraction * graphHeight;
          const value = max - fraction * (max - min);
          return (
            <G key={`guide-${fraction}`}>
              <Line x1={padding.left} y1={y} x2={padding.left + graphWidth} y2={y} stroke="#DED8C8" strokeWidth={1} />
              <SvgText x={4} y={y + 4} fill="#78817A" fontSize={9} fontFamily="monospace">
                {value.toFixed(0)}
              </SvgText>
            </G>
          );
        })}
        <Path d={line} fill="none" stroke="#2D6A5C" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point, index) => (
          <Circle
            key={`${point.x}-${point.y}`}
            cx={point.x}
            cy={point.y}
            r={index === points.length - 1 ? 4.5 : 2.7}
            fill={index === points.length - 1 ? "#C4622D" : "#2D6A5C"}
            stroke="#FFFDF8"
            strokeWidth={index === points.length - 1 ? 2.5 : 1.5}
          />
        ))}
      </Svg>
      <View style={styles.axisLabels}>
        <Text style={styles.axisLabel}>{data[0].waktu}</Text>
        <Text style={styles.axisLabel}>NTU</Text>
        <Text style={styles.axisLabel}>{data[data.length - 1].waktu}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { minHeight: 202 },
  axisLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: -5, paddingHorizontal: 4 },
  axisLabel: { color: "#78817A", fontFamily: "monospace", fontSize: 10 },
  empty: { alignItems: "center", justifyContent: "center", minHeight: 178, paddingHorizontal: 24, backgroundColor: "#F6F2E9", borderRadius: 16 },
  emptyTitle: { color: "#17302B", fontSize: 14, fontWeight: "700", textAlign: "center", marginBottom: 6 },
  emptyBody: { color: "#68756D", fontSize: 12, lineHeight: 18, textAlign: "center" },
});
