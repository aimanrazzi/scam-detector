import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Image,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BACKEND_URL = "http://192.168.0.14:5000"; // Your PC's local IP

export default function HomeScreen() {
  const [inputText, setInputText] = useState("");
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Permission to access photos is required.");
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      base64: true,
      quality: 0.8,
    });
    if (!picked.canceled) {
      setImage(picked.assets[0]);
      setInputText("");
      setResult(null);
      setError(null);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError("Permission to use camera is required.");
      return;
    }
    const taken = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.8,
    });
    if (!taken.canceled) {
      setImage(taken.assets[0]);
      setInputText("");
      setResult(null);
      setError(null);
    }
  };

  const analyze = async () => {
    if (!inputText.trim() && !image) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      let body;
      let headers;

      if (image) {
        body = JSON.stringify({
          image: image.base64,
          mime_type: image.mimeType || "image/jpeg",
        });
        headers = { "Content-Type": "application/json" };
      } else {
        body = JSON.stringify({ text: inputText.trim() });
        headers = { "Content-Type": "application/json" };
      }

      const response = await fetch(`${BACKEND_URL}/analyze`, {
        method: "POST",
        headers,
        body,
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
        // Save to history
        const entry = {
          input: image ? "[Screenshot]" : inputText.trim(),
          status: data.status,
          score: data.score,
          reason: data.reason,
          date: new Date().toLocaleString("en-MY"),
        };
        const stored = await AsyncStorage.getItem("scan_history");
        const history = stored ? JSON.parse(stored) : [];
        history.push(entry);
        if (history.length > 50) history.shift(); // keep last 50
        await AsyncStorage.setItem("scan_history", JSON.stringify(history));
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
    setImage(null);
    setResult(null);
    setError(null);
  };

  const shareResult = async () => {
    if (!result) return;
    const icon = result.status === "SAFE" ? "✅" : result.status === "SUSPICIOUS" ? "⚠️" : "🚨";
    const message = `${icon} ${result.status} — Risk Score: ${result.score}/100\n\n${result.reason}\n\nChecked with Scam Detector App`;
    await Share.share({ message });
  };

  const canAnalyze = (inputText.trim() || image) && !loading;

  return (
    <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0f0f0f" />
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerIcon}>🛡️</Text>
            <Text style={styles.title}>Scam Detector</Text>
            <Text style={styles.subtitle}>Check if a message, link, phone number, job offer, or screenshot is a scam</Text>
          </View>

          {/* Image preview */}
          {image && (
            <View style={styles.imagePreviewBox}>
              <Image source={{ uri: image.uri }} style={styles.imagePreview} resizeMode="cover" />
              <TouchableOpacity style={styles.removeImage} onPress={() => setImage(null)}>
                <Text style={styles.removeImageText}>✕ Remove</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Text Input — hidden if image selected */}
          {!image && (
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Paste a suspicious message, URL, phone number, IP address, or job offer..."
                placeholderTextColor="#555"
                multiline
                value={inputText}
                onChangeText={setInputText}
              />
            </View>
          )}

          {/* Image buttons */}
          {!image && (
            <View style={styles.imageButtonRow}>
              <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                <Text style={styles.imageButtonText}>🖼️ Upload Screenshot</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
                <Text style={styles.imageButtonText}>📷 Take Photo</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Analyze / Clear buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.analyzeButton, !canAnalyze && styles.disabledButton]}
              onPress={analyze}
              disabled={!canAnalyze}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.analyzeButtonText}>Check Now</Text>
              )}
            </TouchableOpacity>

            {(result || error || image) && (
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
              <View style={styles.statusRow}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(result.status) + "22", borderColor: getStatusColor(result.status) }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(result.status) }]}>
                    {result.status === "SAFE" ? "✅ SAFE" : result.status === "SUSPICIOUS" ? "⚠️ SUSPICIOUS" : "🚨 SCAM DETECTED"}
                  </Text>
                </View>
                <TouchableOpacity style={styles.shareButton} onPress={shareResult}>
                  <Text style={styles.shareButtonText}>⬆ Share</Text>
                </TouchableOpacity>
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
              <Text style={styles.reasonLabel}>What we found</Text>
              <Text style={styles.reasonText}>{result.reason}</Text>

              {/* URL scan result */}
              {result.url_scanned && (
                <View style={styles.detailBox}>
                  <Text style={styles.detailLabel}>Link Checked</Text>
                  <Text style={styles.detailValue}>{result.url_scanned}</Text>
                  <Text style={[styles.detailStatus, { color: result.url_flagged ? "#ef4444" : "#22c55e" }]}>
                    {result.url_flagged ? "🚨 Flagged as dangerous by VirusTotal" : "✅ No threats found on VirusTotal"}
                  </Text>
                </View>
              )}

              {/* IP scan result */}
              {result.ip_scanned && (
                <View style={[styles.detailBox, { marginTop: 10 }]}>
                  <Text style={styles.detailLabel}>IP Address Checked</Text>
                  <Text style={styles.detailValue}>{result.ip_scanned}</Text>
                  <Text style={[styles.detailStatus, { color: result.ip_flagged ? "#ef4444" : "#22c55e" }]}>
                    {result.ip_flagged ? "🚨 Flagged as dangerous by VirusTotal" : "✅ No threats found on VirusTotal"}
                  </Text>
                </View>
              )}

              {/* Phone result */}
              {result.phone_scanned && (
                <View style={[styles.detailBox, { marginTop: 10 }]}>
                  <Text style={styles.detailLabel}>Phone Number Checked</Text>
                  <Text style={styles.detailValue}>{result.phone_scanned}</Text>
                  <Text style={[styles.detailStatus, { color: result.phone_valid ? "#22c55e" : "#ef4444" }]}>
                    {result.phone_valid ? `✅ ${result.phone_info}` : "❌ Invalid or unrecognized number"}
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
    lineHeight: 20,
  },
  imagePreviewBox: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    padding: 12,
  },
  imagePreview: {
    width: 160,
    height: 160,
    borderRadius: 8,
  },
  removeImage: {
    backgroundColor: "#1a1a1a",
    padding: 10,
    alignItems: "center",
  },
  removeImageText: {
    color: "#ef4444",
    fontSize: 13,
  },
  inputContainer: {
    marginBottom: 12,
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
  imageButtonRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  imageButton: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  imageButtonText: {
    color: "#aaa",
    fontSize: 13,
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
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  shareButton: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  shareButtonText: {
    color: "#aaa",
    fontSize: 13,
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
  detailBox: {
    backgroundColor: "#0f0f0f",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  detailLabel: {
    color: "#888",
    fontSize: 12,
    marginBottom: 4,
  },
  detailValue: {
    color: "#6366f1",
    fontSize: 13,
    marginBottom: 6,
  },
  detailStatus: {
    fontSize: 13,
    fontWeight: "bold",
  },
});
