import React, { useState, useRef, useEffect } from "react"; // eslint-disable-line
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
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLang } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { translations } from "../utils/translations";
import LanguageSelector from "../components/LanguageSelector";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

import { BACKEND_URL } from "../config";

export default function HomeScreen({ embedded = false }) {
  const { lang } = useLang();
  const t = translations[lang] || translations.en;
  const { theme } = useTheme();
  const { user } = useAuth();
  const [inputText, setInputText] = useState("");
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [slowLoad, setSlowLoad] = useState(false);
  const [error, setError] = useState(null);
  const scoreAnim = useRef(new Animated.Value(0)).current;
  const slowTimer = useRef(null);

  useEffect(() => {
    if (result) {
      Animated.timing(scoreAnim, {
        toValue: result.score,
        duration: 800,
        useNativeDriver: false,
      }).start();
    } else {
      scoreAnim.setValue(0);
    }
  }, [result]);

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
    setSlowLoad(false);
    setResult(null);
    setError(null);

    // Show "waking up server" hint after 6 seconds
    slowTimer.current = setTimeout(() => setSlowLoad(true), 6000);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    try {
      let body;
      const headers = { "Content-Type": "application/json" };

      if (image) {
        body = JSON.stringify({ image: image.base64, mime_type: image.mimeType || "image/jpeg", lang });
      } else {
        body = JSON.stringify({ text: inputText.trim(), lang });
      }

      const response = await fetch(`${BACKEND_URL}/analyze`, {
        method: "POST",
        headers,
        body,
        signal: controller.signal,
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
        const entry = {
          input: image ? "[Screenshot]" : inputText.trim(),
          status: data.status,
          score: data.score,
          reason: data.reason,
          date: new Date().toISOString(),
        };
        if (user) {
          // Logged in — save to Firestore
          await addDoc(collection(db, "scans", user.uid, "entries"), entry);
        } else {
          // Guest — save to local AsyncStorage
          const stored = await AsyncStorage.getItem("scan_history");
          const history = stored ? JSON.parse(stored) : [];
          history.push(entry);
          if (history.length > 50) history.shift();
          await AsyncStorage.setItem("scan_history", JSON.stringify(history));
        }
      }
    } catch (err) {
      if (err.name === "AbortError") {
        setError("Request timed out. The server may be starting up — please try again.");
      } else {
        setError("Could not connect to server. Check your internet connection.");
      }
    } finally {
      clearTimeout(timeout);
      clearTimeout(slowTimer.current);
      setLoading(false);
      setSlowLoad(false);
    }
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

  const Wrap = embedded ? View : SafeAreaView;

  return (
    <Wrap style={styles.container}>
        <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.background} />
        {!embedded && <LanguageSelector />}
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <LinearGradient
            colors={theme.isDark ? ["#1e1b4b", "#0f0f0f"] : ["#ede9fe", "#f5f5f5"]}
            style={styles.header}
          >
            <Text style={styles.headerIcon}>🛡️</Text>
            <Text style={styles.title}>{t.title}</Text>
            <Text style={styles.subtitle}>{t.subtitle}</Text>
          </LinearGradient>

          {/* Input Card */}
          <View style={styles.inputCard}>
            {/* Image preview */}
            {image && (
              <View style={styles.imagePreviewBox}>
                <Image source={{ uri: image.uri }} style={styles.imagePreview} resizeMode="cover" />
                <TouchableOpacity style={styles.removeImage} onPress={() => setImage(null)}>
                  <Text style={styles.removeImageText}>✕ {t.removeImage}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Text Input */}
            {!image && (
              <TextInput
                style={styles.input}
                placeholder={t.placeholder}
                placeholderTextColor={theme.subtext}
                multiline
                value={inputText}
                onChangeText={setInputText}
              />
            )}

            {/* Divider */}
            {!image && <View style={styles.divider} />}

            {/* Image buttons */}
            {!image && (
              <View style={styles.imageButtonRow}>
                <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                  <Text style={styles.imageButtonText} numberOfLines={1} adjustsFontSizeToFit>🖼️ {t.uploadScreenshot}</Text>
                </TouchableOpacity>
                <View style={{ width: 1, backgroundColor: theme.border }} />
                <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
                  <Text style={styles.imageButtonText} numberOfLines={1} adjustsFontSizeToFit>📷 {t.takePhoto}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>{/* end inputCard */}

          {/* Analyze / Clear buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.analyzeButtonWrap, !canAnalyze && { opacity: 0.45 }]}
              onPress={analyze}
              disabled={!canAnalyze}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#818cf8", "#6366f1", "#4f46e5"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.analyzeButton}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.analyzeButtonText}>🔍 {t.checkNow}</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {(result || error || image) && (
              <TouchableOpacity style={styles.resetButton} onPress={reset}>
                <Text style={styles.resetButtonText}>{t.clear}</Text>
              </TouchableOpacity>
            )}
          </View>

          {slowLoad && (
            <View style={styles.slowBox}>
              <ActivityIndicator size="small" color={theme.accent} style={{ marginRight: 8 }} />
              <Text style={[styles.slowText, { color: theme.subtext }]}>
                ⏳ Waking up server, please wait…
              </Text>
            </View>
          )}

          {/* Error */}
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Result */}
          {result && (
            <View style={styles.resultCard}>
              {/* Gradient status banner */}
              <LinearGradient
                colors={
                  result.status === "SAFE"
                    ? ["#16a34a", "#22c55e"]
                    : result.status === "SUSPICIOUS"
                    ? ["#b45309", "#f59e0b"]
                    : ["#991b1b", "#ef4444"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.statusBanner}
              >
                <Text style={styles.statusBannerText}>
                  {result.status === "SAFE" ? `✅ ${t.safe}` : result.status === "SUSPICIOUS" ? `⚠️ ${t.suspicious}` : `🚨 ${t.scamDetected}`}
                </Text>
                <TouchableOpacity onPress={shareResult}>
                  <Text style={styles.shareButtonText}>⬆ {t.shareResult}</Text>
                </TouchableOpacity>
              </LinearGradient>

              {/* Animated score bar */}
              <View style={styles.scoreSection}>
                <Text style={styles.scoreLabel}>{t.riskScore}: <Text style={{ color: getScoreBarColor(result.score), fontWeight: "bold" }}>{result.score}/100</Text></Text>
                <View style={styles.scoreBarBg}>
                  <Animated.View
                    style={[
                      styles.scoreBarFill,
                      {
                        width: scoreAnim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }),
                        backgroundColor: getScoreBarColor(result.score),
                      },
                    ]}
                  />
                </View>
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
                  {result.dataset_label && (
                    <Text style={[styles.detailStatus, { color: theme.danger }]}>
                      🗄️ {`Matched ${result.dataset_label} in threat database`}
                    </Text>
                  )}
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
                  <Text style={styles.detailValue}>
                    {result.phone_international || result.phone_scanned}
                  </Text>

                  {result.phone_valid ? (
                    <View style={styles.phoneDetailGrid}>
                      {result.phone_country ? (
                        <View style={styles.phoneDetailRow}>
                          <Text style={styles.phoneDetailIcon}>🌍</Text>
                          <Text style={styles.phoneDetailKey}>{t.phoneCountry || "Country"}</Text>
                          <Text style={styles.phoneDetailVal}>
                            {result.phone_country}{result.phone_country_code ? ` (${result.phone_country_code})` : ""}
                          </Text>
                        </View>
                      ) : null}
                      {result.phone_location ? (
                        <View style={styles.phoneDetailRow}>
                          <Text style={styles.phoneDetailIcon}>📍</Text>
                          <Text style={styles.phoneDetailKey}>{t.phoneRegion || "Region"}</Text>
                          <Text style={styles.phoneDetailVal}>{result.phone_location}</Text>
                        </View>
                      ) : null}
                      {result.phone_carrier ? (
                        <View style={styles.phoneDetailRow}>
                          <Text style={styles.phoneDetailIcon}>📡</Text>
                          <Text style={styles.phoneDetailKey}>{t.phoneCarrier || "Carrier"}</Text>
                          <Text style={styles.phoneDetailVal}>{result.phone_carrier}</Text>
                        </View>
                      ) : null}
                      {result.phone_line_type ? (
                        <View style={styles.phoneDetailRow}>
                          <Text style={styles.phoneDetailIcon}>📱</Text>
                          <Text style={styles.phoneDetailKey}>{t.phoneType || "Type"}</Text>
                          <Text style={[styles.phoneDetailVal, { textTransform: "capitalize" }]}>{result.phone_line_type}</Text>
                        </View>
                      ) : null}
                    </View>
                  ) : (
                    <Text style={[styles.detailStatus, { color: theme.danger }]}>
                      ❌ {t.invalidPhone}
                    </Text>
                  )}

                  {result.semak_mule_found != null && (
                    <View style={[styles.semakMuleResult, {
                      backgroundColor: result.semak_mule_found ? theme.danger + "22" : theme.safe + "22",
                      borderColor: result.semak_mule_found ? theme.danger : theme.safe,
                    }]}>
                      <Text style={{ fontSize: 16 }}>{result.semak_mule_found ? "🚨" : "✅"}</Text>
                      <Text style={[styles.semakMuleResultText, { color: result.semak_mule_found ? theme.danger : theme.safe }]}>
                        {result.semak_mule_found
                          ? `${result.semak_mule_reports} scam report(s) on PDRM Semak Mule`
                          : "No reports on PDRM Semak Mule"}
                      </Text>
                    </View>
                  )}
                </View>
              )}


              {/* Social media result */}
              {result.social_handle && (
                <View style={[styles.detailBox, { marginTop: 10 }]}>
                  <Text style={styles.detailLabel}>
                    {result.social_platform && result.social_platform !== "Unknown"
                      ? `${result.social_platform} Account`
                      : "Social Media Account"}
                  </Text>
                  <Text style={styles.detailValue}>@{result.social_handle}</Text>
                  {result.social_found_reports != null && (
                    <View style={[styles.semakMuleResult, {
                      backgroundColor: result.social_found_reports ? theme.danger + "22" : theme.safe + "22",
                      borderColor: result.social_found_reports ? theme.danger : theme.safe,
                    }]}>
                      <Text style={{ fontSize: 16 }}>{result.social_found_reports ? "🚨" : "✅"}</Text>
                      <Text style={[styles.semakMuleResultText, {
                        color: result.social_found_reports ? theme.danger : theme.safe,
                      }]}>
                        {result.social_found_reports
                          ? `Found in ${result.social_report_count} scam-related result(s) online`
                          : "No scam reports found online"}
                      </Text>
                    </View>
                  )}
                  {result.social_snippets && result.social_snippets.map((s, i) => (
                    <Text key={i} style={[styles.detailLabel, { marginTop: 6, color: theme.danger }]} numberOfLines={2}>• {s}</Text>
                  ))}
                </View>
              )}

              {/* Email result */}
              {result.email_scanned && (
                <View style={[styles.detailBox, { marginTop: 10 }]}>
                  <Text style={styles.detailLabel}>📧 Email Checked</Text>
                  <Text style={styles.detailValue}>{result.email_scanned}</Text>
                  {result.email_semak_found != null && (
                    <View style={[styles.semakMuleResult, {
                      backgroundColor: result.email_semak_found ? theme.danger + "22" : theme.safe + "22",
                      borderColor: result.email_semak_found ? theme.danger : theme.safe,
                    }]}>
                      <Text style={{ fontSize: 16 }}>{result.email_semak_found ? "🚨" : "✅"}</Text>
                      <Text style={[styles.semakMuleResultText, { color: result.email_semak_found ? theme.danger : theme.safe }]}>
                        {result.email_semak_found
                          ? `${result.email_semak_reports} scam report(s) on PDRM Semak Mule`
                          : "No reports on PDRM Semak Mule"}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}
        </ScrollView>
    </Wrap>
  );
}

const makeStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scroll: {
    padding: 20,
    paddingBottom: 110,
  },
  header: {
    alignItems: "center",
    paddingTop: 28,
    paddingBottom: 28,
    paddingHorizontal: 20,
    marginHorizontal: -20,
    marginBottom: 20,
  },
  headerIcon: {
    fontSize: 56,
    marginBottom: 10,
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    color: theme.text,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: theme.subtext,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  inputCard: {
    backgroundColor: theme.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 14,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  divider: {
    height: 1,
    backgroundColor: theme.border,
    marginHorizontal: 0,
  },
  imagePreviewBox: {
    alignItems: "center",
    padding: 16,
  },
  imagePreview: {
    width: 160,
    height: 160,
    borderRadius: 12,
  },
  removeImage: {
    padding: 10,
    alignItems: "center",
  },
  removeImageText: {
    color: theme.danger,
    fontSize: 13,
  },
  input: {
    backgroundColor: "transparent",
    padding: 18,
    color: theme.text,
    fontSize: 15,
    minHeight: 130,
    textAlignVertical: "top",
  },
  imageButtonRow: {
    flexDirection: "row",
  },
  imageButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderTopWidth: 0,
  },
  imageButtonText: {
    color: theme.accent,
    fontSize: 13,
    fontWeight: "600",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  analyzeButtonWrap: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  analyzeButton: {
    paddingVertical: 15,
    alignItems: "center",
    borderRadius: 14,
  },
  analyzeButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  slowBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  slowText: {
    fontSize: 13,
    flex: 1,
  },
  statusBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  statusBannerText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  shareButtonText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontWeight: "600",
  },
  scoreSection: {
    marginBottom: 16,
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
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.border,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
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
    backgroundColor: theme.border,
    borderRadius: 999,
    height: 12,
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
  phoneDetailGrid: {
    marginTop: 10,
    gap: 6,
  },
  phoneDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: theme.background,
    borderRadius: 6,
  },
  phoneDetailIcon: {
    fontSize: 14,
    width: 22,
  },
  phoneDetailKey: {
    color: theme.subtext,
    fontSize: 12,
    fontWeight: "600",
    width: 60,
  },
  phoneDetailVal: {
    color: theme.text,
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  semakMuleResult: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  semakMuleResultText: {
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
  },
  semakMuleButton: {
    marginTop: 8,
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
