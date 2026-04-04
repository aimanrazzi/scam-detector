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

const resources = [
  {
    name: "Semak Mule",
    description: "Check if a bank account or phone number has been reported as a scam mule in Malaysia.",
    url: "https://semakmule.rmp.gov.my",
    tag: "PDRM",
    color: "#6366f1",
  },
  {
    name: "NSRC – National Scam Response Centre",
    description: "Malaysia's official centre to report financial scams and get emergency assistance.",
    url: "https://www.nsrc.malaysia.gov.my",
    tag: "KPDNHEP",
    color: "#f59e0b",
  },
  {
    name: "CCID Scam Portal",
    description: "Royal Malaysia Police portal to check and report cybercrime and scam cases.",
    url: "https://ccid.rmp.gov.my/semakmule",
    tag: "PDRM",
    color: "#6366f1",
  },
  {
    name: "BNM BNMTELELINK",
    description: "Bank Negara Malaysia's contact centre for reporting financial fraud and scams.",
    url: "https://www.bnm.gov.my/contact-us",
    tag: "BNM",
    color: "#22c55e",
  },
  {
    name: "MCMC Aduan",
    description: "Report online scams, fraud websites, and cybercrime to the Malaysian Communications and Multimedia Commission.",
    url: "https://aduan.mcmc.gov.my",
    tag: "MCMC",
    color: "#ef4444",
  },
];

export default function ResourcesScreen() {
  const open = (url) => Linking.openURL(url);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Government Resources</Text>
        <Text style={styles.subtitle}>Official Malaysian platforms to verify and report scams</Text>

        {resources.map((item, index) => (
          <TouchableOpacity key={index} style={styles.card} onPress={() => open(item.url)} activeOpacity={0.8}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardName}>{item.name}</Text>
              <View style={[styles.tag, { backgroundColor: item.color + "22", borderColor: item.color }]}>
                <Text style={[styles.tagText, { color: item.color }]}>{item.tag}</Text>
              </View>
            </View>
            <Text style={styles.cardDesc}>{item.description}</Text>
            <Text style={styles.cardUrl}>{item.url}</Text>
          </TouchableOpacity>
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
    marginBottom: 24,
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
    gap: 8,
  },
  cardName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#ffffff",
    flex: 1,
  },
  tag: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "bold",
  },
  cardDesc: {
    fontSize: 13,
    color: "#aaa",
    lineHeight: 20,
    marginBottom: 8,
  },
  cardUrl: {
    fontSize: 12,
    color: "#6366f1",
  },
});
