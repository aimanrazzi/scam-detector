import React, { useState } from "react"; // eslint-disable-line
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
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLang } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { translations } from "../utils/translations";
import LanguageSelector from "../components/LanguageSelector";

const BACKEND_URL = "http://192.168.0.14:5000"; // Your PC's local IP

export default function HomeScreen() {
  const { lang } = useLang();
  const t = translations[lang] || translations.en;
  const { theme } = useTheme();
  const [inputText, setInputText] = useState("");
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const styles = makeStyles(theme);

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
          lang,
        });
        headers = { "Content-Type": "application/json" };
      } else {
        body = JSON.stringify({ text: inputText.trim(), lang });
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
    if (status === "SAFE") return theme.safe;
    if (status === "SUSPICIOUS") return theme.warning;
    if (status === "SCAM") return theme.danger;
    return theme.text;
  };

  const getScoreBarColor = (score) => {
    if (score <= 30) return theme.safe;
    if (score <= 69) return theme.warning;
    return theme.danger;
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
        <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.background} />
        {/* Language selector — fixed at top, outside scroll */}
        <LanguageSelector />
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerIcon}>🛡️</Text>
            <Text style={styles.title}>{t.title}</Text>
            <Text style={styles.subtitle}>{t.subtitle}</Text>
          </View>

          {/* Image preview */}
          {image && (
            <View style={styles.imagePreviewBox}>
              <Image source={{ uri: image.uri }} style={styles.imagePreview} resizeMode="cover" />
              <TouchableOpacity style={styles.removeImage} onPress={() => setImage(null)}>
                <Text style={styles.removeImageText}>✕ {t.removeImage}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Text Input — hidden if image selected */}
          {!image && (
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder={t.placeholder}
                placeholderTextColor={theme.subtext}
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
                <Text style={styles.imageButtonText}>🖼️ {t.uploadScreenshot}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
                <Text style={styles.imageButtonText}>📷 {t.takePhoto}</Text>
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
                <Text style={styles.analyzeButtonText}>{t.checkNow}</Text>
              )}
            </TouchableOpacity>

            {(result || error || image) && (
              <TouchableOpacity style={styles.resetButton} onPress={reset}>
                <Text style={styles.resetButtonText}>{t.clear}</Text>
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
                    {result.status === "SAFE" ? `✅ ${t.safe}` : result.status === "SUSPICIOUS" ? `⚠️ ${t.suspicious}` : `🚨 ${t.scamDetected}`}
                  </Text>
                </View>
                <TouchableOpacity style={styles.shareButton} onPress={shareResult}>
                  <Text style={styles.shareButtonText}>⬆ {t.shareResult}</Text>
                </TouchableOpacity>
              </View>

              {/* Score */}
              <Text style={styles.scoreLabel}>{t.riskScore}: {result.score}/100</Text>
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
              <Text style={styles.reasonLabel}>{t.whatWeFound}</Text>
              {result.findings && result.findings.length > 0 ? (
                <View style={styles.findingsList}>
                  {result.findings.map((f, i) => (
                    <View key={i} style={styles.findingRow}>
                      <Text style={styles.findingBullet}>•</Text>
                      <Text style={styles.findingText}>{f}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.reasonText}>{result.reason}</Text>
              )}

              {/* URL scan result */}
              {result.url_scanned && (
                <View style={styles.detailBox}>
                  <Text style={styles.detailLabel}>{t.linkChecked}</Text>
                  <Text style={styles.detailValue}>{result.url_scanned}</Text>
                  <Text style={[styles.detailStatus, { color: result.url_flagged ? theme.danger : theme.safe }]}>
                    {result.url_flagged ? `🚨 ${t.flaggedVT}` : `✅ ${t.safeVT}`}
                  </Text>
                </View>
              )}

              {/* IP scan result */}
              {result.ip_scanned && (
                <View style={[styles.detailBox, { marginTop: 10 }]}>
                  <Text style={styles.detailLabel}>{t.ipChecked}</Text>
                  <Text style={styles.detailValue}>{result.ip_scanned}</Text>
                  <Text style={[styles.detailStatus, { color: result.ip_flagged ? theme.danger : theme.safe }]}>
                    {result.ip_flagged ? `🚨 ${t.flaggedVT}` : `✅ ${t.safeVT}`}
                  </Text>
                </View>
              )}

              {/* Phone result */}
              {result.phone_scanned && (
                <View style={[styles.detailBox, { marginTop: 10 }]}>
                  <Text style={styles.detailLabel}>{t.phoneChecked}</Text>
                  <Text style={styles.detailValue}>{result.phone_scanned}</Text>
                  <Text style={[styles.detailStatus, { color: result.phone_valid ? theme.safe : theme.danger }]}>
                    {result.phone_valid ? `✅ ${result.phone_info}` : `❌ ${t.invalidPhone}`}
                  </Text>
                  {result.semak_mule_url && (
                    <TouchableOpacity
                      style={styles.semakMuleButton}
                      onPress={() => Linking.openURL(result.semak_mule_url)}
                    >
                      <Text style={styles.semakMuleText}>🔍 {t.checkSemakMule}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )}
        </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
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
    color: theme.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: theme.subtext,
    textAlign: "center",
    lineHeight: 20,
  },
  imagePreviewBox: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
    backgroundColor: theme.surface,
    padding: 12,
  },
  imagePreview: {
    width: 160,
    height: 160,
    borderRadius: 8,
  },
  removeImage: {
    backgroundColor: theme.surface,
    padding: 10,
    alignItems: "center",
  },
  removeImageText: {
    color: theme.danger,
    fontSize: 13,
  },
  inputContainer: {
    marginBottom: 12,
  },
  input: {
    backgroundColor: theme.surface,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    color: theme.text,
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
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  imageButtonText: {
    color: theme.subtext,
    fontSize: 13,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  analyzeButton: {
    flex: 1,
    backgroundColor: theme.accent,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: theme.surfaceHigh,
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
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  shareButtonText: {
    color: theme.subtext,
    fontSize: 13,
  },
  resetButton: {
    backgroundColor: theme.surface,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.border,
  },
  resetButtonText: {
    color: theme.subtext,
    fontSize: 15,
  },
  errorBox: {
    backgroundColor: theme.danger + "22",
    borderColor: theme.danger,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  errorText: {
    color: theme.danger,
    fontSize: 14,
  },
  resultCard: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.border,
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
    color: theme.subtext,
    fontSize: 13,
    marginBottom: 8,
  },
  scoreBarBg: {
    backgroundColor: theme.surfaceHigh,
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
    color: theme.subtext,
    fontSize: 13,
    marginBottom: 6,
  },
  reasonText: {
    color: theme.text,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  findingsList: {
    marginBottom: 16,
  },
  findingRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  findingBullet: {
    color: theme.accent,
    fontSize: 15,
    marginRight: 8,
    lineHeight: 22,
  },
  findingText: {
    color: theme.text,
    fontSize: 14,
    lineHeight: 22,
    flex: 1,
  },
  detailBox: {
    backgroundColor: theme.background,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.border,
  },
  detailLabel: {
    color: theme.subtext,
    fontSize: 12,
    marginBottom: 4,
  },
  detailValue: {
    color: theme.accent,
    fontSize: 13,
    marginBottom: 6,
  },
  detailStatus: {
    fontSize: 13,
    fontWeight: "bold",
  },
  semakMuleButton: {
    marginTop: 10,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.accent,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  semakMuleText: {
    color: theme.accent,
    fontSize: 13,
    fontWeight: "bold",
  },
});
