import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const reportOptions = [
  {
    icon: "🚔",
    title: "Report to PDRM (Police)",
    description: "File a police report online or visit your nearest police station for financial scams.",
    action: "File Online Report",
    url: "https://ccid.rmp.gov.my",
    color: "#6366f1",
    urgent: false,
  },
  {
    icon: "📞",
    title: "NSRC Hotline – 997",
    description: "Call the National Scam Response Centre immediately if you have transferred money to a scammer. Available 24/7.",
    action: "Call 997",
    url: "tel:997",
    color: "#ef4444",
    urgent: true,
  },
  {
    icon: "🏦",
    title: "Report to Your Bank",
    description: "Contact your bank immediately to freeze transactions if you've been scammed. Call the number on the back of your card.",
    action: "BNM LINK – 1300 88 5465",
    url: "tel:1300885465",
    color: "#f59e0b",
    urgent: true,
  },
  {
    icon: "🌐",
    title: "Report to MCMC",
    description: "Report scam websites, phishing links, and online fraud to the Malaysian Communications and Multimedia Commission.",
    action: "Submit Report Online",
    url: "https://aduan.mcmc.gov.my",
    color: "#22c55e",
    urgent: false,
  },
  {
    icon: "💬",
    title: "Report WhatsApp/Telegram Scam",
    description: "To report on WhatsApp: open the chat → tap the contact name → scroll down → tap 'Report'. For Telegram: long press the message → tap '...' → Report.",
    action: "WhatsApp Help Center",
    url: "https://faq.whatsapp.com",
    color: "#888",
    urgent: false,
  },
];

export default function ReportScreen() {
  const open = (url) => Linking.openURL(url);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Report a Scam</Text>
        <Text style={styles.subtitle}>Take action — report scams to the right authority</Text>

        <View style={styles.emergencyBanner}>
          <Text style={styles.emergencyText}>🚨 If you just transferred money to a scammer, call 997 immediately!</Text>
        </View>

        {reportOptions.map((item, index) => (
          <View key={index} style={[styles.card, item.urgent && styles.urgentCard]}>
            <View style={styles.cardTop}>
              <Text style={styles.icon}>{item.icon}</Text>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDesc}>{item.description}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: item.color }]}
              onPress={() => open(item.url)}
              activeOpacity={0.8}
            >
              <Text style={styles.actionButtonText}>{item.action}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 6,
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    color: "#888",
    marginBottom: 16,
  },
  emergencyBanner: {
    backgroundColor: "#ef444422",
    borderColor: "#ef4444",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  emergencyText: {
    color: "#ef4444",
    fontSize: 13,
    fontWeight: "bold",
    lineHeight: 20,
  },
  card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  urgentCard: {
    borderColor: "#ef444455",
  },
  cardTop: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
  },
  icon: {
    fontSize: 28,
    marginTop: 2,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 13,
    color: "#aaa",
    lineHeight: 20,
  },
  actionButton: {
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
});
