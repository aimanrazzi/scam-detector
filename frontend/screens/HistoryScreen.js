import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useLang } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { translations } from "../utils/translations";

export default function HistoryScreen() {
  const { lang } = useLang();
  const t = translations[lang] || translations.en;
  const { theme } = useTheme();
  const [history, setHistory] = useState([]);

  const styles = makeStyles(theme);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem("scan_history");
      if (stored) setHistory(JSON.parse(stored));
    } catch {}
  };

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>{t.scanHistory}</Text>
            <Text style={styles.subtitle}>
              {history.length} {history.length !== 1 ? t.pastScans : t.pastScan}
            </Text>
          </View>
          {history.length > 0 && (
            <TouchableOpacity onPress={clearHistory}>
              <Text style={styles.clearText}>{t.clearAll}</Text>
            </TouchableOpacity>
          )}
        </View>

        {history.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>{t.noScansYet}</Text>
            <Text style={styles.emptySubtext}>{t.scansWillAppear}</Text>
          </View>
        ) : (
          history.slice().reverse().map((item, index) => (
            <View key={index} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) + "22", borderColor: getStatusColor(item.status) }]}>
                  <Text style={[styles.badgeText, { color: getStatusColor(item.status) }]}>
                    {getStatusIcon(item.status)} {item.status}
                  </Text>
                </View>
                <Text style={styles.score}>{item.score}/100</Text>
              </View>
              <Text style={styles.inputText} numberOfLines={2}>{item.input}</Text>
              <Text style={styles.reason} numberOfLines={2}>{item.reason}</Text>
              <Text style={styles.date}>{item.date}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  scroll: { padding: 20, paddingBottom: 40 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    marginTop: 10,
  },
  title: { fontSize: 24, fontWeight: "bold", color: theme.text },
  subtitle: { fontSize: 13, color: theme.subtext, marginTop: 4 },
  clearText: { color: theme.danger, fontSize: 13, marginTop: 8 },
  emptyBox: { alignItems: "center", marginTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, color: theme.text, fontWeight: "bold", marginBottom: 6 },
  emptySubtext: { fontSize: 14, color: theme.subtext },
  card: {
    backgroundColor: theme.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  badge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: "bold" },
  score: { fontSize: 13, color: theme.subtext },
  inputText: { fontSize: 14, color: theme.text, marginBottom: 6 },
  reason: { fontSize: 13, color: theme.subtext, lineHeight: 18, marginBottom: 8 },
  date: { fontSize: 11, color: theme.subtext },
});
