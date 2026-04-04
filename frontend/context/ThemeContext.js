import { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const darkTheme = {
  isDark: true,
  background: "#0f0f0f",
  surface: "#1a1a1a",
  card: "#1e1e1e",
  border: "#2a2a2a",
  text: "#ffffff",
  subtext: "#888888",
  accent: "#6366f1",
  accentBg: "#6366f133",
  safe: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  statusBar: "light-content",
};

export const lightTheme = {
  isDark: false,
  background: "#f5f5f5",
  surface: "#ffffff",
  card: "#ffffff",
  border: "#e0e0e0",
  text: "#111111",
  subtext: "#666666",
  accent: "#6366f1",
  accentBg: "#6366f118",
  safe: "#16a34a",
  warning: "#d97706",
  danger: "#dc2626",
  statusBar: "dark-content",
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(darkTheme);

  useEffect(() => {
    AsyncStorage.getItem("app_theme").then((saved) => {
      if (saved === "light") setTheme(lightTheme);
    });
  }, []);

  const toggleTheme = async () => {
    const next = theme.isDark ? lightTheme : darkTheme;
    setTheme(next);
    await AsyncStorage.setItem("app_theme", next.isDark ? "dark" : "light");
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
