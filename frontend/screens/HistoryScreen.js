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

export default function HistoryScreen() {
  const [history, setHistory] = useState([]);

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
    Alert.alert("Clear History", "Are you sure you want to delete all scan history?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear", style: "destructive", onPress: async () => {
          await AsyncStorage.removeItem("scan_history");
          setHistory([]);
        }
      },
    ]);
  };

  const getStatusColor = (status) => {
    if (status === "SAFE") return "#22c55e";
    if (status === "SUSPICIOUS") return "#f59e0b";
    return "#ef4444";
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
            <Text style={styles.title}>Scan History</Text>
            <Text style={styles.subtitle}>{history.length} past scan{history.length !== 1 ? "s" : ""}</Text>
          </View>
          {history.length > 0 && (
            <TouchableOpacity onPress={clearHistory}>
              <Text style={styles.clearText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>

        {history.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No scans yet</Text>
            <Text style={styles.emptySubtext}>Your past checks will appear here</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f0f" },
  scroll: { padding: 20, paddingBottom: 40 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    marginTop: 10,
  },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  subtitle: { fontSize: 13, color: "#888", marginTop: 4 },
  clearText: { color: "#ef4444", fontSize: 13, marginTop: 8 },
  emptyBox: { alignItems: "center", marginTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, color: "#fff", fontWeight: "bold", marginBottom: 6 },
  emptySubtext: { fontSize: 14, color: "#888" },
  card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  badge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: "bold" },
  score: { fontSize: 13, color: "#aaa" },
  inputText: { fontSize: 14, color: "#fff", marginBottom: 6 },
  reason: { fontSize: 13, color: "#aaa", lineHeight: 18, marginBottom: 8 },
  date: { fontSize: 11, color: "#555" },
});
