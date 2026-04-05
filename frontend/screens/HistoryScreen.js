import React, { useState, useCallback } from "react";
import {
  StyleSheet, Text, View, ScrollView,
  TouchableOpacity, Alert, Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useLang } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { translations } from "../utils/translations";

const STATUS_FILTERS = ["ALL", "SAFE", "SUSPICIOUS", "SCAM"];

export default function HistoryScreen() {
  const { lang } = useLang();
  const t = translations[lang] || translations.en;
  const { theme } = useTheme();
  const [history, setHistory] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL"); // ALL, TODAY, WEEK
  const styles = makeStyles(theme);

  useFocusEffect(useCallback(() => { loadHistory(); }, [loadHistory]));

  const loadHistory = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem("scan_history");
      setHistory(stored ? JSON.parse(stored) : []);
    } catch {}
  }, []);

  const clearHistory = () => {
    Alert.alert(t.clearHistory, t.clearHistoryConfirm, [
      { text: t.cancel, style: "cancel" },
      {
        text: t.clearAll, style: "destructive", onPress: async () => {
          await AsyncStorage.removeItem("scan_history");
          setHistory([]);
        }
      },
    ]);
  };

  const shareItem = async (item) => {
    try {
      await Share.share({
        message:
          `🛡️ Scam Detector Result\n\n` +
          `Input: ${item.input}\n` +
          `Status: ${item.status}\n` +
          `Risk Score: ${item.score}/100\n` +
          `${item.reason}\n\n` +
          `Checked on: ${item.date}`,
      });
    } catch {}
  };

  const getStatusColor = (status) => {
    if (status === "SAFE") return theme.safe;
    if (status === "SUSPICIOUS") return theme.warning;
    return theme.danger;
  };

  const getStatusIcon = (status) => {
    if (status === "SAFE") return "✅";
    if (status === "SUSPICIOUS") return "⚠️";
    return "🚨";
  };

  const parseDate = (dateStr) => {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  };

  const isToday = (dateStr) => {
    const d = parseDate(dateStr);
    if (!d) return false;
    return d.toDateString() === new Date().toDateString();
  };

  const isThisWeek = (dateStr) => {
    const d = parseDate(dateStr);
    if (!d) return false;
    return (new Date() - d) / (1000 * 60 * 60 * 24) <= 7;
  };

  const formatDate = (dateStr) => {
    const d = parseDate(dateStr);
    if (!d) return dateStr; // fallback: show raw string
    return d.toLocaleString("en-MY");
  };

  const filtered = history.slice().reverse().filter((item) => {
    const statusOk = statusFilter === "ALL" || item.status === statusFilter;
    const dateOk =
      dateFilter === "ALL" ||
      (dateFilter === "TODAY" && isToday(item.date)) ||
      (dateFilter === "WEEK" && isThisWeek(item.date));
    return statusOk && dateOk;
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>{t.scanHistory}</Text>
            <Text style={styles.subtitle}>
              {filtered.length} / {history.length} {history.length !== 1 ? t.pastScans : t.pastScan}
            </Text>
          </View>
          {history.length > 0 && (
            <TouchableOpacity onPress={clearHistory}>
              <Text style={styles.clearText}>{t.clearAll}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Status filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {STATUS_FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, statusFilter === f && { backgroundColor: theme.accent, borderColor: theme.accent }]}
              onPress={() => setStatusFilter(f)}
            >
              <Text style={[styles.filterText, { color: statusFilter === f ? "#fff" : theme.subtext }]}>
                {f === "ALL" ? "All" : f === "SAFE" ? "✅ Safe" : f === "SUSPICIOUS" ? "⚠️ Suspicious" : "🚨 Scam"}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Date filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.filterRow, { marginTop: 0 }]}>
          {[["ALL", "Any time"], ["TODAY", "Today"], ["WEEK", "This week"]].map(([val, label]) => (
            <TouchableOpacity
              key={val}
              style={[styles.filterChip, dateFilter === val && { backgroundColor: theme.accentBg, borderColor: theme.accent }]}
              onPress={() => setDateFilter(val)}
            >
              <Text style={[styles.filterText, { color: dateFilter === val ? theme.accent : theme.subtext }]}>
                📅 {label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* List */}
        {filtered.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>{history.length === 0 ? t.noScansYet : "No matches"}</Text>
            <Text style={styles.emptySubtext}>{history.length === 0 ? t.scansWillAppear : "Try a different filter"}</Text>
          </View>
        ) : (
          filtered.map((item, index) => (
            <View key={index} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) + "22", borderColor: getStatusColor(item.status) }]}>
                  <Text style={[styles.badgeText, { color: getStatusColor(item.status) }]}>
                    {getStatusIcon(item.status)} {item.status}
                  </Text>
                </View>
                <View style={styles.cardTopRight}>
                  <Text style={styles.score}>{item.score}/100</Text>
                  <TouchableOpacity onPress={() => shareItem(item)} style={styles.shareBtn}>
                    <Text style={styles.shareIcon}>↑</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.inputText} numberOfLines={2}>{item.input}</Text>
              <Text style={styles.reason} numberOfLines={2}>{item.reason}</Text>
              <Text style={styles.date}>{formatDate(item.date)}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  scroll: { padding: 20, paddingBottom: 110 },
  headerRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: 16, marginTop: 10,
  },
  title: { fontSize: 24, fontWeight: "bold", color: theme.text },
  subtitle: { fontSize: 13, color: theme.subtext, marginTop: 4 },
  clearText: { color: theme.danger, fontSize: 13, marginTop: 8 },
  filterRow: { marginBottom: 10 },
  filterChip: {
    borderWidth: 1, borderColor: theme.border,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
    marginRight: 8, backgroundColor: theme.surface,
  },
  filterText: { fontSize: 12, fontWeight: "600" },
  emptyBox: { alignItems: "center", marginTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, color: theme.text, fontWeight: "bold", marginBottom: 6 },
  emptySubtext: { fontSize: 14, color: theme.subtext },
  card: {
    backgroundColor: theme.surface, borderRadius: 14,
    padding: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.border,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  cardTopRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  badge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: "bold" },
  score: { fontSize: 13, color: theme.subtext },
  shareBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: theme.accent + "22", borderWidth: 1,
    borderColor: theme.accent, alignItems: "center", justifyContent: "center",
  },
  shareIcon: { color: theme.accent, fontWeight: "bold", fontSize: 14 },
  inputText: { fontSize: 14, color: theme.text, marginBottom: 6 },
  reason: { fontSize: 13, color: theme.subtext, lineHeight: 18, marginBottom: 8 },
  date: { fontSize: 11, color: theme.subtext },
});
