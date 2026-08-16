import AsyncStorage from "@react-native-async-storage/async-storage";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { JernihLineChart } from "@/components/jernih-line-chart";
import { JernihRiverMap } from "@/components/jernih-river-map";
import { ScreenContainer } from "@/components/screen-container";
import { haptic } from "@/lib/haptics";
import {
  EQUIPMENT,
  INITIAL_STATIONS,
  MAX_HISTORY,
  STORAGE_KEY,
  classifyNtu,
  createReading,
  formatNtu,
  initialStationStates,
  sanitizeHistory,
  type HistoryByStation,
  type Reading,
  type StationState,
} from "@/lib/jernih-data";

type Section = "home" | "stations" | "measure" | "analytics" | "settings";
type Sheet = "station" | "formStation" | "equipment" | "reset" | null;
type AnalyticsMode = "trend" | "history";
type Range = "24H" | "7H" | "30H" | "Semua";
type ToastTone = "success" | "warning" | "neutral";
type Toast = { text: string; tone: ToastTone } | null;

const RANGE_MS: Record<Exclude<Range, "Semua">, number> = {
  "24H": 24 * 60 * 60 * 1000,
  "7H": 7 * 24 * 60 * 60 * 1000,
  "30H": 30 * 24 * 60 * 60 * 1000,
};

const NAV_ITEMS: { key: Section; label: string; icon: React.ComponentProps<typeof MaterialIcons>["name"] }[] = [
  { key: "home", label: "Beranda", icon: "home-filled" },
  { key: "stations", label: "Stasiun", icon: "place" },
  { key: "measure", label: "Ukur", icon: "add" },
  { key: "analytics", label: "Analitik", icon: "insert-chart" },
  { key: "settings", label: "Atur", icon: "settings" },
];

function persistHistory(history: HistoryByStation) {
  return AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(history)).catch(() => undefined);
}

function valueTrend(readings: Reading[]) {
  if (readings.length < 2) return { icon: "remove" as const, label: "Belum cukup data" };
  const delta = readings[readings.length - 1].ntu - readings[readings.length - 2].ntu;
  if (delta > 0.5) return { icon: "north-east" as const, label: "Naik dari catatan sebelumnya" };
  if (delta < -0.5) return { icon: "south-east" as const, label: "Turun dari catatan sebelumnya" };
  return { icon: "trending-flat" as const, label: "Stabil dari catatan sebelumnya" };
}

function lastReading(history: HistoryByStation, stationId: string) {
  const readings = history[stationId] ?? [];
  return readings[readings.length - 1];
}

function WaterStatusCard({ station, readings, simulation }: { station: StationState; readings: Reading[]; simulation: boolean }) {
  const waterClass = classifyNtu(station.ntu);
  const trend = valueTrend(readings);
  const latest = readings[readings.length - 1];
  const valueOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    valueOpacity.setValue(0.55);
    Animated.timing(valueOpacity, { toValue: 1, duration: 260, useNativeDriver: true }).start();
  }, [station.ntu, valueOpacity]);

  return (
    <View style={styles.statusCard}>
      <View style={styles.statusOrbLarge} />
      <View style={styles.statusOrbSmall} />
      <View style={styles.statusTopRow}>
        <View style={styles.statusLocation}>
          <Text style={styles.statusRiver}>Sungai Brantas · {station.subtitle}</Text>
          <Text style={styles.statusStationName}>{station.name}</Text>
        </View>
        <View style={[styles.modeBadge, !simulation && styles.modeBadgePaused]}>
          <View style={[styles.modeDot, !simulation && styles.modeDotPaused]} />
          <Text style={styles.modeText}>{simulation ? "SIMULASI" : "DIJEDA"}</Text>
        </View>
      </View>

      <View style={styles.valueRow}>
        <View>
          <View style={styles.valueLine}>
            <Animated.Text style={[styles.ntuValue, { opacity: valueOpacity }]}>{formatNtu(station.ntu)}</Animated.Text>
            <Text style={styles.ntuUnit}>NTU</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: waterClass.softColor }]}>
            <View style={[styles.statusPillDot, { backgroundColor: waterClass.color }]} />
            <Text style={[styles.statusPillText, { color: waterClass.color }]}>{waterClass.label} · Kelas {waterClass.grade}</Text>
          </View>
        </View>
        <View style={styles.gaugeWrap}>
          <View style={styles.gaugeTrack}>
            <View style={[styles.gaugeFill, { height: `${Math.min(Math.max((station.ntu / 100) * 100, 4), 100)}%` }]} />
          </View>
          <Text style={styles.gaugeLabel}>100</Text>
          <Text style={[styles.gaugeLabel, styles.gaugeLabelMid]}>50</Text>
          <Text style={[styles.gaugeLabel, styles.gaugeLabelLow]}>0</Text>
        </View>
      </View>

      <View style={styles.statusFooter}>
        <View style={styles.footerMetric}>
          <MaterialIcons name={trend.icon} size={15} color="#A9CBBE" />
          <Text style={styles.statusFooterText}>{trend.label}</Text>
        </View>
        <Text style={styles.statusFooterText}>{latest ? `Terbarui ${latest.waktu} WIB` : "Menunggu pembacaan"}</Text>
      </View>
    </View>
  );
}

function StationSelector({ stations, activeId, onSelect }: { stations: StationState[]; activeId: string; onSelect: (id: string) => void }) {
  return (
    <FlatList
      data={stations}
      horizontal
      keyExtractor={(station) => station.id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.stationSelectorList}
      renderItem={({ item: station }) => {
        const selected = station.id === activeId;
        const waterClass = classifyNtu(station.ntu);
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Pilih ${station.name}, ${formatNtu(station.ntu)} NTU`}
            onPress={() => onSelect(station.id)}
            style={({ pressed }) => [styles.stationChip, selected && styles.stationChipSelected, pressed && styles.pressed]}
          >
            <View style={styles.stationChipTitleLine}>
              <View style={[styles.statusDot, { backgroundColor: waterClass.color }]} />
              <Text style={[styles.stationChipTitle, selected && styles.stationChipTitleSelected]} numberOfLines={1}>{station.name}</Text>
            </View>
            <Text style={[styles.stationChipSub, selected && styles.stationChipSubSelected]} numberOfLines={1}>{station.subtitle}</Text>
            <Text style={[styles.stationChipValue, selected && styles.stationChipValueSelected]}>{formatNtu(station.ntu)} NTU</Text>
          </Pressable>
        );
      }}
    />
  );
}

function MetricTile({ value, label, highlight }: { value: string; label: string; highlight?: boolean }) {
  return (
    <View style={[styles.metricTile, highlight && styles.metricTileHighlight]}>
      <Text style={[styles.metricValue, highlight && styles.metricValueHighlight]}>{value}</Text>
      <Text style={[styles.metricLabel, highlight && styles.metricLabelHighlight]}>{label}</Text>
    </View>
  );
}

function SectionHeader({ title, body, action }: { title: string; body?: string; action?: React.ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderCopy}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {body ? <Text style={styles.sectionBody}>{body}</Text> : null}
      </View>
      {action}
    </View>
  );
}

function BottomSheet({ visible, title, onClose, children }: { visible: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.sheetOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Tutup" />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <Pressable onPress={onClose} style={({ pressed }) => [styles.sheetClose, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Tutup">
              <MaterialIcons name="close" size={21} color="#17302B" />
            </Pressable>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}

function AppHeader({ simulation, onSettings }: { simulation: boolean; onSettings: () => void }) {
  return (
    <View style={styles.appHeader}>
      <View style={styles.brandLine}>
        <View style={styles.brandMark}><MaterialIcons name="water-drop" size={18} color="#FFFDF8" /></View>
        <View>
          <Text style={styles.brandTitle}>Jernih</Text>
          <Text style={styles.brandSubtitle}>BRANTAS</Text>
        </View>
      </View>
      <Pressable onPress={onSettings} style={({ pressed }) => [styles.headerMode, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Buka pengaturan simulasi">
        <View style={[styles.headerModeDot, !simulation && styles.modeDotPaused]} />
        <Text style={styles.headerModeText}>{simulation ? "SIMULASI" : "DIJEDA"}</Text>
      </Pressable>
    </View>
  );
}

export default function HomeScreen() {
  const [stations, setStations] = useState<StationState[]>(initialStationStates);
  const [history, setHistory] = useState<HistoryByStation>({});
  const [activeId, setActiveId] = useState("malang");
  const [section, setSection] = useState<Section>("home");
  const [simulation, setSimulation] = useState(true);
  const [ready, setReady] = useState(false);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [measureStationId, setMeasureStationId] = useState("malang");
  const [measureNtu, setMeasureNtu] = useState("");
  const [measureEquipment, setMeasureEquipment] = useState<(typeof EQUIPMENT)[number]>(EQUIPMENT[0]);
  const [analyticsMode, setAnalyticsMode] = useState<AnalyticsMode>("trend");
  const [range, setRange] = useState<Range>("Semua");
  const [toast, setToast] = useState<Toast>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((text: string, tone: ToastTone = "neutral") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ text, tone });
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }, []);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!mounted || !raw) return;
        const saved = sanitizeHistory(JSON.parse(raw));
        const restoredStations = initialStationStates().map((station) => {
          const latest = lastReading(saved, station.id);
          return latest ? { ...station, ntu: latest.ntu } : station;
        });
        setHistory(saved);
        setStations(restoredStations);
      })
      .catch(() => {
        if (mounted) showToast("Riwayat tersimpan tidak dapat dibaca. Aplikasi tetap berjalan.", "warning");
      })
      .finally(() => {
        if (mounted) setReady(true);
      });
    return () => {
      mounted = false;
    };
  }, [showToast]);

  const appendReadings = useCallback((newEntries: Record<string, Reading>) => {
    setHistory((current) => {
      const next: HistoryByStation = { ...current };
      Object.entries(newEntries).forEach(([stationId, entry]) => {
        next[stationId] = [...(next[stationId] ?? []), entry].slice(-MAX_HISTORY);
      });
      void persistHistory(next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!ready || !simulation) return;
    const interval = setInterval(() => {
      const entries: Record<string, Reading> = {};
      setStations((current) => {
        const next = current.map((station) => {
          const spike = Math.random() < 0.06 ? Math.random() * 18 - 4 : 0;
          const noise = (Math.random() - 0.5) * 3.2;
          const estimated = station.ntu + noise + spike;
          const nudged = estimated + (station.baseline - estimated) * 0.04;
          const ntu = Math.max(1.2, Math.round(nudged * 10) / 10);
          entries[station.id] = createReading(ntu, "sensor", "Sensor NTU-Logger V2");
          return { ...station, ntu };
        });
        return next;
      });
      appendReadings(entries);
    }, 4000);
    return () => clearInterval(interval);
  }, [appendReadings, ready, simulation]);

  const activeStation = stations.find((station) => station.id === activeId) ?? stations[0];
  const activeHistory = useMemo(() => history[activeStation.id] ?? [], [history, activeStation.id]);
  const allReadings = useMemo(() => Object.values(history).flat(), [history]);
  const averageRiver = stations.reduce((total, station) => total + station.ntu, 0) / stations.length;
  const compliantStations = stations.filter((station) => station.ntu <= 25).length;

  const selectStation = useCallback((stationId: string, destination?: Section) => {
    haptic.selection();
    setActiveId(stationId);
    setMeasureStationId(stationId);
    if (destination) setSection(destination);
    setSheet(null);
  }, []);

  const navigate = useCallback((destination: Section) => {
    haptic.light();
    if (destination === "measure") setMeasureStationId(activeId);
    setSection(destination);
  }, [activeId]);

  const submitMeasurement = useCallback(() => {
    const parsed = Number.parseFloat(measureNtu.replace(",", "."));
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 500) {
      haptic.error();
      showToast("Nilai NTU harus berada antara 0–500.", "warning");
      return;
    }
    const reading = createReading(parsed, "manual", measureEquipment);
    appendReadings({ [measureStationId]: reading });
    setStations((current) => current.map((station) => station.id === measureStationId ? { ...station, ntu: reading.ntu } : station));
    setActiveId(measureStationId);
    setMeasureNtu("");
    haptic.success();
    const station = INITIAL_STATIONS.find((item) => item.id === measureStationId);
    showToast(`Pengukuran tersimpan · ${station?.name ?? "Stasiun"}`, "success");
    setSection("home");
  }, [appendReadings, measureEquipment, measureNtu, measureStationId, showToast]);

  const resetData = useCallback(() => {
    haptic.medium();
    setHistory({});
    void persistHistory({});
    setStations(initialStationStates());
    setActiveId("malang");
    setMeasureStationId("malang");
    setSheet(null);
    haptic.success();
    showToast("Semua riwayat pengukuran telah direset.", "success");
  }, [showToast]);

  const filteredHistory = useMemo(() => {
    if (range === "Semua") return activeHistory;
    const cutoff = Date.now() - RANGE_MS[range];
    return activeHistory.filter((entry) => entry.ts >= cutoff);
  }, [activeHistory, range]);

  const analyticsStats = useMemo(() => {
    const values = filteredHistory.map((entry) => entry.ntu);
    if (!values.length) return null;
    return {
      current: values[values.length - 1],
      average: values.reduce((sum, value) => sum + value, 0) / values.length,
      minimum: Math.min(...values),
      maximum: Math.max(...values),
      count: values.length,
    };
  }, [filteredHistory]);

  const renderHome = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.introBlock}>
        <Text style={styles.eyebrow}>PEMANTAUAN KEJERNIHAN</Text>
        <Text style={styles.pageDisplay}>Kondisi sungai{`\n`}saat ini.</Text>
        <Text style={styles.introCopy}>Pantau titik-titik penting Sungai Brantas dan catat pembacaan lapangan dalam satu alur yang ringkas.</Text>
      </View>
      <StationSelector stations={stations} activeId={activeId} onSelect={selectStation} />
      <WaterStatusCard station={activeStation} readings={activeHistory} simulation={simulation} />

      <View style={styles.metricGrid}>
        <MetricTile value={`${formatNtu(averageRiver)}`} label="Rata-rata sungai" />
        <MetricTile value={`${compliantStations}/5`} label="Sesuai Kelas II" highlight />
        <MetricTile value={`${allReadings.length}`} label="Data tercatat" />
      </View>

      <View style={styles.surfaceCard}>
        <SectionHeader title="Aliran & titik pantau" body="Sentuh penanda untuk memilih stasiun." />
        <JernihRiverMap stations={stations} activeId={activeId} onSelect={selectStation} />
      </View>

      <View style={styles.surfaceCard}>
        <SectionHeader title="Catat hasil lapangan" body="Masukkan pembacaan turbidimeter manual untuk memperbarui riwayat dan analitik." />
        <Pressable onPress={() => navigate("measure")} style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]} accessibilityRole="button">
          <MaterialIcons name="add" size={21} color="#FFFDF8" />
          <Text style={styles.primaryActionText}>Tambah pengukuran</Text>
          <MaterialIcons name="arrow-forward" size={19} color="#D7EBE0" style={styles.actionArrow} />
        </Pressable>
      </View>
    </ScrollView>
  );

  const renderStations = () => (
    <FlatList
      data={stations}
      keyExtractor={(station) => station.id}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View style={styles.introBlock}>
          <Text style={styles.eyebrow}>TITIK PEMANTAUAN</Text>
          <Text style={styles.pageDisplay}>Lima stasiun{`\n`}di Brantas.</Text>
          <Text style={styles.introCopy}>Pilih satu stasiun untuk melihat kondisi terkini di Beranda.</Text>
        </View>
      }
      renderItem={({ item: station }) => {
        const waterClass = classifyNtu(station.ntu);
        const latest = lastReading(history, station.id);
        const selected = station.id === activeId;
        return (
          <Pressable
            onPress={() => selectStation(station.id, "home")}
            accessibilityRole="button"
            accessibilityLabel={`${station.name}, ${formatNtu(station.ntu)} NTU, ${waterClass.label}. Buka detail di Beranda.`}
            style={({ pressed }) => [styles.stationListCard, selected && styles.stationListCardSelected, pressed && styles.pressed]}
          >
            <View style={[styles.stationColorBar, { backgroundColor: waterClass.color }]} />
            <View style={styles.stationListMain}>
              <View style={styles.stationListTop}>
                <View style={styles.stationListCopy}>
                  <Text style={styles.stationListName}>{station.name}</Text>
                  <Text style={styles.stationListSub}>{station.subtitle}</Text>
                </View>
                <View>
                  <Text style={styles.stationListValue}>{formatNtu(station.ntu)}</Text>
                  <Text style={styles.stationListUnit}>NTU</Text>
                </View>
              </View>
              <View style={styles.stationListFooter}>
                <View style={[styles.smallStatus, { backgroundColor: waterClass.softColor }]}>
                  <Text style={[styles.smallStatusText, { color: waterClass.color }]}>{waterClass.label} · Kelas {waterClass.grade}</Text>
                </View>
                <Text style={styles.latestText}>{latest ? `${latest.waktu} WIB` : "Belum ada data"}</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={22} color="#78817A" />
          </Pressable>
        );
      }}
      ListFooterComponent={
        <View style={styles.legendCard}>
          <Text style={styles.legendTitle}>Klasifikasi kekeruhan</Text>
          <Text style={styles.legendCopy}>≤5 Sangat Jernih · &gt;5–25 Jernih · &gt;25–50 Keruh · &gt;50 Sangat Keruh</Text>
        </View>
      }
    />
  );

  const selectedMeasureStation = stations.find((station) => station.id === measureStationId) ?? stations[0];
  const measurementValue = Number.parseFloat(measureNtu.replace(",", "."));
  const measurementInvalid = measureNtu.length > 0 && (!Number.isFinite(measurementValue) || measurementValue < 0 || measurementValue > 500);

  const renderMeasure = () => (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.select({ ios: "padding", default: undefined })}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.introBlock}>
          <Text style={styles.eyebrow}>PENGUKURAN MANUAL</Text>
          <Text style={styles.pageDisplay}>Catat hasil{`\n`}lapangan.</Text>
          <Text style={styles.introCopy}>Pembacaan tersimpan hanya di perangkat ini dan langsung memperbarui riwayat stasiun.</Text>
        </View>

        <View style={styles.measurementCard}>
          <Text style={styles.formLabel}>STASIUN</Text>
          <Pressable onPress={() => setSheet("formStation")} style={({ pressed }) => [styles.selectControl, pressed && styles.pressed]} accessibilityRole="button">
            <View>
              <Text style={styles.selectValue}>{selectedMeasureStation.name}</Text>
              <Text style={styles.selectHint}>{selectedMeasureStation.subtitle}</Text>
            </View>
            <MaterialIcons name="expand-more" size={24} color="#E0ECE5" />
          </Pressable>

          <Text style={styles.formLabel}>NILAI KEKERUHAN</Text>
          <View style={[styles.ntuInputWrap, measurementInvalid && styles.ntuInputInvalid]}>
            <TextInput
              value={measureNtu}
              onChangeText={setMeasureNtu}
              placeholder="18.4"
              placeholderTextColor="#9FB2A8"
              keyboardType="decimal-pad"
              returnKeyType="done"
              maxLength={6}
              style={styles.ntuInput}
              accessibilityLabel="Nilai kekeruhan dalam NTU"
            />
            <Text style={styles.inputUnit}>NTU</Text>
          </View>
          <Text style={[styles.inputSupport, measurementInvalid && styles.inputSupportInvalid]}>{measurementInvalid ? "Masukkan angka antara 0 sampai 500 NTU." : "Gunakan angka desimal bila diperlukan. Rentang yang dapat dicatat: 0–500 NTU."}</Text>

          <Text style={styles.formLabel}>ALAT</Text>
          <Pressable onPress={() => setSheet("equipment")} style={({ pressed }) => [styles.selectControl, pressed && styles.pressed]} accessibilityRole="button">
            <Text style={styles.selectValue}>{measureEquipment}</Text>
            <MaterialIcons name="expand-more" size={24} color="#E0ECE5" />
          </Pressable>

          <Pressable onPress={submitMeasurement} style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]} accessibilityRole="button">
            <MaterialIcons name="save" size={19} color="#17302B" />
            <Text style={styles.saveButtonText}>Simpan pengukuran</Text>
          </Pressable>
          <View style={styles.formFootnote}>
            <MaterialIcons name="info-outline" size={15} color="#A7C3B5" />
            <Text style={styles.formFootnoteText}>Waktu, sumber, ID, dan klasifikasi dibuat otomatis saat pengukuran disimpan.</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderAnalytics = () => {
    const sortedHistory = [...filteredHistory].sort((a, b) => b.ts - a.ts);
    return (
      <FlatList
        data={analyticsMode === "history" ? sortedHistory : []}
        keyExtractor={(reading) => reading.id}
        contentContainerStyle={styles.analyticsListContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <View style={styles.introBlock}>
              <Text style={styles.eyebrow}>ANALITIK STASIUN</Text>
              <Text style={styles.pageDisplay}>Baca pola,{`\n`}bukan sekadar angka.</Text>
              <Text style={styles.introCopy}>Analitik berikut menggunakan data lokal yang benar-benar tersedia untuk stasiun aktif.</Text>
            </View>

            <Pressable onPress={() => setSheet("station")} style={({ pressed }) => [styles.activeStationControl, pressed && styles.pressed]} accessibilityRole="button">
              <View style={[styles.activeStationDot, { backgroundColor: classifyNtu(activeStation.ntu).color }]} />
              <View style={styles.flex}>
                <Text style={styles.activeStationLabel}>STASIUN AKTIF</Text>
                <Text style={styles.activeStationName}>{activeStation.name} · {activeStation.subtitle}</Text>
              </View>
              <MaterialIcons name="expand-more" size={22} color="#17302B" />
            </Pressable>

            <View style={styles.segmentedControl}>
              {(["trend", "history"] as AnalyticsMode[]).map((mode) => (
                <Pressable key={mode} onPress={() => { haptic.selection(); setAnalyticsMode(mode); }} style={({ pressed }) => [styles.segment, analyticsMode === mode && styles.segmentActive, pressed && styles.pressed]} accessibilityRole="button">
                  <Text style={[styles.segmentText, analyticsMode === mode && styles.segmentTextActive]}>{mode === "trend" ? "Tren" : "Riwayat"}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={analyticsMode === "history" ? (
          <View style={styles.emptyHistory}>
            <MaterialIcons name="inbox" size={32} color="#92A69A" />
            <Text style={styles.emptyHistoryTitle}>Belum ada pengukuran</Text>
            <Text style={styles.emptyHistoryBody}>Data pengukuran akan muncul setelah sensor simulasi atau input manual menghasilkan pembacaan.</Text>
            <Pressable onPress={() => navigate("measure")} style={({ pressed }) => [styles.emptyHistoryAction, pressed && styles.pressed]}>
              <Text style={styles.emptyHistoryActionText}>Tambah Pengukuran</Text>
            </Pressable>
          </View>
        ) : null}
        renderItem={({ item: reading }) => {
          const waterClass = classifyNtu(reading.ntu);
          return (
            <View style={styles.historyRow}>
              <View style={[styles.historyRail, { backgroundColor: waterClass.color }]} />
              <View style={styles.historyMain}>
                <View style={styles.historyTop}>
                  <Text style={styles.historyTime}>{reading.waktu} WIB</Text>
                  <Text style={styles.historyValue}>{formatNtu(reading.ntu)} <Text style={styles.historyUnit}>NTU</Text></Text>
                </View>
                <View style={styles.historyMeta}>
                  <Text style={[styles.historyStatus, { color: waterClass.color }]}>{waterClass.label} · Kelas {waterClass.grade}</Text>
                  <Text style={styles.historySource}>{reading.sumber === "manual" ? "Manual" : "Sensor simulasi"}</Text>
                </View>
                <Text style={styles.historyEquipment}>{reading.alat}</Text>
              </View>
            </View>
          );
        }}
        ListFooterComponent={
          analyticsMode === "trend" ? (
            <View style={styles.analyticsTrendContent}>
              <View style={styles.rangeControl}>
                {(["24H", "7H", "30H", "Semua"] as Range[]).map((item) => (
                  <Pressable key={item} onPress={() => { haptic.selection(); setRange(item); }} style={({ pressed }) => [styles.rangeButton, range === item && styles.rangeButtonActive, pressed && styles.pressed]} accessibilityRole="button">
                    <Text style={[styles.rangeText, range === item && styles.rangeTextActive]}>{item}</Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.analyticsMetricsGrid}>
                <MetricTile value={analyticsStats ? formatNtu(analyticsStats.current) : "—"} label="Terkini" />
                <MetricTile value={analyticsStats ? formatNtu(analyticsStats.average) : "—"} label="Rata-rata" />
                <MetricTile value={analyticsStats ? formatNtu(analyticsStats.minimum) : "—"} label="Minimum" />
                <MetricTile value={analyticsStats ? formatNtu(analyticsStats.maximum) : "—"} label="Maksimum" />
              </View>

              <View style={styles.surfaceCard}>
                <SectionHeader title="Tren kekeruhan" body={analyticsStats ? `${analyticsStats.count} pengukuran pada rentang ${range}.` : `Belum ada data pada rentang ${range}.`} />
                <JernihLineChart data={filteredHistory} />
              </View>
              <View style={styles.analyticsNote}>
                <MaterialIcons name="verified-user" size={17} color="#2D6A5C" />
                <Text style={styles.analyticsNoteText}>Data simulasi selalu diberi label secara jelas dan tidak mewakili umpan sensor IoT nyata.</Text>
              </View>
            </View>
          ) : null
        }
      />
    );
  };

  const renderSettings = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.introBlock}>
        <Text style={styles.eyebrow}>PENGATURAN</Text>
        <Text style={styles.pageDisplay}>Kelola cara{`\n`}aplikasi bekerja.</Text>
        <Text style={styles.introCopy}>Kontrol simulasi dan data lokal tanpa menyamarkan sifat demonstrasi aplikasi ini.</Text>
      </View>

      <View style={styles.settingsCard}>
        <View style={styles.settingsRow}>
          <View style={styles.settingsIcon}><MaterialIcons name="sensors" size={21} color="#2D6A5C" /></View>
          <View style={styles.settingsCopy}>
            <Text style={styles.settingsTitle}>Mode Simulasi</Text>
            <Text style={styles.settingsBody}>{simulation ? "Aktif · pembacaan baru muncul setiap 4 detik." : "Dijeda · tidak ada pembacaan baru yang dibuat."}</Text>
          </View>
          <Switch
            value={simulation}
            onValueChange={(value) => { haptic.medium(); setSimulation(value); showToast(value ? "Mode simulasi diaktifkan." : "Mode simulasi dijeda.", "neutral"); }}
            trackColor={{ false: "#C9C4B8", true: "#4C8B7A" }}
            thumbColor="#FFFDF8"
            accessibilityLabel="Aktifkan mode simulasi"
          />
        </View>
        <View style={styles.settingsDivider} />
        <View style={styles.settingsRow}>
          <View style={styles.settingsIcon}><MaterialIcons name="storage" size={21} color="#2D6A5C" /></View>
          <View style={styles.settingsCopy}>
            <Text style={styles.settingsTitle}>Data pada perangkat</Text>
            <Text style={styles.settingsBody}>{allReadings.length} catatan tersimpan lokal. Maksimum {MAX_HISTORY} per stasiun.</Text>
          </View>
        </View>
      </View>

      <View style={styles.surfaceCard}>
        <SectionHeader title="Kelas kekeruhan" body="Status mengikuti batas NTU yang konsisten pada seluruh layar." />
        {[
          ["Sangat Jernih", "≤ 5 NTU", "#2D6A5C"],
          ["Jernih", "> 5–25 NTU", "#4C8B7A"],
          ["Keruh", "> 25–50 NTU", "#C4622D"],
          ["Sangat Keruh", "> 50 NTU", "#8B3A1F"],
        ].map(([label, threshold, color]) => (
          <View key={label} style={styles.classificationRow}>
            <View style={[styles.classificationDot, { backgroundColor: color }]} />
            <Text style={styles.classificationLabel}>{label}</Text>
            <Text style={styles.classificationThreshold}>{threshold}</Text>
          </View>
        ))}
      </View>

      <View style={styles.surfaceCard}>
        <SectionHeader title="Tentang Jernih" body="Pemantauan Kejernihan Sungai Brantas · prototipe demonstrasi." />
        <Text style={styles.aboutCopy}>Jernih mendukung alur Monitor → Deteksi → Catat → Analisis. Aplikasi ini tidak menggunakan koneksi sensor nyata, GPS, atau layanan cloud.</Text>
      </View>

      <Pressable onPress={() => setSheet("reset")} style={({ pressed }) => [styles.dangerAction, pressed && styles.pressed]} accessibilityRole="button">
        <MaterialIcons name="delete-outline" size={21} color="#8B3A1F" />
        <View style={styles.flex}>
          <Text style={styles.dangerActionTitle}>Reset semua data</Text>
          <Text style={styles.dangerActionBody}>Hapus riwayat lokal dan kembali ke nilai dasar stasiun.</Text>
        </View>
        <MaterialIcons name="chevron-right" size={22} color="#8B3A1F" />
      </Pressable>
    </ScrollView>
  );

  if (!ready) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-background">
        <View style={styles.loadingScreen}>
          <View style={styles.loadingMark}><MaterialIcons name="water-drop" size={26} color="#FFFDF8" /></View>
          <Text style={styles.loadingTitle}>Menyiapkan Jernih</Text>
          <Text style={styles.loadingBody}>Memuat riwayat pemantauan pada perangkat ini.</Text>
          <ActivityIndicator color="#2D6A5C" style={styles.loadingIndicator} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-background">
      <View style={styles.app}>
        <AppHeader simulation={simulation} onSettings={() => navigate("settings")} />
        <View style={styles.content}>
          {section === "home" && renderHome()}
          {section === "stations" && renderStations()}
          {section === "measure" && renderMeasure()}
          {section === "analytics" && renderAnalytics()}
          {section === "settings" && renderSettings()}
        </View>
        <View style={styles.bottomNav}>
          {NAV_ITEMS.map((item) => {
            const selected = section === item.key;
            const isMeasure = item.key === "measure";
            return (
              <Pressable
                key={item.key}
                onPress={() => navigate(item.key)}
                style={({ pressed }) => [styles.navItem, isMeasure && styles.navItemMeasure, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={item.label}
              >
                <View style={[isMeasure ? styles.navMeasureIcon : styles.navIcon, selected && !isMeasure && styles.navIconSelected]}>
                  <MaterialIcons name={item.icon} size={isMeasure ? 25 : 22} color={isMeasure ? "#FFFDF8" : selected ? "#2D6A5C" : "#78817A"} />
                </View>
                <Text style={[styles.navLabel, selected && styles.navLabelSelected]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <BottomSheet visible={sheet === "station" || sheet === "formStation"} title="Pilih Stasiun" onClose={() => setSheet(null)}>
        <View style={styles.sheetList}>
          {stations.map((station) => {
            const waterClass = classifyNtu(station.ntu);
            const selected = sheet === "formStation" ? station.id === measureStationId : station.id === activeId;
            return (
              <Pressable
                key={station.id}
                onPress={() => {
                  if (sheet === "formStation") {
                    haptic.selection();
                    setMeasureStationId(station.id);
                    setSheet(null);
                  } else {
                    selectStation(station.id);
                  }
                }}
                style={({ pressed }) => [styles.sheetItem, selected && styles.sheetItemSelected, pressed && styles.pressed]}
                accessibilityRole="button"
              >
                <View style={[styles.sheetStationDot, { backgroundColor: waterClass.color }]} />
                <View style={styles.flex}>
                  <Text style={styles.sheetItemTitle}>{station.name}</Text>
                  <Text style={styles.sheetItemBody}>{formatNtu(station.ntu)} NTU · {waterClass.label}</Text>
                </View>
                {selected ? <MaterialIcons name="check" size={20} color="#2D6A5C" /> : null}
              </Pressable>
            );
          })}
        </View>
      </BottomSheet>

      <BottomSheet visible={sheet === "equipment"} title="Pilih Alat" onClose={() => setSheet(null)}>
        <View style={styles.sheetList}>
          {EQUIPMENT.map((equipment) => {
            const selected = equipment === measureEquipment;
            return (
              <Pressable
                key={equipment}
                onPress={() => { haptic.selection(); setMeasureEquipment(equipment); setSheet(null); }}
                style={({ pressed }) => [styles.sheetItem, selected && styles.sheetItemSelected, pressed && styles.pressed]}
                accessibilityRole="button"
              >
                <MaterialIcons name="science" size={21} color="#2D6A5C" />
                <Text style={[styles.sheetItemTitle, styles.flex]}>{equipment}</Text>
                {selected ? <MaterialIcons name="check" size={20} color="#2D6A5C" /> : null}
              </Pressable>
            );
          })}
        </View>
      </BottomSheet>

      <BottomSheet visible={sheet === "reset"} title="Reset semua data?" onClose={() => setSheet(null)}>
        <View style={styles.resetSheetBody}>
          <View style={styles.resetIcon}><MaterialIcons name="warning-amber" size={25} color="#8B3A1F" /></View>
          <Text style={styles.resetCopy}>Semua riwayat pengukuran pada perangkat ini akan dihapus. Tindakan ini tidak dapat dibatalkan.</Text>
          <View style={styles.resetActions}>
            <Pressable onPress={() => setSheet(null)} style={({ pressed }) => [styles.secondarySheetAction, pressed && styles.pressed]} accessibilityRole="button"><Text style={styles.secondarySheetActionText}>Batal</Text></Pressable>
            <Pressable onPress={resetData} style={({ pressed }) => [styles.confirmResetAction, pressed && styles.pressed]} accessibilityRole="button"><Text style={styles.confirmResetActionText}>Reset data</Text></Pressable>
          </View>
        </View>
      </BottomSheet>

      {toast ? <View style={[styles.toast, toast.tone === "warning" && styles.toastWarning, toast.tone === "success" && styles.toastSuccess]} accessibilityLiveRegion="polite"><Text style={styles.toastText}>{toast.text}</Text></View> : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  app: { flex: 1, backgroundColor: "#F5F1E8" },
  content: { flex: 1 },
  appHeader: { height: 62, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#DDD7C8", backgroundColor: "#F5F1E8" },
  brandLine: { flexDirection: "row", alignItems: "center", gap: 9 },
  brandMark: { width: 31, height: 31, borderRadius: 10, backgroundColor: "#17302B", alignItems: "center", justifyContent: "center" },
  brandTitle: { color: "#17302B", fontFamily: Platform.select({ ios: "Georgia", default: "serif" }), fontSize: 19, fontWeight: "700", lineHeight: 20 },
  brandSubtitle: { color: "#78817A", fontFamily: "monospace", fontSize: 9, fontWeight: "700", letterSpacing: 1.1, marginTop: 1 },
  headerMode: { minHeight: 34, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1, borderColor: "#D6DED5", backgroundColor: "#EDF2EC", flexDirection: "row", alignItems: "center", gap: 6 },
  headerModeDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#4C8B7A" },
  headerModeText: { color: "#2D6A5C", fontFamily: "monospace", fontSize: 10, fontWeight: "700" },
  modeDotPaused: { backgroundColor: "#A68D7B" },
  scrollContent: { padding: 20, paddingBottom: 28, gap: 18 },
  listContent: { padding: 20, paddingBottom: 26, gap: 11 },
  analyticsListContent: { padding: 20, paddingBottom: 26, flexGrow: 1 },
  introBlock: { marginBottom: 3 },
  eyebrow: { color: "#4C8B7A", fontFamily: "monospace", fontSize: 10, fontWeight: "700", letterSpacing: 1.3, marginBottom: 8 },
  pageDisplay: { color: "#17302B", fontFamily: Platform.select({ ios: "Georgia", default: "serif" }), fontSize: 30, fontWeight: "700", letterSpacing: -0.5, lineHeight: 34 },
  introCopy: { color: "#68756D", fontSize: 13, lineHeight: 20, marginTop: 10, maxWidth: 390 },
  stationSelectorList: { paddingRight: 20, gap: 10 },
  stationChip: { width: 148, minHeight: 96, padding: 12, borderWidth: 1, borderColor: "#DDD7C8", backgroundColor: "#FFFDF8", borderRadius: 16 },
  stationChipSelected: { borderColor: "#17302B", backgroundColor: "#17302B" },
  stationChipTitleLine: { flexDirection: "row", alignItems: "center", gap: 6 },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  stationChipTitle: { color: "#17302B", fontSize: 13, fontWeight: "700", flex: 1 },
  stationChipTitleSelected: { color: "#FFFDF8" },
  stationChipSub: { color: "#78817A", fontSize: 10, marginTop: 5 },
  stationChipSubSelected: { color: "#B7C8C0" },
  stationChipValue: { color: "#2D6A5C", fontFamily: "monospace", fontSize: 15, fontWeight: "700", marginTop: 12 },
  stationChipValueSelected: { color: "#D7EBE0" },
  statusCard: { backgroundColor: "#17302B", borderRadius: 24, padding: 21, overflow: "hidden", minHeight: 290, shadowColor: "#0F1E1C", shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 5 },
  statusOrbLarge: { position: "absolute", width: 240, height: 240, borderRadius: 120, borderWidth: 1, borderColor: "rgba(255,253,248,0.10)", top: -130, right: -80 },
  statusOrbSmall: { position: "absolute", width: 148, height: 148, borderRadius: 74, borderWidth: 1, borderColor: "rgba(255,253,248,0.10)", top: -88, right: -25 },
  statusTopRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  statusLocation: { flex: 1 },
  statusRiver: { color: "#AFC2B8", fontSize: 11, lineHeight: 16 },
  statusStationName: { color: "#FFFDF8", fontFamily: Platform.select({ ios: "Georgia", default: "serif" }), fontSize: 21, fontWeight: "700", marginTop: 3 },
  modeBadge: { height: 27, paddingHorizontal: 9, borderRadius: 999, backgroundColor: "rgba(143,217,184,0.14)", flexDirection: "row", alignItems: "center", gap: 5 },
  modeBadgePaused: { backgroundColor: "rgba(235,206,185,0.13)" },
  modeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#8FD9B8" },
  modeText: { color: "#B7E0CD", fontFamily: "monospace", fontSize: 9, fontWeight: "700" },
  valueRow: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 18, gap: 16 },
  valueLine: { flexDirection: "row", alignItems: "baseline" },
  ntuValue: { color: "#FFFDF8", fontFamily: Platform.select({ ios: "Georgia", default: "serif" }), fontSize: 59, fontWeight: "700", letterSpacing: -1.8, lineHeight: 65 },
  ntuUnit: { color: "#B7C8C0", fontFamily: "monospace", fontSize: 12, fontWeight: "700", marginLeft: 7 },
  statusPill: { alignSelf: "flex-start", marginTop: 9, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, flexDirection: "row", alignItems: "center", gap: 6 },
  statusPillDot: { width: 6, height: 6, borderRadius: 3 },
  statusPillText: { fontSize: 11, fontWeight: "700" },
  gaugeWrap: { width: 64, height: 142, justifyContent: "center", alignItems: "flex-start", paddingLeft: 1 },
  gaugeTrack: { width: 28, height: 120, borderRadius: 16, backgroundColor: "rgba(255,253,248,0.10)", borderWidth: 1, borderColor: "rgba(255,253,248,0.15)", overflow: "hidden", justifyContent: "flex-end" },
  gaugeFill: { width: "100%", backgroundColor: "#A89968", borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
  gaugeLabel: { position: "absolute", left: 36, top: 10, color: "#8FA79B", fontFamily: "monospace", fontSize: 8 },
  gaugeLabelMid: { top: 65 },
  gaugeLabelLow: { top: 121 },
  statusFooter: { minHeight: 26, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(255,253,248,0.16)", paddingTop: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  footerMetric: { flex: 1, flexDirection: "row", alignItems: "center", gap: 4 },
  statusFooterText: { color: "#AFC2B8", fontSize: 10, flexShrink: 1 },
  metricGrid: { flexDirection: "row", gap: 9 },
  metricTile: { flex: 1, minHeight: 83, padding: 12, borderRadius: 16, backgroundColor: "#FFFDF8", borderWidth: 1, borderColor: "#E1DCCD", justifyContent: "space-between" },
  metricTileHighlight: { backgroundColor: "#E4EFEA", borderColor: "#CAE0D5" },
  metricValue: { color: "#17302B", fontFamily: "monospace", fontSize: 18, fontWeight: "700" },
  metricValueHighlight: { color: "#2D6A5C" },
  metricLabel: { color: "#68756D", fontSize: 10, lineHeight: 14, marginTop: 8 },
  metricLabelHighlight: { color: "#477261" },
  surfaceCard: { backgroundColor: "#FFFDF8", borderWidth: 1, borderColor: "#E1DCCD", borderRadius: 20, padding: 16 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", gap: 12, marginBottom: 15 },
  sectionHeaderCopy: { flex: 1 },
  sectionTitle: { color: "#17302B", fontSize: 15, fontWeight: "700", lineHeight: 20 },
  sectionBody: { color: "#78817A", fontSize: 11, lineHeight: 16, marginTop: 3 },
  primaryAction: { minHeight: 52, borderRadius: 14, backgroundColor: "#2D6A5C", paddingHorizontal: 15, alignItems: "center", flexDirection: "row", gap: 9 },
  primaryActionText: { color: "#FFFDF8", fontSize: 14, fontWeight: "700" },
  actionArrow: { marginLeft: "auto" },
  stationListCard: { position: "relative", minHeight: 118, padding: 16, paddingLeft: 21, borderRadius: 18, backgroundColor: "#FFFDF8", borderWidth: 1, borderColor: "#E1DCCD", flexDirection: "row", alignItems: "center", gap: 8, overflow: "hidden" },
  stationListCardSelected: { borderColor: "#78A994", borderWidth: 1.4 },
  stationColorBar: { position: "absolute", width: 5, top: 0, bottom: 0, left: 0 },
  stationListMain: { flex: 1 },
  stationListTop: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  stationListCopy: { flex: 1 },
  stationListName: { color: "#17302B", fontSize: 15, fontWeight: "700" },
  stationListSub: { color: "#78817A", fontSize: 11, marginTop: 3 },
  stationListValue: { color: "#17302B", fontFamily: "monospace", fontSize: 20, fontWeight: "700", textAlign: "right" },
  stationListUnit: { color: "#78817A", fontFamily: "monospace", fontSize: 9, textAlign: "right", marginTop: 2 },
  stationListFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 15 },
  smallStatus: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
  smallStatusText: { fontSize: 10, fontWeight: "700" },
  latestText: { color: "#78817A", fontFamily: "monospace", fontSize: 10 },
  legendCard: { padding: 16, marginTop: 6, borderRadius: 16, backgroundColor: "#EAE4D4" },
  legendTitle: { color: "#17302B", fontSize: 13, fontWeight: "700" },
  legendCopy: { color: "#68756D", fontSize: 11, lineHeight: 17, marginTop: 5 },
  measurementCard: { borderRadius: 22, backgroundColor: "#17302B", padding: 19, shadowColor: "#0F1E1C", shadowOpacity: 0.15, shadowRadius: 15, shadowOffset: { width: 0, height: 7 }, elevation: 4 },
  formLabel: { color: "#AFC2B8", fontFamily: "monospace", fontSize: 10, fontWeight: "700", letterSpacing: 0.8, marginTop: 16, marginBottom: 7 },
  selectControl: { minHeight: 59, paddingHorizontal: 14, borderWidth: 1, borderColor: "rgba(255,253,248,0.18)", borderRadius: 13, backgroundColor: "rgba(255,253,248,0.08)", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 9 },
  selectValue: { color: "#FFFDF8", fontSize: 14, fontWeight: "600", flexShrink: 1 },
  selectHint: { color: "#ABC0B5", fontSize: 11, marginTop: 3 },
  ntuInputWrap: { minHeight: 70, borderWidth: 1, borderColor: "rgba(255,253,248,0.18)", borderRadius: 14, backgroundColor: "rgba(255,253,248,0.08)", paddingHorizontal: 14, flexDirection: "row", alignItems: "center" },
  ntuInputInvalid: { borderColor: "#E6A684", backgroundColor: "rgba(196,98,45,0.16)" },
  ntuInput: { flex: 1, color: "#FFFDF8", fontFamily: Platform.select({ ios: "Georgia", default: "serif" }), fontSize: 32, fontWeight: "700", paddingVertical: 12 },
  inputUnit: { color: "#B7C8C0", fontFamily: "monospace", fontSize: 12, fontWeight: "700" },
  inputSupport: { color: "#AFC2B8", fontSize: 10.5, lineHeight: 16, marginTop: 7 },
  inputSupportInvalid: { color: "#F0C4AF" },
  saveButton: { minHeight: 52, marginTop: 22, borderRadius: 13, backgroundColor: "#A9CBBE", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  saveButtonText: { color: "#17302B", fontSize: 14, fontWeight: "800" },
  formFootnote: { marginTop: 14, flexDirection: "row", gap: 7, paddingRight: 4 },
  formFootnoteText: { flex: 1, color: "#AFC2B8", fontSize: 10.5, lineHeight: 15 },
  activeStationControl: { minHeight: 66, backgroundColor: "#FFFDF8", borderWidth: 1, borderColor: "#E1DCCD", borderRadius: 16, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 15 },
  activeStationDot: { width: 10, height: 10, borderRadius: 5 },
  activeStationLabel: { color: "#78817A", fontFamily: "monospace", fontSize: 9, fontWeight: "700", letterSpacing: 0.8 },
  activeStationName: { color: "#17302B", fontSize: 13, fontWeight: "700", marginTop: 3 },
  segmentedControl: { flexDirection: "row", borderRadius: 13, padding: 3, backgroundColor: "#EAE4D4", marginBottom: 16 },
  segment: { flex: 1, minHeight: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  segmentActive: { backgroundColor: "#FFFDF8", shadowColor: "#0F1E1C", shadowOpacity: 0.08, shadowRadius: 4, elevation: 1 },
  segmentText: { color: "#78817A", fontSize: 12, fontWeight: "700" },
  segmentTextActive: { color: "#17302B" },
  analyticsTrendContent: { gap: 16 },
  rangeControl: { flexDirection: "row", gap: 7 },
  rangeButton: { flex: 1, minHeight: 34, alignItems: "center", justifyContent: "center", borderRadius: 10, borderWidth: 1, borderColor: "#DED8C8", backgroundColor: "#FFFDF8" },
  rangeButtonActive: { backgroundColor: "#2D6A5C", borderColor: "#2D6A5C" },
  rangeText: { color: "#68756D", fontFamily: "monospace", fontSize: 11, fontWeight: "700" },
  rangeTextActive: { color: "#FFFDF8" },
  analyticsMetricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  emptyHistory: { alignItems: "center", paddingVertical: 46, paddingHorizontal: 28, borderRadius: 18, backgroundColor: "#FFFDF8", borderWidth: 1, borderColor: "#E1DCCD" },
  emptyHistoryTitle: { color: "#17302B", fontSize: 15, fontWeight: "700", marginTop: 12 },
  emptyHistoryBody: { color: "#68756D", fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: 6 },
  emptyHistoryAction: { marginTop: 16, minHeight: 40, paddingHorizontal: 14, borderRadius: 11, backgroundColor: "#E4EFEA", alignItems: "center", justifyContent: "center" },
  emptyHistoryActionText: { color: "#2D6A5C", fontSize: 12, fontWeight: "700" },
  historyRow: { minHeight: 108, marginBottom: 10, padding: 14, paddingLeft: 19, borderRadius: 16, backgroundColor: "#FFFDF8", borderWidth: 1, borderColor: "#E1DCCD", overflow: "hidden", position: "relative" },
  historyRail: { position: "absolute", left: 0, top: 0, bottom: 0, width: 4 },
  historyMain: { flex: 1 },
  historyTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  historyTime: { color: "#78817A", fontFamily: "monospace", fontSize: 11 },
  historyValue: { color: "#17302B", fontFamily: "monospace", fontSize: 18, fontWeight: "700" },
  historyUnit: { color: "#78817A", fontSize: 9 },
  historyMeta: { flexDirection: "row", gap: 10, flexWrap: "wrap", marginTop: 10 },
  historyStatus: { fontSize: 11, fontWeight: "700" },
  historySource: { color: "#78817A", fontSize: 11 },
  historyEquipment: { color: "#78817A", fontSize: 10.5, marginTop: 6 },
  analyticsNote: { flexDirection: "row", gap: 8, padding: 13, borderRadius: 14, backgroundColor: "#E4EFEA" },
  analyticsNoteText: { flex: 1, color: "#477261", fontSize: 10.5, lineHeight: 16 },
  settingsCard: { borderRadius: 20, overflow: "hidden", backgroundColor: "#FFFDF8", borderWidth: 1, borderColor: "#E1DCCD" },
  settingsRow: { minHeight: 94, padding: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  settingsIcon: { width: 37, height: 37, borderRadius: 12, backgroundColor: "#E4EFEA", alignItems: "center", justifyContent: "center" },
  settingsCopy: { flex: 1 },
  settingsTitle: { color: "#17302B", fontSize: 14, fontWeight: "700" },
  settingsBody: { color: "#68756D", fontSize: 11, lineHeight: 16, marginTop: 4 },
  settingsDivider: { height: StyleSheet.hairlineWidth, backgroundColor: "#E7E0D3", marginLeft: 65 },
  classificationRow: { minHeight: 35, flexDirection: "row", alignItems: "center", gap: 9 },
  classificationDot: { width: 9, height: 9, borderRadius: 4.5 },
  classificationLabel: { color: "#17302B", fontSize: 12, fontWeight: "600", flex: 1 },
  classificationThreshold: { color: "#78817A", fontFamily: "monospace", fontSize: 10.5 },
  aboutCopy: { color: "#68756D", fontSize: 12, lineHeight: 19 },
  dangerAction: { minHeight: 82, borderRadius: 17, padding: 14, borderWidth: 1, borderColor: "#E8C8BA", backgroundColor: "#FFF8F4", flexDirection: "row", alignItems: "center", gap: 11 },
  dangerActionTitle: { color: "#8B3A1F", fontSize: 14, fontWeight: "700" },
  dangerActionBody: { color: "#9B6650", fontSize: 10.5, lineHeight: 15, marginTop: 3 },
  bottomNav: { minHeight: 73, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#DDD7C8", backgroundColor: "#FFFDF8", flexDirection: "row", alignItems: "center", justifyContent: "space-around", paddingHorizontal: 5 },
  navItem: { flex: 1, minHeight: 65, alignItems: "center", justifyContent: "center", gap: 2 },
  navItemMeasure: { marginTop: -16 },
  navIcon: { height: 28, alignItems: "center", justifyContent: "center" },
  navIconSelected: { backgroundColor: "#E4EFEA", width: 38, borderRadius: 13 },
  navMeasureIcon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: "#2D6A5C", borderWidth: 4, borderColor: "#F5F1E8", shadowColor: "#0F1E1C", shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 },
  navLabel: { color: "#78817A", fontSize: 9.5, fontWeight: "600" },
  navLabelSelected: { color: "#2D6A5C", fontWeight: "800" },
  sheetOverlay: { flex: 1, backgroundColor: "rgba(15,30,28,0.38)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#FFFDF8", borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 9, paddingBottom: 30 },
  sheetHandle: { width: 38, height: 4, borderRadius: 2, alignSelf: "center", backgroundColor: "#C9C4B8", marginBottom: 13 },
  sheetHeader: { minHeight: 36, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  sheetTitle: { color: "#17302B", fontFamily: Platform.select({ ios: "Georgia", default: "serif" }), fontSize: 21, fontWeight: "700" },
  sheetClose: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "#F0ECE3" },
  sheetList: { gap: 6 },
  sheetItem: { minHeight: 61, borderRadius: 14, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", gap: 11 },
  sheetItemSelected: { backgroundColor: "#E4EFEA" },
  sheetStationDot: { width: 10, height: 10, borderRadius: 5 },
  sheetItemTitle: { color: "#17302B", fontSize: 13, fontWeight: "700" },
  sheetItemBody: { color: "#68756D", fontSize: 11, marginTop: 3 },
  resetSheetBody: { alignItems: "center", paddingTop: 4 },
  resetIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: "#F6E2D6", alignItems: "center", justifyContent: "center" },
  resetCopy: { color: "#68756D", fontSize: 13, lineHeight: 20, textAlign: "center", marginTop: 13, paddingHorizontal: 8 },
  resetActions: { flexDirection: "row", gap: 10, marginTop: 22, width: "100%" },
  secondarySheetAction: { flex: 1, minHeight: 49, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "#F0ECE3" },
  secondarySheetActionText: { color: "#17302B", fontSize: 13, fontWeight: "700" },
  confirmResetAction: { flex: 1, minHeight: 49, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "#8B3A1F" },
  confirmResetActionText: { color: "#FFFDF8", fontSize: 13, fontWeight: "700" },
  toast: { position: "absolute", bottom: 87, left: 20, right: 20, minHeight: 45, borderRadius: 14, paddingHorizontal: 15, alignItems: "center", justifyContent: "center", backgroundColor: "#17302B", shadowColor: "#0F1E1C", shadowOpacity: 0.22, shadowRadius: 12, elevation: 7 },
  toastWarning: { backgroundColor: "#8B3A1F" },
  toastSuccess: { backgroundColor: "#2D6A5C" },
  toastText: { color: "#FFFDF8", fontSize: 12, fontWeight: "600", textAlign: "center" },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  loadingScreen: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 36, backgroundColor: "#F5F1E8" },
  loadingMark: { width: 56, height: 56, borderRadius: 18, backgroundColor: "#17302B", alignItems: "center", justifyContent: "center" },
  loadingTitle: { color: "#17302B", fontFamily: Platform.select({ ios: "Georgia", default: "serif" }), fontSize: 23, fontWeight: "700", marginTop: 17 },
  loadingBody: { color: "#68756D", fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: 6 },
  loadingIndicator: { marginTop: 18 },
});
