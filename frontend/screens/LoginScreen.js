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
  StatusBar,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../firebase";
import { darkTheme } from "../context/ThemeContext";
import { useLang } from "../context/LanguageContext";

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

const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "ms", label: "MY" },
  { code: "zh", label: "ZH" },
  { code: "ta", label: "TA" },
];

export default function LoginScreen() {
  const theme = darkTheme;
  const { lang, changeLang } = useLang();
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

  return (
    <LinearGradient colors={theme.backgroundGradient} style={{ flex: 1 }}>
      <StatusBar barStyle={theme.statusBar} />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24 }} keyboardShouldPersistTaps="handled">

            {/* Top bar */}
            <View style={S.topBar}>
              <Text style={S.logo}>Combat.</Text>
              <TouchableOpacity style={S.langPill} onPress={() => {
                const idx = LANGUAGES.findIndex(l => l.code === lang);
                changeLang(LANGUAGES[(idx + 1) % LANGUAGES.length].code);
              }}>
                <Text style={S.langText}>{LANGUAGES.find(l => l.code === lang)?.label || "EN"} ▾</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flex: 1, justifyContent: "center", paddingTop: 20, paddingBottom: 40 }}>
              {/* Toggle */}
              <View style={S.toggleWrap}>
                <TouchableOpacity
                  style={[S.toggleBtn, mode === "login" && S.toggleActive]}
                  onPress={() => { setMode("login"); setError(""); }}
                >
                  <Text style={[S.toggleText, { color: mode === "login" ? "#fff" : "rgba(255,255,255,0.5)" }]}>
                    Log in
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[S.toggleBtn, mode === "signup" && S.toggleActive]}
                  onPress={() => { setMode("signup"); setError(""); }}
                >
                  <Text style={[S.toggleText, { color: mode === "signup" ? "#fff" : "rgba(255,255,255,0.5)" }]}>
                    Sign Up
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Name (signup only) */}
              {mode === "signup" && (
                <View style={S.inputWrap}>
                  <Text style={S.inputLabel}>Full Name</Text>
                  <TextInput
                    style={S.input}
                    placeholder="Your name"
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>
              )}

              {/* Email */}
              <View style={S.inputWrap}>
                <Text style={S.inputLabel}>Email</Text>
                <TextInput
                  style={S.input}
                  placeholder="you@email.com"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              {/* Password */}
              <View style={S.inputWrap}>
                <Text style={S.inputLabel}>Password</Text>
                <TextInput
                  style={S.input}
                  placeholder="••••••••"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
                {mode === "login" && (
                  <TouchableOpacity onPress={async () => {
                    if (!email) { setError("Enter your email first."); return; }
                    try {
                      await sendPasswordResetEmail(auth, email.trim());
                      setError("");
                      Alert.alert("Email sent", "Check your inbox for a password reset link.");
                    } catch (e) {
                      setError("Could not send reset email. Check your email address.");
                    }
                  }}>
                    <Text style={S.forgotText}>forgot password</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Error */}
              {error ? <Text style={S.error}>{error}</Text> : null}

              {/* Submit */}
              <TouchableOpacity onPress={handleSubmit} disabled={loading} activeOpacity={0.85} style={S.btn}>
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={S.btnText}>{mode === "login" ? "Log in" : "Create Account"}</Text>
                }
              </TouchableOpacity>

              {/* Divider */}
              <View style={S.divider}>
                <View style={S.dividerLine} />
                <Text style={S.dividerText}>OR</Text>
                <View style={S.dividerLine} />
              </View>

              {/* Google */}
              <TouchableOpacity style={S.googleBtn} onPress={handleGoogle} disabled={loading} activeOpacity={0.85}>
                <Text style={S.googleBtnText}>Continue with Google</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const S = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    marginBottom: 8,
  },
  logo: { fontSize: 26, fontWeight: "900", color: "#fff", letterSpacing: -0.5 },
  langPill: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  langText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  toggleWrap: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    padding: 4,
    marginBottom: 28,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  toggleActive: {
    backgroundColor: "rgba(139, 92, 246, 0.55)",
  },
  toggleText: { fontWeight: "700", fontSize: 15 },
  inputWrap: { marginBottom: 16 },
  inputLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#fff",
    fontSize: 15,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.2)",
  },
  forgotText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    textAlign: "right",
    marginTop: 6,
  },
  error: { color: "#f87171", fontSize: 13, marginBottom: 12, textAlign: "center" },
  btn: {
    backgroundColor: "#7c3aed",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.15)" },
  dividerText: { color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: "600" },
  googleBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  googleBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
});
