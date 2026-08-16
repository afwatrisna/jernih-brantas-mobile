import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { classifyNtu, formatNtu, type StationState } from "@/lib/jernih-data";

type JernihRiverMapProps = {
  stations: StationState[];
  activeId: string;
  onSelect: (stationId: string) => void;
};

export function JernihRiverMap({ stations, activeId, onSelect }: JernihRiverMapProps) {
  const activeStation = stations.find((station) => station.id === activeId) ?? stations[0];

  return (
    <View>
      <View style={styles.map} accessibilityLabel="Ilustrasi aliran Sungai Brantas dengan titik pemantauan">
        <Svg width="100%" height="100%" viewBox="0 0 100 100" style={StyleSheet.absoluteFill} preserveAspectRatio="none">
          <Path d="M 12 14 C 20 25, 25 32, 30 40 C 38 46, 42 48, 46 52 C 50 56, 52 58, 55 62 C 64 68, 70 72, 78 80" stroke="#9FC5B6" strokeWidth={3.4} fill="none" opacity={0.86} />
          <Path d="M 12 14 C 20 25, 25 32, 30 40 C 38 46, 42 48, 46 52 C 50 56, 52 58, 55 62 C 64 68, 70 72, 78 80" stroke="#DCEBE5" strokeWidth={1} fill="none" opacity={0.75} />
        </Svg>
        {stations.map((station) => {
          const waterClass = classifyNtu(station.ntu);
          const selected = station.id === activeId;
          return (
            <Pressable
              key={station.id}
              accessibilityRole="button"
              accessibilityLabel={`${station.name}, ${formatNtu(station.ntu)} NTU, ${waterClass.label}`}
              onPress={() => onSelect(station.id)}
              style={[styles.markerTapArea, { left: `${station.x}%`, top: `${station.y}%` }]}
            >
              <View style={[styles.marker, { backgroundColor: waterClass.color }, selected && styles.markerSelected]}>
                <View style={styles.markerCore} />
              </View>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.captionRow}>
        <View>
          <Text style={styles.captionTitle}>{activeStation.name}</Text>
          <Text style={styles.captionBody}>{activeStation.subtitle}</Text>
        </View>
        <View style={[styles.valueBadge, { backgroundColor: classifyNtu(activeStation.ntu).softColor }]}>
          <Text style={[styles.valueBadgeText, { color: classifyNtu(activeStation.ntu).color }]}>{formatNtu(activeStation.ntu)} NTU</Text>
        </View>
      </View>
      <Text style={styles.disclaimer}>Ilustrasi aliran untuk navigasi stasiun, bukan peta geografis presisi.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  map: { aspectRatio: 1.62, overflow: "hidden", borderRadius: 18, backgroundColor: "#EAE4D4", position: "relative" },
  markerTapArea: { position: "absolute", width: 44, height: 44, marginLeft: -22, marginTop: -22, alignItems: "center", justifyContent: "center" },
  marker: { width: 18, height: 18, borderRadius: 9, borderWidth: 3, borderColor: "#FFFDF8", alignItems: "center", justifyContent: "center", shadowColor: "#0F1E1C", shadowOpacity: 0.2, shadowRadius: 5, elevation: 3 },
  markerSelected: { width: 24, height: 24, borderRadius: 12, shadowOpacity: 0.35, shadowRadius: 8, elevation: 5 },
  markerCore: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#FFFDF8" },
  captionRow: { marginTop: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  captionTitle: { color: "#17302B", fontSize: 14, fontWeight: "700" },
  captionBody: { color: "#68756D", fontSize: 12, marginTop: 2 },
  valueBadge: { borderRadius: 999, paddingHorizontal: 11, paddingVertical: 7 },
  valueBadgeText: { fontFamily: "monospace", fontSize: 12, fontWeight: "700" },
  disclaimer: { color: "#78817A", fontSize: 10, lineHeight: 15, marginTop: 11 },
});
