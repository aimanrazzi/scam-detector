import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from "react-native";

const BACKEND_URL = "http://192.168.0.14:5000"; // Your PC's local IP

export default function App() {
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyze = async () => {
    if (!inputText.trim()) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText.trim() }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch (err) {
      setError("Could not connect to server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === "SAFE") return "#22c55e";
    if (status === "SUSPICIOUS") return "#f59e0b";
    if (status === "SCAM") return "#ef4444";
    return "#ffffff";
  };

  const getScoreBarColor = (score) => {
    if (score <= 30) return "#22c55e";
    if (score <= 69) return "#f59e0b";
    return "#ef4444";
  };

  const reset = () => {
    setInputText("");
    setResult(null);
    setError(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f0f" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerIcon}>🔍</Text>
          <Text style={styles.title}>Scam Detector</Text>
          <Text style={styles.subtitle}>Paste a message, email, or URL to check if it's a scam</Text>
        </View>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Paste suspicious message or URL here..."
            placeholderTextColor="#555"
            multiline
            value={inputText}
            onChangeText={setInputText}
          />
        </View>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.analyzeButton, !inputText.trim() && styles.disabledButton]}
            onPress={analyze}
            disabled={!inputText.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.analyzeButtonText}>Analyze</Text>
            )}
          </TouchableOpacity>

          {(result || error) && (
            <TouchableOpacity style={styles.resetButton} onPress={reset}>
              <Text style={styles.resetButtonText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Error */}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Result */}
        {result && (
          <View style={styles.resultCard}>
            {/* Status Badge */}
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(result.status) + "22", borderColor: getStatusColor(result.status) }]}>
              <Text style={[styles.statusText, { color: getStatusColor(result.status) }]}>
                {result.status === "SAFE" ? "✅" : result.status === "SUSPICIOUS" ? "⚠️" : "🚨"} {result.status}
              </Text>
            </View>

            {/* Score */}
            <Text style={styles.scoreLabel}>Risk Score: {result.score}/100</Text>
            <View style={styles.scoreBarBg}>
              <View
                style={[
                  styles.scoreBarFill,
                  {
                    width: `${result.score}%`,
                    backgroundColor: getScoreBarColor(result.score),
                  },
                ]}
              />
            </View>

            {/* Reason */}
            <Text style={styles.reasonLabel}>Analysis</Text>
            <Text style={styles.reasonText}>{result.reason}</Text>

            {/* URL scan result */}
            {result.url_scanned && (
              <View style={styles.urlBox}>
                <Text style={styles.urlLabel}>URL Scanned</Text>
                <Text style={styles.urlText}>{result.url_scanned}</Text>
                <Text style={[styles.urlFlagged, { color: result.url_flagged ? "#ef4444" : "#22c55e" }]}>
                  {result.url_flagged ? "🚨 Flagged by VirusTotal" : "✅ Clean on VirusTotal"}
                </Text>
              </View>
            )}
          </View>
        )}
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
  header: {
    alignItems: "center",
    marginBottom: 30,
    marginTop: 20,
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#1a1a1a",
    borderColor: "#2a2a2a",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    color: "#ffffff",
    fontSize: 15,
    minHeight: 130,
    textAlignVertical: "top",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  analyzeButton: {
    flex: 1,
    backgroundColor: "#6366f1",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#2a2a2a",
  },
  analyzeButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  resetButton: {
    backgroundColor: "#1a1a1a",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  resetButtonText: {
    color: "#888",
    fontSize: 15,
  },
  errorBox: {
    backgroundColor: "#ef444422",
    borderColor: "#ef4444",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 14,
  },
  resultCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  statusBadge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 16,
  },
  statusText: {
    fontWeight: "bold",
    fontSize: 16,
  },
  scoreLabel: {
    color: "#aaa",
    fontSize: 13,
    marginBottom: 8,
  },
  scoreBarBg: {
    backgroundColor: "#2a2a2a",
    borderRadius: 999,
    height: 10,
    marginBottom: 20,
    overflow: "hidden",
  },
  scoreBarFill: {
    height: "100%",
    borderRadius: 999,
  },
  reasonLabel: {
    color: "#aaa",
    fontSize: 13,
    marginBottom: 6,
  },
  reasonText: {
    color: "#ffffff",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  urlBox: {
    backgroundColor: "#0f0f0f",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  urlLabel: {
    color: "#888",
    fontSize: 12,
    marginBottom: 4,
  },
  urlText: {
    color: "#6366f1",
    fontSize: 13,
    marginBottom: 6,
  },
  urlFlagged: {
    fontSize: 13,
    fontWeight: "bold",
  },
});
