import React, { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, Pressable, Image,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";
import HomeScreen from "./HomeScreen";
import QRScreen from "./QRScreen";
import ProfileCheckScreen from "./ProfileCheckScreen";
import { BACKEND_URL } from "../config";

const SCAN_TABS = [
  { key: "check",   label: "🔍 Check"   },
  { key: "qr",      label: "⬛ QR Scan"  },
  { key: "profile", label: "👤 Profile"  },
];

const LANGUAGES = [
  { code: "en", label: "🇬🇧 English"  },
  { code: "ms", label: "🇲🇾 Melayu"   },
  { code: "zh", label: "🇨🇳 中文"     },
  { code: "ta", label: "🇮🇳 தமிழ்"    },
];

export default function MainScreen({ navigation }) {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { lang, changeLang } = useLang();
  const [tab, setTab] = useState("check");
  const [langDropdown, setLangDropdown] = useState(false);
  const [serverReady, setServerReady] = useState(false);
  const styles = makeStyles(theme);

  // Ping backend on mount to wake it up before user interacts
  useEffect(() => {
    fetch(`${BACKEND_URL}/health`, { method: "GET" })
      .then(() => setServerReady(true))
      .catch(() => setServerReady(false));
  }, []);

  const initials = user?.displayName
    ? user.displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "?";

  const currentLang = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={styles.appName}>🛡️ ScamShield</Text>
          {!serverReady && (
            <View style={styles.connectingDot} />
          )}
        </View>

        <View style={styles.topRight}>
          {/* Language dropdown button */}
          <TouchableOpacity
            style={[styles.langBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}
            onPress={() => setLangDropdown(true)}
          >
            <Text style={styles.langBtnText}>{currentLang.label.split(" ")[0]}</Text>
            <Text style={[styles.langBtnLabel, { color: theme.subtext }]}>▾</Text>
          </TouchableOpacity>

          {/* Theme toggle */}
          <TouchableOpacity
            style={[styles.iconBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}
            onPress={toggleTheme}
          >
            <Text style={{ fontSize: 16 }}>{theme.isDark ? "☀️" : "🌙"}</Text>
          </TouchableOpacity>

          {/* Avatar → Account */}
          <TouchableOpacity
            style={[styles.avatar, { backgroundColor: theme.accent }]}
            onPress={() => navigation.navigate("Account")}
          >
            {user?.photoURL
              ? <Image source={{ uri: user.photoURL }} style={styles.avatarImg} />
              : <Text style={styles.avatarText}>{initials}</Text>
            }
          </TouchableOpacity>
        </View>
      </View>

      {/* Segment control */}
      <View style={styles.segmentWrap}>
        <View style={styles.segment}>
          {SCAN_TABS.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.segBtn, tab === t.key && { backgroundColor: theme.accent }]}
              onPress={() => setTab(t.key)}
            >
              <Text style={[styles.segText, { color: tab === t.key ? "#fff" : theme.subtext }]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {tab === "check"   && <HomeScreen embedded />}
        {tab === "qr"      && <QRScreen embedded />}
        {tab === "profile" && <ProfileCheckScreen embedded />}
      </View>

      {/* Language dropdown modal */}
      <Modal
        transparent
        visible={langDropdown}
        animationType="fade"
        onRequestClose={() => setLangDropdown(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setLangDropdown(false)}>
          <View style={[styles.dropdown, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.dropdownTitle, { color: theme.subtext }]}>Select Language</Text>
            {LANGUAGES.map((l) => (
              <TouchableOpacity
                key={l.code}
                style={[
                  styles.dropdownItem,
                  { borderColor: theme.border },
                  lang === l.code && { backgroundColor: theme.accentBg },
                ]}
                onPress={() => { changeLang(l.code); setLangDropdown(false); }}
              >
                <Text style={styles.dropdownFlag}>{l.label.split(" ")[0]}</Text>
                <Text style={[styles.dropdownLabel, { color: lang === l.code ? theme.accent : theme.text }]}>
                  {l.label.split(" ").slice(1).join(" ")}
                </Text>
                {lang === l.code && <Text style={{ color: theme.accent, fontSize: 16 }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const makeStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  connectingDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: "#f59e0b",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  appName: { fontSize: 17, fontWeight: "800", color: theme.text },
  topRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  langBtn: {
    flexDirection: "row", alignItems: "center", gap: 2,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 8, borderWidth: 1,
  },
  langBtnText: { fontSize: 14 },
  langBtnLabel: { fontSize: 10, marginLeft: 2 },
  iconBtn: {
    width: 34, height: 34, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1,
  },
  avatar: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: "center", justifyContent: "center",
    overflow: "hidden",
  },
  avatarImg: { width: 34, height: 34, borderRadius: 17 },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  segmentWrap: {
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: theme.surface,
    borderBottomWidth: 1, borderBottomColor: theme.border,
  },
  segment: {
    flexDirection: "row", backgroundColor: theme.background,
    borderRadius: 10, padding: 3, gap: 3,
  },
  segBtn: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 8 },
  segText: { fontWeight: "700", fontSize: 12 },
  modalOverlay: {
    flex: 1, backgroundColor: "#00000066",
    justifyContent: "flex-start", alignItems: "flex-end",
    paddingTop: 110, paddingRight: 16,
  },
  dropdown: {
    borderRadius: 14, borderWidth: 1,
    paddingVertical: 8, minWidth: 180,
    shadowColor: "#000", shadowOpacity: 0.2,
    shadowRadius: 10, elevation: 10,
  },
  dropdownTitle: {
    fontSize: 11, fontWeight: "700",
    letterSpacing: 0.5, paddingHorizontal: 16,
    paddingBottom: 8,
  },
  dropdownItem: {
    flexDirection: "row", alignItems: "center",
    gap: 10, paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1,
  },
  dropdownFlag: { fontSize: 18 },
  dropdownLabel: { flex: 1, fontSize: 15, fontWeight: "600" },
});
