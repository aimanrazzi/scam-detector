import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";

const BACKEND_URL = "http://192.168.0.14:5000";

export default function QRScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned) return;
    setScanned(true);
    setScanning(false);
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: data }),
      });
      const json = await response.json();
      if (json.error) {
        setError(json.error);
      } else {
        setResult({ ...json, url: data });
      }
    } catch {
      setError("Could not connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setScanned(false);
    setResult(null);
    setError(null);
    setScanning(false);
  };

  const getStatusColor = (status) => {
    if (status === "SAFE") return "#22c55e";
    if (status === "SUSPICIOUS") return "#f59e0b";
    return "#ef4444";
  };

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.permIcon}>📷</Text>
          <Text style={styles.permTitle}>Camera Permission Required</Text>
          <Text style={styles.permSubtitle}>Allow camera access to scan QR codes</Text>
          <TouchableOpacity style={styles.permButton} onPress={requestPermission}>
            <Text style={styles.permButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>QR Code Scanner</Text>
        <Text style={styles.subtitle}>Scan a QR code to check if the link is safe</Text>
      </View>

      {scanning ? (
        <View style={styles.cameraBox}>
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          />
          <View style={styles.overlay}>
            <View style={styles.scanFrame} />
          </View>
          <TouchableOpacity style={styles.cancelButton} onPress={() => setScanning(false)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.content}>
          {!result && !loading && !error && (
            <View style={styles.centered}>
              <Text style={styles.qrIcon}>⬛</Text>
              <Text style={styles.instructionText}>Tap the button below to scan a QR code</Text>
              <TouchableOpacity style={styles.scanButton} onPress={() => { setScanning(true); setScanned(false); }}>
                <Text style={styles.scanButtonText}>📷 Start Scanning</Text>
              </TouchableOpacity>
            </View>
          )}

          {loading && (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color="#6366f1" />
              <Text style={styles.loadingText}>Analyzing QR code...</Text>
            </View>
          )}

          {error && (
            <View style={styles.centered}>
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
              <TouchableOpacity style={styles.scanButton} onPress={reset}>
                <Text style={styles.scanButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}

          {result && (
            <View style={styles.resultContainer}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(result.status) + "22", borderColor: getStatusColor(result.status) }]}>
                <Text style={[styles.statusText, { color: getStatusColor(result.status) }]}>
                  {result.status === "SAFE" ? "✅ SAFE" : result.status === "SUSPICIOUS" ? "⚠️ SUSPICIOUS" : "🚨 SCAM DETECTED"}
                </Text>
              </View>
              <Text style={styles.scoreText}>Risk Score: {result.score}/100</Text>
              <View style={styles.scoreBarBg}>
                <View style={[styles.scoreBarFill, { width: `${result.score}%`, backgroundColor: getStatusColor(result.status) }]} />
              </View>
              <Text style={styles.urlLabel}>QR Code URL</Text>
              <Text style={styles.urlText} numberOfLines={3}>{result.url}</Text>
              <Text style={styles.reasonLabel}>What we found</Text>
              <Text style={styles.reasonText}>{result.reason}</Text>
              <TouchableOpacity style={styles.scanButton} onPress={reset}>
                <Text style={styles.scanButtonText}>Scan Another</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f0f" },
  header: { padding: 20, paddingBottom: 10 },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff", marginTop: 10 },
  subtitle: { fontSize: 14, color: "#888", marginTop: 4 },
  cameraBox: { flex: 1, position: "relative" },
  camera: { flex: 1 },
  overlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  scanFrame: {
    width: 220,
    height: 220,
    borderWidth: 2,
    borderColor: "#6366f1",
    borderRadius: 12,
  },
  cancelButton: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    backgroundColor: "#1a1a1a",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  cancelText: { color: "#fff", fontSize: 15 },
  content: { flex: 1, padding: 20 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  qrIcon: { fontSize: 64, marginBottom: 8 },
  instructionText: { color: "#888", fontSize: 14, textAlign: "center" },
  scanButton: {
    backgroundColor: "#6366f1",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  scanButtonText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  loadingText: { color: "#aaa", marginTop: 12 },
  errorBox: {
    backgroundColor: "#ef444422",
    borderColor: "#ef4444",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    width: "100%",
  },
  errorText: { color: "#ef4444", fontSize: 14 },
  resultContainer: { paddingTop: 10 },
  statusBadge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 16,
  },
  statusText: { fontWeight: "bold", fontSize: 16 },
  scoreText: { color: "#aaa", fontSize: 13, marginBottom: 8 },
  scoreBarBg: {
    backgroundColor: "#2a2a2a",
    borderRadius: 999,
    height: 10,
    marginBottom: 20,
    overflow: "hidden",
  },
  scoreBarFill: { height: "100%", borderRadius: 999 },
  urlLabel: { color: "#888", fontSize: 12, marginBottom: 4 },
  urlText: { color: "#6366f1", fontSize: 13, marginBottom: 16 },
  reasonLabel: { color: "#888", fontSize: 12, marginBottom: 6 },
  reasonText: { color: "#fff", fontSize: 14, lineHeight: 22, marginBottom: 20 },
  permIcon: { fontSize: 48, marginBottom: 12 },
  permTitle: { fontSize: 18, fontWeight: "bold", color: "#fff", marginBottom: 8 },
  permSubtitle: { fontSize: 14, color: "#888", marginBottom: 24, textAlign: "center" },
  permButton: {
    backgroundColor: "#6366f1",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  permButtonText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
});
