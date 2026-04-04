import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth } from "../firebase";
import { useTheme } from "../context/ThemeContext";

// Google Sign-In — only works in native APK build, not Expo Go
let GoogleSignin = null;
try {
  GoogleSignin = require("@react-native-google-signin/google-signin").GoogleSignin;
  const { statusCodes } = require("@react-native-google-signin/google-signin");
  GoogleSignin.configure({
    webClientId: "414393200615-6nv5qpe6m1t0ssc7d5k4jko6o1bgptbn.apps.googleusercontent.com",
  });
} catch (e) {
  // Not available in Expo Go
}

export default function LoginScreen() {
  const { theme } = useTheme();
  const [mode, setMode] = useState("login"); // "login" or "signup"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogle = async () => {
    if (!GoogleSignin) {
      setError("Google Sign-In is only available in the installed APK, not Expo Go.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const { idToken } = await GoogleSignin.signIn();
      const { GoogleAuthProvider, signInWithCredential } = require("firebase/auth");
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
    } catch (e) {
      setError("Google Sign-In failed. Try email instead.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setError("");
    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }
    if (mode === "signup" && !name) {
      setError("Please enter your name.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(cred.user, { displayName: name.trim() });
      }
    } catch (e) {
      const msg = {
        "auth/invalid-email": "Invalid email address.",
        "auth/user-not-found": "No account found. Please sign up.",
        "auth/wrong-password": "Incorrect password.",
        "auth/email-already-in-use": "Email already registered. Please log in.",
        "auth/weak-password": "Password must be at least 6 characters.",
        "auth/invalid-credential": "Incorrect email or password.",
      }[e.code] || e.message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const styles = makeStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <LinearGradient
            colors={theme.isDark ? ["#1e1b4b", "#0f0f1a"] : ["#ede9fe", "#ffffff"]}
            style={styles.header}
          >
            <Text style={styles.logo}>🛡️</Text>
            <Text style={[styles.title, { color: theme.text }]}>Scam Detector</Text>
            <Text style={[styles.subtitle, { color: theme.subtext }]}>
              Malaysia's AI-powered scam detection
            </Text>
          </LinearGradient>

          {/* Card */}
          <View style={styles.card}>
            {/* Toggle */}
            <View style={styles.toggle}>
              <TouchableOpacity
                style={[styles.toggleBtn, mode === "login" && styles.toggleActive]}
                onPress={() => { setMode("login"); setError(""); }}
              >
                <Text style={[styles.toggleText, { color: mode === "login" ? theme.accent : theme.subtext }]}>
                  Log In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, mode === "signup" && styles.toggleActive]}
                onPress={() => { setMode("signup"); setError(""); }}
              >
                <Text style={[styles.toggleText, { color: mode === "signup" ? theme.accent : theme.subtext }]}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>

            {/* Name (signup only) */}
            {mode === "signup" && (
              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Your name"
                  placeholderTextColor={theme.subtext}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            )}

            {/* Email */}
            <View style={styles.inputWrap}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="you@email.com"
                placeholderTextColor={theme.subtext}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            {/* Password */}
            <View style={styles.inputWrap}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={theme.subtext}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {/* Error */}
            {error ? <Text style={styles.error}>{error}</Text> : null}

            {/* Submit button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
              style={styles.btnWrap}
            >
              <LinearGradient
                colors={["#818cf8", "#6366f1", "#4f46e5"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btn}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnText}>{mode === "login" ? "Log In" : "Create Account"}</Text>
                }
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
              <Text style={[styles.dividerText, { color: theme.subtext }]}>or</Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            </View>

            {/* Google Sign-In */}
            <TouchableOpacity
              style={[styles.googleBtn, { borderColor: theme.border, backgroundColor: theme.background }]}
              onPress={handleGoogle}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.googleIcon}>G</Text>
              <Text style={[styles.googleText, { color: theme.text }]}>Continue with Google</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.footer, { color: theme.subtext }]}>
            🇲🇾 Protecting Malaysians from scams
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: {
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: 40,
    paddingHorizontal: 30,
  },
  logo: { fontSize: 60, marginBottom: 12 },
  title: { fontSize: 26, fontWeight: "800", marginBottom: 6 },
  subtitle: { fontSize: 13, textAlign: "center" },
  card: {
    margin: 20,
    backgroundColor: theme.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.border,
  },
  toggle: {
    flexDirection: "row",
    backgroundColor: theme.background,
    borderRadius: 10,
    padding: 4,
    marginBottom: 24,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  toggleActive: {
    backgroundColor: theme.surface,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: { fontWeight: "700", fontSize: 14 },
  inputWrap: { marginBottom: 16 },
  inputLabel: { color: theme.subtext, fontSize: 12, fontWeight: "600", marginBottom: 6 },
  input: {
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: theme.text,
    fontSize: 15,
  },
  error: { color: "#ef4444", fontSize: 13, marginBottom: 12, textAlign: "center" },
  btnWrap: { borderRadius: 12, overflow: "hidden", marginTop: 8 },
  btn: { paddingVertical: 15, alignItems: "center", borderRadius: 12 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  divider: { flexDirection: "row", alignItems: "center", marginVertical: 16, gap: 10 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 12 },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 13,
  },
  googleIcon: { fontSize: 16, fontWeight: "900", color: "#4285F4" },
  googleText: { fontSize: 15, fontWeight: "600" },
  footer: { textAlign: "center", fontSize: 12, marginTop: 20, marginBottom: 30 },
});
