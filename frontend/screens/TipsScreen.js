import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const categories = [
  {
    title: "🎣 Phishing",
    color: "#ef4444",
    tips: [
      "Scammers impersonate banks, government agencies, or popular apps.",
      "Legitimate organisations will never ask for your password or TAC/OTP via call or message.",
      "Check the sender's email address carefully — scammers use lookalike domains (e.g. bnm-gov.com instead of bnm.gov.my).",
      "Hover over or long-press links before clicking to see the real destination URL.",
    ],
  },
  {
    title: "💼 Job Scams",
    color: "#f59e0b",
    tips: [
      "Legitimate employers never ask you to pay upfront for training, equipment, or background checks.",
      "Be wary of jobs that offer unusually high pay for simple tasks like liking posts or watching videos.",
      "Work-from-home jobs that promise thousands a day with no experience are almost always scams.",
      "Always verify the company exists before sharing your personal details or bank info.",
    ],
  },
  {
    title: "💸 Financial Scams",
    color: "#6366f1",
    tips: [
      "If someone asks you to transfer money to 'secure' your account, it is a scam — banks never do this.",
      "Investment schemes promising guaranteed high returns (10–30% monthly) are almost always scams.",
      "Never allow strangers to remote-access your phone or computer for 'tech support'.",
      "Macau Scam: Police will NEVER ask you to transfer money to a 'safe account'.",
    ],
  },
  {
    title: "❤️ Romance Scams",
    color: "#ec4899",
    tips: [
      "Be cautious of online relationships that progress very quickly.",
      "Scammers often claim to be overseas (oil rig, military, doctor) and can never video call.",
      "Never send money to someone you have not met in person, no matter how convincing their story.",
      "Reverse image search their profile photo — scammers often steal photos from real people.",
    ],
  },
  {
    title: "🛒 Online Shopping Scams",
    color: "#22c55e",
    tips: [
      "Only buy from verified sellers on trusted platforms like Shopee, Lazada, or official websites.",
      "Be suspicious of prices that are far below market value.",
      "Never pay via direct bank transfer to individuals — use platform-protected payment methods.",
      "Check seller ratings and reviews before purchasing.",
    ],
  },
  {
    title: "📱 How to Protect Yourself",
    color: "#888",
    tips: [
      "Enable 2-factor authentication (2FA) on all important accounts.",
      "Never share your OTP, TAC, or PIN with anyone — including 'bank staff'.",
      "Regularly check Semak Mule to verify suspicious account numbers.",
      "Report scams to NSRC hotline 997 immediately if you've transferred money.",
      "Keep your apps and OS updated to patch security vulnerabilities.",
    ],
  },
];

export default function TipsScreen() {
  const [expanded, setExpanded] = useState(null);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Scam Awareness</Text>
        <Text style={styles.subtitle}>Learn how to recognise and avoid common scams in Malaysia</Text>

        {categories.map((cat, index) => (
          <View key={index} style={styles.card}>
            <TouchableOpacity
              style={styles.cardHeader}
              onPress={() => setExpanded(expanded === index ? null : index)}
              activeOpacity={0.8}
            >
              <Text style={styles.cardTitle}>{cat.title}</Text>
              <Text style={styles.chevron}>{expanded === index ? "▲" : "▼"}</Text>
            </TouchableOpacity>

            {expanded === index && (
              <View style={styles.tipsContainer}>
                {cat.tips.map((tip, i) => (
                  <View key={i} style={styles.tipRow}>
                    <View style={[styles.dot, { backgroundColor: cat.color }]} />
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        <View style={styles.hotlineBox}>
          <Text style={styles.hotlineTitle}>🆘 Emergency Hotlines</Text>
          <Text style={styles.hotlineItem}>NSRC Scam Hotline: <Text style={styles.hotlineNumber}>997</Text></Text>
          <Text style={styles.hotlineItem}>PDRM: <Text style={styles.hotlineNumber}>999</Text></Text>
          <Text style={styles.hotlineItem}>BNM LINK: <Text style={styles.hotlineNumber}>1300 88 5465</Text></Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f0f" },
  scroll: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff", marginTop: 10, marginBottom: 6 },
  subtitle: { fontSize: 14, color: "#888", marginBottom: 20, lineHeight: 20 },
  card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  cardTitle: { fontSize: 15, fontWeight: "bold", color: "#fff" },
  chevron: { color: "#555", fontSize: 12 },
  tipsContainer: { paddingHorizontal: 16, paddingBottom: 16 },
  tipRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 7, flexShrink: 0 },
  tipText: { color: "#aaa", fontSize: 13, lineHeight: 20, flex: 1 },
  hotlineBox: {
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ef444455",
    marginTop: 4,
  },
  hotlineTitle: { fontSize: 15, fontWeight: "bold", color: "#fff", marginBottom: 12 },
  hotlineItem: { fontSize: 14, color: "#aaa", marginBottom: 6 },
  hotlineNumber: { color: "#ef4444", fontWeight: "bold" },
});
