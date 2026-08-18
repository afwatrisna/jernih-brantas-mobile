import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View, type ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";

type Station = {
  id: string;
  name: string;
  place: string;
  baseline: number;
  ntu: number;
  x: ViewStyle["left"];
  y: ViewStyle["top"];
};

type Workspace = "monitor" | "field" | "insights" | "settings";
type ReadingSource = "simulation" | "manual";

const INITIAL_STATIONS: Station[] = [
  { id: "malang", name: "Malang Hulu", place: "Bendungan Sengguruh", baseline: 9, ntu: 9.2, x: "15%", y: "21%" },
  { id: "kediri", name: "Kediri", place: "Jembatan Mrican", baseline: 16, ntu: 16.8, x: "30%", y: "42%" },
  { id: "jombang", name: "Jombang", place: "Ploso", baseline: 21, ntu: 21.4, x: "48%", y: "51%" },
  { id: "mojokerto", name: "Mojokerto", place: "Bendung Lengkong", baseline: 27, ntu: 27.0, x: "61%", y: "64%" },
  { id: "surabaya", name: "Surabaya Hilir", place: "Karangpilang", baseline: 34, ntu: 34.2, x: "82%", y: "80%" },
];

function waterClass(ntu: number) {
  if (ntu <= 5) return { label: "Sangat jernih", grade: "I", color: "#2D6A5C", soft: "#DCEBE5" };
  if (ntu <= 25) return { label: "Jernih", grade: "II", color: "#4C8B7A", soft: "#E4F0EA" };
  if (ntu <= 50) return { label: "Keruh", grade: "III", color: "#C4622D", soft: "#F6E2D6" };
  return { label: "Sangat keruh", grade: "IV", color: "#8B3A1F", soft: "#F0D9D0" };
}

function TrustStrip({ compact = false, source, updatedAt }: { compact?: boolean; source: ReadingSource; updatedAt: string }) {
  const isManual = source === "manual";
  return (
    <View style={[styles.trustStrip, compact && styles.trustStripCompact]}>
      <View style={styles.trustHeading}>
        <View style={styles.trustLabelWrap}>
          <MaterialIcons name="verified-user" size={15} color="#2D6A5C" />
          <Text style={styles.trustKicker}>DATA TRUST</Text>
        </View>
        <View style={[styles.simulationBadge, isManual && styles.manualBadge]}><View style={[styles.simulationDot, isManual && styles.manualBadgeDot]} /><Text style={[styles.simulationText, isManual && styles.manualBadgeText]}>{isManual ? "INPUT MANUAL" : "SIMULASI"}</Text></View>
      </View>
      <View style={styles.trustMetrics}>
        <TrustItem label="PEMBARUAN" value={updatedAt} />
        <TrustItem label="SUMBER" value={isManual ? "Turbidimeter T-100" : "NTU-Logger demo"} />
        <TrustItem label="VALIDASI" value="Perlu verifikasi" warning />
        {!compact && <TrustItem label="PENYIMPANAN" value="Lokal di browser" />}
      </View>
      <Text style={styles.trustNotice}>{isManual ? "Pembacaan manual perlu diverifikasi terhadap prosedur kalibrasi sebelum digunakan sebagai data resmi." : "Nilai simulasi berguna untuk demo alur kerja; bukan data lingkungan resmi."}</Text>
    </View>
  );
}

function TrustItem({ label, value, warning = false }: { label: string; value: string; warning?: boolean }) {
  return <View style={styles.trustMetric}><Text style={styles.trustMetricLabel}>{label}</Text><Text style={[styles.trustMetricValue, warning && styles.trustMetricWarning]} numberOfLines={1}>{value}</Text></View>;
}

function SectionButton({ active, icon, label, onPress, compact = false }: { active: boolean; icon: React.ComponentProps<typeof MaterialIcons>["name"]; label: string; onPress: () => void; compact?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.sectionButton, compact && styles.sectionButtonCompact, active && styles.sectionButtonActive, pressed && styles.pressed]} accessibilityRole="button" accessibilityState={{ selected: active }}>
      <MaterialIcons name={icon} size={18} color={active ? "#FFFDF8" : "#688078"} />
      <Text style={[styles.sectionButtonText, active && styles.sectionButtonTextActive]}>{label}</Text>
    </Pressable>
  );
}

export default function JernihWeb() {
  const { width } = useWindowDimensions();
  const desktop = width >= 960;
  const [workspace, setWorkspace] = useState<Workspace>("monitor");
  const [stations, setStations] = useState<Station[]>(() => INITIAL_STATIONS.map((station) => ({ ...station })));
  const [activeId, setActiveId] = useState("malang");
  const [simulation, setSimulation] = useState(true);
  const [source, setSource] = useState<ReadingSource>("simulation");
  const [simulationCycle, setSimulationCycle] = useState(0);
  const [recordCount, setRecordCount] = useState(40);
  const [updatedAt, setUpdatedAt] = useState("Menunggu simulasi");
  const [fieldNtu, setFieldNtu] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [saved, setSaved] = useState(false);

  const activeStation = stations.find((station) => station.id === activeId) ?? stations[0];
  const activeClass = waterClass(activeStation.ntu);
  const fieldValue = Number.parseFloat(fieldNtu.replace(",", "."));
  const fieldValid = Number.isFinite(fieldValue) && fieldValue >= 0 && fieldValue <= 500;
  const fieldClass = fieldValid ? waterClass(fieldValue) : null;
  const riverAverage = useMemo(() => stations.reduce((sum, station) => sum + station.ntu, 0) / stations.length, [stations]);
  const compliantStations = useMemo(() => stations.filter((station) => station.ntu <= 25).length, [stations]);

  useEffect(() => {
    if (!simulation) return;
    const runSimulation = () => {
      setStations((current) => current.map((station, index) => {
        const pulse = Math.sin(Date.now() / 2400 + index * 1.7) * 0.75;
        const correction = (station.baseline - station.ntu) * 0.08;
        return { ...station, ntu: Math.max(1.2, Math.round((station.ntu + pulse + correction) * 10) / 10) };
      }));
      setSimulationCycle((cycle) => cycle + 1);
      setRecordCount((count) => count + stations.length);
      setSource("simulation");
      setUpdatedAt(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    const firstCycle = setTimeout(runSimulation, 900);
    const interval = setInterval(runSimulation, 4000);
    return () => { clearTimeout(firstCycle); clearInterval(interval); };
  }, [simulation, stations.length]);

  const openField = () => {
    setWorkspace("field");
    setReviewing(false);
    setSaved(false);
  };

  const selectStation = (stationId: string) => {
    setActiveId(stationId);
    setReviewing(false);
  };

  const saveManualReading = () => {
    if (!fieldValid) return;
    setStations((current) => current.map((station) => station.id === activeId ? { ...station, ntu: Math.round(fieldValue * 10) / 10 } : station));
    setSource("manual");
    setUpdatedAt(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    setRecordCount((count) => count + 1);
    setSaved(true);
  };

  const resetDemo = () => {
    setStations(INITIAL_STATIONS.map((station) => ({ ...station })));
    setActiveId("malang");
    setFieldNtu("");
    setReviewing(false);
    setSaved(false);
    setSource("simulation");
    setSimulationCycle(0);
    setRecordCount(40);
    setUpdatedAt("Demo direset");
  };

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.shell, desktop && styles.shellDesktop]}>
          <View style={styles.topbar}>
            <View style={styles.brandLockup}>
              <View style={styles.brandMark}><MaterialIcons name="water-drop" size={19} color="#FFFDF8" /></View>
              <View><Text style={styles.brandName}>Jernih</Text><Text style={styles.brandSub}>BRANTAS · WEB</Text></View>
            </View>
            {desktop ? <View style={styles.topNav}>
              <Pressable onPress={() => setWorkspace("monitor")} style={({ pressed }) => [styles.topNavLink, workspace === "monitor" && styles.topNavLinkActive, pressed && styles.pressed]}><Text style={[styles.topNavText, workspace === "monitor" && styles.topNavTextActive]}>Monitor</Text></Pressable>
              <Pressable onPress={openField} style={({ pressed }) => [styles.topNavLink, workspace === "field" && styles.topNavLinkActive, pressed && styles.pressed]}><Text style={[styles.topNavText, workspace === "field" && styles.topNavTextActive]}>Field Mode</Text></Pressable>
              <Pressable onPress={() => setWorkspace("insights")} style={({ pressed }) => [styles.topNavLink, workspace === "insights" && styles.topNavLinkActive, pressed && styles.pressed]}><Text style={[styles.topNavText, workspace === "insights" && styles.topNavTextActive]}>Analitik</Text></Pressable>
              <Pressable onPress={() => setWorkspace("settings")} style={({ pressed }) => [styles.topNavLink, workspace === "settings" && styles.topNavLinkActive, pressed && styles.pressed]}><Text style={[styles.topNavText, workspace === "settings" && styles.topNavTextActive]}>Atur</Text></Pressable>
            </View> : null}
            <View style={styles.webBadge}><View style={styles.webBadgeDot} /><Text style={styles.webBadgeText}>DEMO WEB</Text></View>
          </View>

          <View style={[styles.webLayout, desktop && styles.webLayoutDesktop]}>
            {desktop ? <aside style={styles.sidebar}>
              <Text style={styles.sidebarKicker}>RUANG KERJA</Text>
              <SectionButton active={workspace === "monitor"} icon="dashboard" label="Monitor" onPress={() => setWorkspace("monitor")} />
              <SectionButton active={workspace === "field"} icon="edit-note" label="Field Mode" onPress={openField} />
              <SectionButton active={workspace === "insights"} icon="insights" label="Analitik" onPress={() => setWorkspace("insights")} />
              <SectionButton active={workspace === "settings"} icon="settings" label="Pengaturan" onPress={() => setWorkspace("settings")} />
              <View style={styles.sidebarDivider} />
              <Text style={styles.sidebarKicker}>TITIK PANTAU</Text>
              {stations.map((station) => {
                const selected = station.id === activeId;
                const kind = waterClass(station.ntu);
                return <Pressable key={station.id} onPress={() => selectStation(station.id)} style={({ pressed }) => [styles.sidebarStation, selected && styles.sidebarStationActive, pressed && styles.pressed]}>
                  <View style={[styles.stationDot, { backgroundColor: kind.color }]} /><View style={styles.flex}><Text style={[styles.sidebarStationName, selected && styles.sidebarStationNameActive]}>{station.name}</Text><Text style={[styles.sidebarStationPlace, selected && styles.sidebarStationPlaceActive]}>{station.place}</Text></View><Text style={[styles.sidebarStationValue, selected && styles.sidebarStationValueActive]}>{station.ntu.toFixed(1)}</Text>
                </Pressable>;
              })}
              <View style={styles.sidebarFootnote}><MaterialIcons name="cloud-off" size={15} color="#477261" /><Text style={styles.sidebarFootnoteText}>Local-first demo. Tidak ada data dikirim ke server.</Text></View>
            </aside> : null}

            <main style={styles.main}>
              {!desktop ? <View style={styles.mobileWorkspaceNav}>
                <SectionButton compact active={workspace === "monitor"} icon="dashboard" label="Monitor" onPress={() => setWorkspace("monitor")} />
                <SectionButton compact active={workspace === "field"} icon="edit-note" label="Field" onPress={openField} />
                <SectionButton compact active={workspace === "insights"} icon="insights" label="Analitik" onPress={() => setWorkspace("insights")} />
                <SectionButton compact active={workspace === "settings"} icon="settings" label="Atur" onPress={() => setWorkspace("settings")} />
              </View> : null}

              {workspace === "monitor" && <>
                <View style={[styles.intro, desktop && styles.introDesktop]}>
                  <View style={styles.eyebrowPill}><MaterialIcons name="visibility" size={14} color="#2D6A5C" /><Text style={styles.eyebrowText}>MONITOR MODE</Text></View>
                  <Text style={styles.heroTitle}>Kondisi sungai,{"\n"}lebih mudah dipahami.</Text>
                  <Text style={styles.heroCopy}>Pantau kejelasan air di titik-titik penting Sungai Brantas, lalu pindah ke Field Mode saat petugas perlu mencatat hasil lapangan.</Text>
                </View>

                {!desktop ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mobileStations}>
                  {stations.map((station) => <Pressable key={station.id} onPress={() => selectStation(station.id)} style={({ pressed }) => [styles.mobileStationCard, station.id === activeId && styles.mobileStationCardActive, pressed && styles.pressed]}><Text style={[styles.mobileStationName, station.id === activeId && styles.mobileStationNameActive]}>{station.name}</Text><Text style={[styles.mobileStationValue, station.id === activeId && styles.mobileStationValueActive]}>{station.ntu.toFixed(1)} NTU</Text></Pressable>)}
                </ScrollView> : null}

                <View style={[styles.statusCard, desktop && styles.statusCardDesktop]}>
                  <View style={styles.statusOrbOne} /><View style={styles.statusOrbTwo} />
                  <View style={styles.statusHeader}><View><Text style={styles.statusLocation}>SUNGAI BRANTAS · {activeStation.place.toUpperCase()}</Text><Text style={styles.statusStation}>{activeStation.name}</Text></View><View style={[styles.statusLive, !simulation && styles.statusLivePaused]}><View style={[styles.statusLiveDot, !simulation && styles.statusLiveDotPaused]} /><Text style={styles.statusLiveText}>{simulation ? "SIMULASI AKTIF" : "SIMULASI DIJEDA"}</Text></View></View>
                  <View style={[styles.statusContent, desktop && styles.statusContentDesktop]}>
                    <View><View style={styles.ntuLine}><Text style={styles.ntuNumber}>{activeStation.ntu.toFixed(1)}</Text><Text style={styles.ntuLabel}>NTU</Text></View><View style={[styles.classificationPill, { backgroundColor: activeClass.soft }]}><View style={[styles.classificationDot, { backgroundColor: activeClass.color }]} /><Text style={[styles.classificationText, { color: activeClass.color }]}>{activeClass.label} · Kelas {activeClass.grade}</Text></View></View>
                    <View style={styles.gaugeWrap}><View style={styles.gaugeTrack}><View style={[styles.gaugeFill, { height: `${Math.max(8, activeStation.ntu)}%` }]} /></View><Text style={styles.gaugeText}>100</Text><Text style={[styles.gaugeText, styles.gaugeMid]}>50</Text><Text style={[styles.gaugeText, styles.gaugeBottom]}>0</Text></View>
                  </View>
                  <View style={styles.statusFooter}><Text style={styles.statusFooterText}>{simulation ? `Siklus ${simulationCycle} · ${updatedAt}` : `Terakhir diperbarui · ${updatedAt}`}</Text><Text style={styles.statusFooterText}>Buka Field Mode untuk merekam</Text></View>
                </View>

                <TrustStrip compact={!desktop} source={source} updatedAt={updatedAt} />

                <View style={[styles.metricRow, desktop && styles.metricRowDesktop]}>
                  <Metric value={riverAverage.toFixed(1)} label="Rata-rata sungai" icon="water" />
                  <Metric value={`${compliantStations} / ${stations.length}`} label="Sesuai Kelas II" icon="verified" accent />
                  <Metric value={`${recordCount}`} label="Catatan lokal" icon="storage" />
                </View>

                <View style={[styles.monitorGrid, desktop && styles.monitorGridDesktop]}>
                  <View style={styles.surfaceCard}><View style={styles.cardHead}><View><Text style={styles.cardTitle}>Aliran & titik pantau</Text><Text style={styles.cardCopy}>Pilih titik untuk memperbarui ringkasan. Simulasi berjalan tiap 4 detik.</Text></View><MaterialIcons name="map" size={19} color="#477261" /></View><View style={styles.riverMap}><Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={StyleSheet.absoluteFill} pointerEvents="none"><Path d="M 15 21 C 21 29, 26 35, 30 42 C 37 46, 43 49, 48 51 C 54 56, 57 60, 61 64 C 68 70, 76 75, 82 80" stroke="#9FC5B6" strokeWidth={2.8} fill="none" /><Path d="M 15 21 C 21 29, 26 35, 30 42 C 37 46, 43 49, 48 51 C 54 56, 57 60, 61 64 C 68 70, 76 75, 82 80" stroke="#DCEBE5" strokeWidth={0.75} fill="none" /></Svg>{stations.map((station) => { const kind = waterClass(station.ntu); const selected = station.id === activeId; return <Pressable key={station.id} onPress={() => selectStation(station.id)} style={({ pressed }) => [styles.mapPoint, { left: station.x, top: station.y, backgroundColor: kind.color }, selected && styles.mapPointSelected, pressed && styles.pressed]} accessibilityLabel={`Pilih ${station.name}`} />; })}<View style={styles.mapCaption}><Text style={styles.mapCaptionTitle}>{activeStation.name}</Text><Text style={styles.mapCaptionValue}>{activeStation.ntu.toFixed(1)} NTU · {activeClass.label}</Text></View></View></View>
                  <View style={styles.fieldCallout}><View style={styles.fieldCalloutIcon}><MaterialIcons name="edit-note" size={22} color="#17302B" /></View><Text style={styles.fieldCalloutKicker}>PENGUKURAN LAPANGAN</Text><Text style={styles.fieldCalloutTitle}>Siap mencatat hasil turbidimeter?</Text><Text style={styles.fieldCalloutCopy}>Field Mode memisahkan alur pencatatan dari dashboard agar titik, nilai, dan status verifikasi lebih jelas.</Text><Pressable onPress={openField} style={({ pressed }) => [styles.fieldCalloutButton, pressed && styles.pressed]}><Text style={styles.fieldCalloutButtonText}>Buka Field Mode</Text><MaterialIcons name="arrow-forward" size={18} color="#17302B" /></Pressable></View>
                </View>
              </>}

              {workspace === "field" && <>
                <View style={styles.intro}><View style={styles.eyebrowPill}><MaterialIcons name="edit-note" size={14} color="#2D6A5C" /><Text style={styles.eyebrowText}>FIELD MODE</Text></View><Text style={styles.heroTitle}>Catat hasil{`\n`}lapangan dengan tenang.</Text><Text style={styles.heroCopy}>Pilih titik, masukkan pembacaan, lalu tinjau ringkasannya sebelum menyimpan catatan lokal.</Text></View>
                <View style={[styles.fieldLayout, desktop && styles.fieldLayoutDesktop]}>
                  <View style={styles.fieldSide}><View style={styles.fieldSteps}><FieldStep number="1" label="Pilih titik" active /><FieldStep number="2" label="Masukkan NTU" active={fieldNtu.length > 0} /><FieldStep number="3" label="Tinjau & simpan" active={reviewing || saved} /></View><TrustStrip compact source={source} updatedAt={updatedAt} /></View>
                  <View style={styles.fieldCard}>
                    {!reviewing && !saved ? <>
                      <Text style={styles.fieldCardKicker}>PENGUKURAN BARU</Text><Text style={styles.fieldCardTitle}>Masukkan nilai yang terbaca.</Text>
                      <Text style={styles.formLabel}>TITIK PANTAU</Text><View style={styles.stationPickGrid}>{stations.map((station) => <Pressable key={station.id} onPress={() => selectStation(station.id)} style={({ pressed }) => [styles.stationPick, station.id === activeId && styles.stationPickActive, pressed && styles.pressed]}><View style={[styles.stationDot, { backgroundColor: waterClass(station.ntu).color }]} /><Text style={[styles.stationPickText, station.id === activeId && styles.stationPickTextActive]}>{station.name}</Text></Pressable>)}</View>
                      <Text style={styles.formLabel}>NILAI KEKERUHAN</Text><View style={[styles.ntuInput, fieldNtu.length > 0 && !fieldValid && styles.ntuInputInvalid]}><TextInput value={fieldNtu} onChangeText={(value) => { setFieldNtu(value); setReviewing(false); }} placeholder="18.4" placeholderTextColor="#9BAEA4" keyboardType="decimal-pad" style={styles.ntuTextInput} accessibilityLabel="Nilai kekeruhan dalam NTU" /><Text style={styles.inputUnit}>NTU</Text></View><Text style={[styles.inputHelp, fieldNtu.length > 0 && !fieldValid && styles.inputHelpWarning]}>{fieldNtu.length > 0 && !fieldValid ? "Masukkan angka antara 0 dan 500 NTU." : "Rentang yang dapat dicatat: 0–500 NTU."}</Text>
                      {fieldClass ? <View style={[styles.fieldPreview, { backgroundColor: fieldClass.soft }]}><View style={[styles.classificationDot, { backgroundColor: fieldClass.color }]} /><View style={styles.flex}><Text style={[styles.fieldPreviewTitle, { color: fieldClass.color }]}>{fieldValue.toFixed(1)} NTU · {fieldClass.label}</Text><Text style={[styles.fieldPreviewCopy, { color: fieldClass.color }]}>Kelas {fieldClass.grade} · tinjau sebelum simpan</Text></View></View> : null}
                      <Text style={styles.formLabel}>ALAT</Text><View style={styles.deviceRow}><MaterialIcons name="science" size={20} color="#2D6A5C" /><View style={styles.flex}><Text style={styles.deviceTitle}>Turbidimeter T-100</Text><Text style={styles.deviceCopy}>Alat demo yang dipilih</Text></View><MaterialIcons name="expand-more" size={20} color="#78817A" /></View>
                      <Pressable onPress={() => { if (fieldValid) setReviewing(true); }} style={({ pressed }) => [styles.reviewButton, !fieldValid && styles.reviewButtonDisabled, pressed && fieldValid && styles.pressed]}><Text style={styles.reviewButtonText}>Tinjau pengukuran</Text><MaterialIcons name="arrow-forward" size={18} color="#FFFDF8" /></Pressable>
                    </> : saved ? <View style={styles.savedState}><View style={styles.savedIcon}><MaterialIcons name="check" size={28} color="#FFFDF8" /></View><Text style={styles.savedTitle}>Catatan tersimpan lokal.</Text><Text style={styles.savedCopy}>{fieldValue.toFixed(1)} NTU untuk {activeStation.name} telah memperbarui status, peta, dan analitik web.</Text><Pressable onPress={() => { setFieldNtu(""); setSaved(false); setReviewing(false); }} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}><Text style={styles.secondaryButtonText}>Tambah catatan lain</Text></Pressable></View> : <View><View style={styles.reviewIcon}><MaterialIcons name="fact-check" size={25} color="#2D6A5C" /></View><Text style={styles.fieldCardKicker}>TINJAU SEBELUM SIMPAN</Text><Text style={styles.fieldCardTitle}>Pastikan catatan ini benar.</Text><Text style={styles.reviewCopy}>Cocokkan nilai dengan alat sebelum menyimpannya sebagai input manual.</Text><View style={styles.reviewSummary}><SummaryRow label="STASIUN" value={activeStation.name} /><SummaryRow label="ALAT" value="Turbidimeter T-100" /><SummaryRow label="NILAI" value={`${fieldValue.toFixed(1)} NTU`} large /><SummaryRow label="KLASIFIKASI" value={`${fieldClass?.label} · Kelas ${fieldClass?.grade}`} color={fieldClass?.color} /></View><View style={styles.manualNotice}><MaterialIcons name="info-outline" size={16} color="#A84D22" /><Text style={styles.manualNoticeText}>Input manual tetap perlu diverifikasi sesuai prosedur kalibrasi sebelum digunakan sebagai data resmi.</Text></View><View style={styles.reviewActions}><Pressable onPress={() => setReviewing(false)} style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}><Text style={styles.editButtonText}>Ubah</Text></Pressable><Pressable onPress={saveManualReading} style={({ pressed }) => [styles.saveLocalButton, pressed && styles.pressed]}><Text style={styles.saveLocalButtonText}>Simpan lokal</Text><MaterialIcons name="check" size={18} color="#FFFDF8" /></Pressable></View></View>}
                  </View>
                </View>
              </>}

              {workspace === "insights" && <>
                <View style={styles.intro}><View style={styles.eyebrowPill}><MaterialIcons name="insights" size={14} color="#2D6A5C" /><Text style={styles.eyebrowText}>ANALITIK DEMO</Text></View><Text style={styles.heroTitle}>Baca pola,{`\n`}bukan sekadar angka.</Text><Text style={styles.heroCopy}>Tampilan ringkas ini memakai data demonstrasi lokal untuk menunjukkan tujuan dashboard analitik nantinya.</Text></View>
                <View style={[styles.insightGrid, desktop && styles.insightGridDesktop]}><Metric value={activeStation.ntu.toFixed(1)} label="Nilai aktif" icon="water" /><Metric value={riverAverage.toFixed(1)} label="Rata-rata sungai" icon="analytics" accent /><Metric value={Math.max(...stations.map((station) => station.ntu)).toFixed(1)} label="Nilai tertinggi" icon="north-east" /></View>
                <View style={styles.surfaceCard}><View style={styles.cardHead}><View><Text style={styles.cardTitle}>Tren kekeruhan · {activeStation.name}</Text><Text style={styles.cardCopy}>Ringkasan nilai lokal dan simulasi yang aktif.</Text></View><Text style={styles.chartPeriod}>LIVE</Text></View><View style={styles.chart}><View style={styles.chartGridOne} /><View style={styles.chartGridTwo} /><View style={styles.chartGridThree} /><View style={styles.chartLine}><View style={[styles.chartDot, { left: "2%", bottom: "24%" }]} /><View style={[styles.chartDot, { left: "18%", bottom: "44%" }]} /><View style={[styles.chartDot, { left: "35%", bottom: "32%" }]} /><View style={[styles.chartDot, { left: "53%", bottom: "58%" }]} /><View style={[styles.chartDot, { left: "70%", bottom: "47%" }]} /><View style={[styles.chartDot, styles.chartDotLast, { left: "89%", bottom: `${Math.min(82, Math.max(18, activeStation.ntu * 2))}%` }]} /></View></View><Text style={styles.chartCaption}>Nilai aktif, ringkasan, dan status sumber berubah bersama setiap kali simulasi atau input manual diperbarui.</Text></View>
              </>}

              {workspace === "settings" && <>
                <View style={styles.intro}><View style={styles.eyebrowPill}><MaterialIcons name="settings" size={14} color="#2D6A5C" /><Text style={styles.eyebrowText}>PENGATURAN</Text></View><Text style={styles.heroTitle}>Kendalikan cara{`\n`}demo bekerja.</Text><Text style={styles.heroCopy}>Pengaturan ini setara dengan APK: Anda dapat menjeda simulasi, memahami batas kelas NTU, dan mengatur ulang data demo.</Text></View>
                <View style={[styles.settingsLayout, desktop && styles.settingsLayoutDesktop]}><View style={styles.settingsCard}><View style={styles.settingsRow}><View style={styles.settingsIcon}><MaterialIcons name="sensors" size={20} color="#2D6A5C" /></View><View style={styles.flex}><Text style={styles.settingsTitle}>Mode Simulasi</Text><Text style={styles.settingsBody}>{simulation ? "Aktif · nilai baru dibuat setiap 4 detik." : "Dijeda · nilai saat ini tetap dapat ditinjau."}</Text></View><Pressable onPress={() => setSimulation((current) => !current)} style={({ pressed }) => [styles.simulationToggle, simulation && styles.simulationToggleActive, pressed && styles.pressed]} accessibilityRole="switch" accessibilityState={{ checked: simulation }}><View style={[styles.simulationKnob, simulation && styles.simulationKnobActive]} /></Pressable></View><View style={styles.settingsDivider} /><View style={styles.settingsRow}><View style={styles.settingsIcon}><MaterialIcons name="storage" size={20} color="#2D6A5C" /></View><View style={styles.flex}><Text style={styles.settingsTitle}>Data lokal</Text><Text style={styles.settingsBody}>{recordCount} catatan demo · sumber terakhir {source === "manual" ? "input manual" : "simulasi"}.</Text></View></View></View><View style={styles.surfaceCard}><View style={styles.cardHead}><View><Text style={styles.cardTitle}>Kelas kekeruhan</Text><Text style={styles.cardCopy}>Batas NTU dipakai konsisten pada Monitor, Field Mode, dan Analitik.</Text></View></View>{[["Sangat jernih", "≤ 5 NTU", "#2D6A5C"], ["Jernih", "> 5–25 NTU", "#4C8B7A"], ["Keruh", "> 25–50 NTU", "#C4622D"], ["Sangat keruh", "> 50 NTU", "#8B3A1F"]].map(([label, value, color]) => <View key={label} style={styles.thresholdRow}><View style={[styles.thresholdDot, { backgroundColor: color }]} /><Text style={styles.thresholdLabel}>{label}</Text><Text style={styles.thresholdValue}>{value}</Text></View>)}</View></View>
                <Pressable onPress={resetDemo} style={({ pressed }) => [styles.resetWebAction, pressed && styles.pressed]}><MaterialIcons name="restart-alt" size={21} color="#8B3A1F" /><View style={styles.flex}><Text style={styles.resetWebTitle}>Reset data demo</Text><Text style={styles.resetWebBody}>Kembalikan nilai stasiun, jumlah catatan, dan siklus simulasi ke kondisi awal.</Text></View><MaterialIcons name="chevron-right" size={22} color="#8B3A1F" /></Pressable>
              </>}
            </main>
          </View>
          <View style={styles.footer}><Text style={styles.footerText}>Jernih Brantas · Website responsif untuk pemantauan dan pencatatan lapangan.</Text><Text style={styles.footerMeta}>DEMO LOCAL-FIRST</Text></View>
        </View>
      </ScrollView>
    </View>
  );
}

function Metric({ value, label, icon, accent = false }: { value: string; label: string; icon: React.ComponentProps<typeof MaterialIcons>["name"]; accent?: boolean }) {
  return <View style={[styles.metric, accent && styles.metricAccent]}><View style={[styles.metricIcon, accent && styles.metricIconAccent]}><MaterialIcons name={icon} size={18} color={accent ? "#2D6A5C" : "#78817A"} /></View><Text style={[styles.metricValue, accent && styles.metricValueAccent]}>{value}</Text><Text style={[styles.metricLabel, accent && styles.metricLabelAccent]}>{label}</Text></View>;
}

function FieldStep({ number, label, active = false }: { number: string; label: string; active?: boolean }) {
  return <View style={[styles.fieldStep, active && styles.fieldStepActive]}><Text style={[styles.fieldStepNumber, active && styles.fieldStepNumberActive]}>{number}</Text><Text style={[styles.fieldStepText, active && styles.fieldStepTextActive]}>{label}</Text></View>;
}

function SummaryRow({ label, value, large = false, color }: { label: string; value: string; large?: boolean; color?: string }) {
  return <View style={styles.summaryRow}><Text style={styles.summaryLabel}>{label}</Text><Text style={[styles.summaryValue, large && styles.summaryValueLarge, color ? { color } : null]} numberOfLines={1}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  page: { flex: 1, backgroundColor: "#F5F1E8" },
  pageContent: { flexGrow: 1 },
  shell: { width: "100%", maxWidth: 1280, alignSelf: "center", paddingHorizontal: 16, paddingVertical: 16 },
  shellDesktop: { paddingHorizontal: 24, paddingVertical: 22 },
  topbar: { minHeight: 58, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 14, paddingHorizontal: 14, borderRadius: 17, borderWidth: 1, borderColor: "#E1DBCC", backgroundColor: "rgba(255,253,248,0.92)" },
  brandLockup: { flexDirection: "row", alignItems: "center", gap: 9 },
  brandMark: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#17302B" },
  brandName: { color: "#17302B", fontFamily: "Georgia", fontSize: 19, fontWeight: "700", lineHeight: 19 },
  brandSub: { color: "#78817A", fontFamily: "monospace", fontSize: 8.5, fontWeight: "700", letterSpacing: 1.1, marginTop: 2 },
  topNav: { flexDirection: "row", alignItems: "center", gap: 6 },
  topNavLink: { minHeight: 35, paddingHorizontal: 12, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  topNavLinkActive: { backgroundColor: "#E5F0EA" },
  topNavText: { color: "#68756D", fontSize: 12, fontWeight: "700" },
  topNavTextActive: { color: "#2D6A5C" },
  webBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 999, backgroundColor: "#EDF2EC" },
  webBadgeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#4C8B7A" },
  webBadgeText: { color: "#2D6A5C", fontFamily: "monospace", fontSize: 9, fontWeight: "700" },
  webLayout: { flex: 1, marginTop: 16 },
  webLayoutDesktop: { flexDirection: "row", alignItems: "flex-start", gap: 20 },
  sidebar: { width: 246, flexShrink: 0, padding: 13, borderRadius: 20, borderWidth: 1, borderColor: "#E1DBCC", backgroundColor: "#FFFDF8" },
  sidebarKicker: { color: "#78817A", fontFamily: "monospace", fontSize: 9, fontWeight: "700", letterSpacing: 1, marginHorizontal: 7, marginTop: 6, marginBottom: 8 },
  sectionButton: { minHeight: 42, borderRadius: 11, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 3 },
  sectionButtonCompact: { flexGrow: 1, flexBasis: "45%", marginBottom: 0, justifyContent: "center", paddingHorizontal: 7 },
  sectionButtonActive: { backgroundColor: "#17302B" },
  sectionButtonText: { color: "#688078", fontSize: 12, fontWeight: "700" },
  sectionButtonTextActive: { color: "#FFFDF8" },
  sidebarDivider: { height: StyleSheet.hairlineWidth, backgroundColor: "#E7E0D3", marginVertical: 13 },
  sidebarStation: { minHeight: 53, paddingHorizontal: 8, borderRadius: 11, flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  sidebarStationActive: { backgroundColor: "#E8F1EC" },
  stationDot: { width: 8, height: 8, borderRadius: 4 },
  sidebarStationName: { color: "#17302B", fontSize: 11.5, fontWeight: "700" },
  sidebarStationNameActive: { color: "#2D6A5C" },
  sidebarStationPlace: { color: "#78817A", fontSize: 9.5, marginTop: 2 },
  sidebarStationPlaceActive: { color: "#5A7A6B" },
  sidebarStationValue: { color: "#68756D", fontFamily: "monospace", fontSize: 11, fontWeight: "700" },
  sidebarStationValueActive: { color: "#2D6A5C" },
  sidebarFootnote: { flexDirection: "row", gap: 7, marginTop: 12, padding: 10, borderRadius: 11, backgroundColor: "#EAF1ED" },
  sidebarFootnoteText: { flex: 1, color: "#477261", fontSize: 9.5, lineHeight: 14 },
  main: { flex: 1, minWidth: 0 },
  mobileWorkspaceNav: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 18 },
  intro: { marginBottom: 20 },
  introDesktop: { maxWidth: 650 },
  eyebrowPill: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 999, backgroundColor: "#E4EFEA", marginBottom: 10 },
  eyebrowText: { color: "#2D6A5C", fontFamily: "monospace", fontSize: 9, fontWeight: "700", letterSpacing: 0.8 },
  heroTitle: { color: "#17302B", fontFamily: "Georgia", fontSize: 31, lineHeight: 35, fontWeight: "700", letterSpacing: -0.6 },
  heroCopy: { maxWidth: 560, color: "#68756D", fontSize: 13, lineHeight: 20, marginTop: 10 },
  mobileStations: { gap: 9, paddingRight: 12, marginBottom: 16 },
  mobileStationCard: { width: 128, minHeight: 70, justifyContent: "space-between", padding: 11, borderRadius: 14, borderWidth: 1, borderColor: "#DDD7C8", backgroundColor: "#FFFDF8" },
  mobileStationCardActive: { backgroundColor: "#17302B", borderColor: "#17302B" },
  mobileStationName: { color: "#17302B", fontSize: 11, fontWeight: "700" },
  mobileStationNameActive: { color: "#FFFDF8" },
  mobileStationValue: { color: "#2D6A5C", fontFamily: "monospace", fontSize: 12, fontWeight: "700", marginTop: 8 },
  mobileStationValueActive: { color: "#BCE0D0" },
  statusCard: { minHeight: 268, overflow: "hidden", borderRadius: 24, padding: 20, backgroundColor: "#17302B", shadowColor: "#0F1E1C", shadowOpacity: 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: 9 }, elevation: 4 },
  statusCardDesktop: { minHeight: 286, padding: 26 },
  statusOrbOne: { position: "absolute", width: 320, height: 320, borderRadius: 160, borderWidth: 1, borderColor: "rgba(255,253,248,0.10)", right: -140, top: -165 },
  statusOrbTwo: { position: "absolute", width: 210, height: 210, borderRadius: 105, borderWidth: 1, borderColor: "rgba(255,253,248,0.10)", right: -45, top: -95 },
  statusHeader: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  statusLocation: { color: "#AFC2B8", fontSize: 10.5, letterSpacing: 0.4 },
  statusStation: { color: "#FFFDF8", fontFamily: "Georgia", fontSize: 22, lineHeight: 25, fontWeight: "700", marginTop: 4 },
  statusLive: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 999, backgroundColor: "rgba(143,217,184,0.14)" },
  statusLivePaused: { backgroundColor: "rgba(235,206,185,0.15)" },
  statusLiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#8FD9B8" },
  statusLiveDotPaused: { backgroundColor: "#D39B7C" },
  statusLiveText: { color: "#B7E0CD", fontFamily: "monospace", fontSize: 8.5, fontWeight: "700" },
  statusContent: { flex: 1, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 16 },
  statusContentDesktop: { paddingTop: 20 },
  ntuLine: { flexDirection: "row", alignItems: "baseline" },
  ntuNumber: { color: "#FFFDF8", fontFamily: "Georgia", fontSize: 57, lineHeight: 64, fontWeight: "700", letterSpacing: -1.5 },
  ntuLabel: { color: "#B7C8C0", fontFamily: "monospace", fontSize: 12, marginLeft: 7, fontWeight: "700" },
  classificationPill: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, marginTop: 8 },
  classificationDot: { width: 7, height: 7, borderRadius: 4 },
  classificationText: { fontSize: 10.5, fontWeight: "800" },
  gaugeWrap: { width: 76, height: 136, position: "relative", justifyContent: "center" },
  gaugeTrack: { width: 29, height: 112, borderRadius: 16, backgroundColor: "rgba(255,253,248,0.11)", borderWidth: 1, borderColor: "rgba(255,253,248,0.17)", overflow: "hidden", justifyContent: "flex-end" },
  gaugeFill: { width: "100%", backgroundColor: "#A89968", borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
  gaugeText: { position: "absolute", top: 11, left: 38, color: "#8FA79B", fontFamily: "monospace", fontSize: 8 },
  gaugeMid: { top: 62 },
  gaugeBottom: { top: 112 },
  statusFooter: { minHeight: 28, paddingTop: 11, flexDirection: "row", justifyContent: "space-between", gap: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(255,253,248,0.16)" },
  statusFooterText: { color: "#AFC2B8", fontSize: 9.5, flexShrink: 1 },
  trustStrip: { marginTop: 15, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: "#CDE0D5", backgroundColor: "#F0F7F2" },
  trustStripCompact: { marginTop: 14 },
  trustHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 11 },
  trustLabelWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  trustKicker: { color: "#477261", fontFamily: "monospace", fontSize: 9.5, fontWeight: "700", letterSpacing: 0.9 },
  simulationBadge: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 999, backgroundColor: "#E3EEF1", flexDirection: "row", alignItems: "center", gap: 5 },
  manualBadge: { backgroundColor: "#F6E2D6" },
  simulationDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#35718A" },
  manualBadgeDot: { backgroundColor: "#C4622D" },
  simulationText: { color: "#35718A", fontFamily: "monospace", fontSize: 8.5, fontWeight: "700" },
  manualBadgeText: { color: "#A84D22" },
  trustMetrics: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  trustMetric: { flexGrow: 1, minWidth: 110, padding: 9, borderRadius: 11, borderWidth: 1, borderColor: "#D8E6DE", backgroundColor: "#FFFDF8" },
  trustMetricLabel: { color: "#78817A", fontFamily: "monospace", fontSize: 8, fontWeight: "700", letterSpacing: 0.6 },
  trustMetricValue: { color: "#17302B", fontSize: 10.5, fontWeight: "700", marginTop: 5 },
  trustMetricWarning: { color: "#A84D22" },
  trustNotice: { color: "#78543E", fontSize: 10, lineHeight: 15, marginTop: 10 },
  metricRow: { flexDirection: "row", gap: 8, marginTop: 15 },
  metricRowDesktop: { gap: 10 },
  metric: { flex: 1, minHeight: 112, padding: 12, borderRadius: 17, borderWidth: 1, borderColor: "#E1DBCC", backgroundColor: "#FFFDF8", justifyContent: "space-between" },
  metricAccent: { borderColor: "#CFE1D7", backgroundColor: "#EAF3EE" },
  metricIcon: { width: 29, height: 29, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#F0ECE3" },
  metricIconAccent: { backgroundColor: "#D8EBDD" },
  metricValue: { color: "#17302B", fontFamily: "monospace", fontSize: 19, fontWeight: "700", marginTop: 10 },
  metricValueAccent: { color: "#2D6A5C" },
  metricLabel: { color: "#68756D", fontSize: 9.5, lineHeight: 13, marginTop: 4 },
  metricLabelAccent: { color: "#477261" },
  monitorGrid: { gap: 15, marginTop: 15 },
  monitorGridDesktop: { flexDirection: "row" },
  surfaceCard: { flex: 1.25, minHeight: 315, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: "#E1DBCC", backgroundColor: "#FFFDF8" },
  cardHead: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  cardTitle: { color: "#17302B", fontSize: 14.5, fontWeight: "700" },
  cardCopy: { color: "#78817A", fontSize: 10.5, marginTop: 4 },
  riverMap: { flex: 1, minHeight: 205, marginTop: 14, borderRadius: 15, overflow: "hidden", backgroundColor: "#EAE4D4", position: "relative" },
  mapPoint: { position: "absolute", zIndex: 2, width: 17, height: 17, borderRadius: 9, borderWidth: 3, borderColor: "#FFFDF8", marginLeft: -8, marginTop: -8, shadowColor: "#0F1E1C", shadowOpacity: 0.22, shadowRadius: 5, elevation: 3 },
  mapPointSelected: { width: 23, height: 23, borderRadius: 12, marginLeft: -11, marginTop: -11, borderWidth: 4 },
  mapCaption: { position: "absolute", zIndex: 3, left: 12, bottom: 12, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, backgroundColor: "rgba(255,253,248,0.92)" },
  mapCaptionTitle: { color: "#17302B", fontSize: 10.5, fontWeight: "700" },
  mapCaptionValue: { color: "#477261", fontFamily: "monospace", fontSize: 9, marginTop: 2 },
  fieldCallout: { flex: 0.75, minHeight: 315, padding: 20, borderRadius: 20, backgroundColor: "#17302B", justifyContent: "center" },
  fieldCalloutIcon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#A9CBBE" },
  fieldCalloutKicker: { color: "#9CCFBA", fontFamily: "monospace", fontSize: 9, fontWeight: "700", letterSpacing: 0.9, marginTop: 17 },
  fieldCalloutTitle: { color: "#FFFDF8", fontFamily: "Georgia", fontSize: 22, fontWeight: "700", lineHeight: 26, marginTop: 7 },
  fieldCalloutCopy: { color: "#B7C8C0", fontSize: 11.5, lineHeight: 17, marginTop: 8 },
  fieldCalloutButton: { minHeight: 44, borderRadius: 12, paddingHorizontal: 13, marginTop: 18, alignItems: "center", justifyContent: "space-between", flexDirection: "row", backgroundColor: "#A9CBBE" },
  fieldCalloutButtonText: { color: "#17302B", fontSize: 12, fontWeight: "800" },
  fieldLayout: { gap: 15 },
  fieldLayoutDesktop: { flexDirection: "row", alignItems: "flex-start" },
  fieldSide: { flex: 0.67 },
  fieldSteps: { flexDirection: "row", gap: 8, flexWrap: "wrap", padding: 13, borderRadius: 17, borderWidth: 1, borderColor: "#E1DBCC", backgroundColor: "#FFFDF8" },
  fieldStep: { minHeight: 31, paddingHorizontal: 8, flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 999, backgroundColor: "#EAE4D4" },
  fieldStepActive: { backgroundColor: "#E4EFEA" },
  fieldStepNumber: { width: 17, height: 17, borderRadius: 9, color: "#FFFDF8", backgroundColor: "#C5BFAA", fontFamily: "monospace", fontSize: 9, fontWeight: "700", textAlign: "center", lineHeight: 17 },
  fieldStepNumberActive: { backgroundColor: "#2D6A5C" },
  fieldStepText: { color: "#68756D", fontSize: 10, fontWeight: "700" },
  fieldStepTextActive: { color: "#2D6A5C" },
  fieldCard: { flex: 1.33, borderRadius: 22, padding: 21, backgroundColor: "#FFFDF8", borderWidth: 1, borderColor: "#E1DBCC", shadowColor: "#0F1E1C", shadowOpacity: 0.08, shadowRadius: 15, shadowOffset: { width: 0, height: 7 }, elevation: 2 },
  fieldCardKicker: { color: "#2D6A5C", fontFamily: "monospace", fontSize: 9.5, fontWeight: "700", letterSpacing: 0.9 },
  fieldCardTitle: { color: "#17302B", fontFamily: "Georgia", fontSize: 25, lineHeight: 29, fontWeight: "700", marginTop: 7 },
  formLabel: { color: "#78817A", fontFamily: "monospace", fontSize: 9.5, fontWeight: "700", letterSpacing: 0.8, marginTop: 18, marginBottom: 8 },
  stationPickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  stationPick: { minHeight: 38, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1, borderColor: "#DDD7C8", backgroundColor: "#FFFDF8", flexDirection: "row", alignItems: "center", gap: 6 },
  stationPickActive: { borderColor: "#2D6A5C", backgroundColor: "#EAF3EE" },
  stationPickText: { color: "#68756D", fontSize: 10.5, fontWeight: "700" },
  stationPickTextActive: { color: "#2D6A5C" },
  ntuInput: { minHeight: 69, borderRadius: 14, borderWidth: 1.5, borderColor: "#4C8B7A", backgroundColor: "#F6FBF7", paddingHorizontal: 15, flexDirection: "row", alignItems: "center" },
  ntuInputInvalid: { borderColor: "#C4622D", backgroundColor: "#FFF5EF" },
  ntuTextInput: { flex: 1, color: "#17302B", fontFamily: "Georgia", fontSize: 32, fontWeight: "700", paddingVertical: 10, outlineStyle: "none" as never },
  inputUnit: { color: "#2D6A5C", fontFamily: "monospace", fontSize: 12, fontWeight: "700" },
  inputHelp: { color: "#78817A", fontSize: 10, lineHeight: 15, marginTop: 6 },
  inputHelpWarning: { color: "#A84D22" },
  fieldPreview: { marginTop: 13, borderRadius: 12, padding: 11, flexDirection: "row", alignItems: "center", gap: 8 },
  fieldPreviewTitle: { fontSize: 11.5, fontWeight: "800" },
  fieldPreviewCopy: { fontSize: 10, marginTop: 3 },
  deviceRow: { minHeight: 51, paddingHorizontal: 12, borderWidth: 1, borderColor: "#DDD7C8", borderRadius: 12, backgroundColor: "#FFFDF8", flexDirection: "row", alignItems: "center", gap: 9 },
  deviceTitle: { color: "#17302B", fontSize: 12, fontWeight: "700" },
  deviceCopy: { color: "#78817A", fontSize: 9.5, marginTop: 2 },
  reviewButton: { minHeight: 51, borderRadius: 13, paddingHorizontal: 15, marginTop: 20, backgroundColor: "#2D6A5C", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  reviewButtonDisabled: { backgroundColor: "#A8B3AC" },
  reviewButtonText: { color: "#FFFDF8", fontSize: 13, fontWeight: "800" },
  reviewIcon: { width: 48, height: 48, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "#E4EFEA", marginBottom: 15 },
  reviewCopy: { color: "#68756D", fontSize: 12, lineHeight: 18, marginTop: 8 },
  reviewSummary: { marginTop: 18, borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: "#E5DFD2" },
  summaryRow: { minHeight: 45, paddingHorizontal: 12, backgroundColor: "#FFFDF8", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#E5DFD2", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  summaryLabel: { color: "#78817A", fontFamily: "monospace", fontSize: 8.5, fontWeight: "700", letterSpacing: 0.7 },
  summaryValue: { flex: 1, color: "#17302B", fontSize: 11, fontWeight: "700", textAlign: "right" },
  summaryValueLarge: { fontFamily: "monospace", fontSize: 16 },
  manualNotice: { flexDirection: "row", gap: 8, padding: 11, borderRadius: 12, backgroundColor: "#F6E2D6", marginTop: 13 },
  manualNoticeText: { flex: 1, color: "#8C5B40", fontSize: 10, lineHeight: 15 },
  reviewActions: { flexDirection: "row", gap: 9, marginTop: 18 },
  editButton: { flex: 0.7, minHeight: 48, borderRadius: 13, backgroundColor: "#F0ECE3", alignItems: "center", justifyContent: "center" },
  editButtonText: { color: "#17302B", fontSize: 12, fontWeight: "700" },
  saveLocalButton: { flex: 1.3, minHeight: 48, borderRadius: 13, backgroundColor: "#2D6A5C", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 7 },
  saveLocalButtonText: { color: "#FFFDF8", fontSize: 12, fontWeight: "700" },
  savedState: { minHeight: 380, alignItems: "center", justifyContent: "center", paddingHorizontal: 22 },
  savedIcon: { width: 58, height: 58, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "#2D6A5C" },
  savedTitle: { color: "#17302B", fontFamily: "Georgia", fontSize: 24, fontWeight: "700", textAlign: "center", marginTop: 16 },
  savedCopy: { maxWidth: 350, color: "#68756D", fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: 7 },
  secondaryButton: { minHeight: 43, paddingHorizontal: 15, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "#E4EFEA", marginTop: 18 },
  secondaryButtonText: { color: "#2D6A5C", fontSize: 12, fontWeight: "700" },
  insightGrid: { flexDirection: "row", gap: 8, marginBottom: 15 },
  insightGridDesktop: { maxWidth: 700, gap: 10 },
  chartPeriod: { color: "#2D6A5C", fontFamily: "monospace", fontSize: 9, fontWeight: "700", paddingHorizontal: 8, paddingVertical: 5, borderRadius: 999, backgroundColor: "#E4EFEA" },
  chart: { height: 220, marginTop: 16, overflow: "hidden", borderRadius: 14, backgroundColor: "#F8F5ED", position: "relative" },
  chartGridOne: { position: "absolute", left: 14, right: 14, top: "25%", borderTopWidth: 1, borderColor: "#DED8C8" },
  chartGridTwo: { position: "absolute", left: 14, right: 14, top: "50%", borderTopWidth: 1, borderColor: "#DED8C8" },
  chartGridThree: { position: "absolute", left: 14, right: 14, top: "75%", borderTopWidth: 1, borderColor: "#DED8C8" },
  chartLine: { position: "absolute", left: "6%", right: "6%", top: 0, bottom: 0, borderLeftWidth: 0 },
  chartDot: { position: "absolute", width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: "#FFFDF8", backgroundColor: "#4C8B7A" },
  chartDotLast: { width: 14, height: 14, borderRadius: 7, backgroundColor: "#C4622D" },
  chartCaption: { color: "#78817A", fontSize: 10, lineHeight: 15, marginTop: 10 },
  settingsLayout: { gap: 15 },
  settingsLayoutDesktop: { flexDirection: "row", alignItems: "flex-start" },
  settingsCard: { flex: 1, borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: "#E1DBCC", backgroundColor: "#FFFDF8" },
  settingsRow: { minHeight: 94, padding: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  settingsIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#E4EFEA" },
  settingsTitle: { color: "#17302B", fontSize: 14, fontWeight: "700" },
  settingsBody: { color: "#68756D", fontSize: 11, lineHeight: 16, marginTop: 4 },
  settingsDivider: { height: StyleSheet.hairlineWidth, marginLeft: 66, backgroundColor: "#E7E0D3" },
  simulationToggle: { width: 46, height: 27, padding: 3, borderRadius: 999, justifyContent: "center", backgroundColor: "#C9C4B8" },
  simulationToggleActive: { alignItems: "flex-end", backgroundColor: "#4C8B7A" },
  simulationKnob: { width: 21, height: 21, borderRadius: 11, backgroundColor: "#FFFDF8" },
  simulationKnobActive: { backgroundColor: "#FFFDF8" },
  thresholdRow: { minHeight: 36, flexDirection: "row", alignItems: "center", gap: 9 },
  thresholdDot: { width: 9, height: 9, borderRadius: 5 },
  thresholdLabel: { flex: 1, color: "#17302B", fontSize: 12, fontWeight: "600" },
  thresholdValue: { color: "#78817A", fontFamily: "monospace", fontSize: 10.5 },
  resetWebAction: { minHeight: 82, marginTop: 15, padding: 14, borderRadius: 17, borderWidth: 1, borderColor: "#E8C8BA", backgroundColor: "#FFF8F4", flexDirection: "row", alignItems: "center", gap: 11 },
  resetWebTitle: { color: "#8B3A1F", fontSize: 14, fontWeight: "700" },
  resetWebBody: { color: "#9B6650", fontSize: 10.5, lineHeight: 15, marginTop: 3 },
  footer: { minHeight: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 18, paddingHorizontal: 15, borderRadius: 15, backgroundColor: "#EAE4D4" },
  footerText: { color: "#68756D", fontSize: 10, flex: 1 },
  footerMeta: { color: "#477261", fontFamily: "monospace", fontSize: 8.5, fontWeight: "700" },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
});
