import React from "react"; // eslint-disable-line
import { StatusBar, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { LanguageProvider } from "./context/LanguageContext";
import { useLang } from "./context/LanguageContext";
import { ThemeProvider } from "./context/ThemeContext";
import { useTheme } from "./context/ThemeContext";
import { translations } from "./utils/translations";

import HomeScreen from "./screens/HomeScreen";
import ResourcesScreen from "./screens/ResourcesScreen";
import ReportScreen from "./screens/ReportScreen";
import HistoryScreen from "./screens/HistoryScreen";
import TipsScreen from "./screens/TipsScreen";
import QRScreen from "./screens/QRScreen";
import ProfileCheckScreen from "./screens/ProfileCheckScreen";

const Tab = createBottomTabNavigator();

function AppTabs() {
  const { lang } = useLang();
  const t = translations[lang] || translations.en;
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.subtext,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
        },
      }}
    >
      <Tab.Screen
        name="Check"
        component={HomeScreen}
        options={{
          tabBarLabel: t.tabCheck,
          tabBarIcon: ({ color }) => <TabIcon emoji="🔍" color={color} />,
        }}
      />
      <Tab.Screen
        name="QR"
        component={QRScreen}
        options={{
          tabBarLabel: t.tabQR,
          tabBarIcon: ({ color }) => <TabIcon emoji="⬛" color={color} />,
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: t.tabHistory,
          tabBarIcon: ({ color }) => <TabIcon emoji="📋" color={color} />,
        }}
      />
      <Tab.Screen
        name="Tips"
        component={TipsScreen}
        options={{
          tabBarLabel: t.tabTips,
          tabBarIcon: ({ color }) => <TabIcon emoji="💡" color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileCheckScreen}
        options={{
          tabBarLabel: t.tabProfile,
          tabBarIcon: ({ color }) => <TabIcon emoji="👤" color={color} />,
        }}
      />
      <Tab.Screen
        name="Resources"
        component={ResourcesScreen}
        options={{
          tabBarLabel: t.tabResources,
          tabBarIcon: ({ color }) => <TabIcon emoji="🏛️" color={color} />,
        }}
      />
      <Tab.Screen
        name="Report"
        component={ReportScreen}
        options={{
          tabBarLabel: t.tabReport,
          tabBarIcon: ({ color }) => <TabIcon emoji="🚨" color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <SafeAreaProvider>
          <NavigationContainer>
            <AppTabs />
          </NavigationContainer>
        </SafeAreaProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

function TabIcon({ emoji, color }) {
  return <Text style={{ fontSize: 18, opacity: color === "#6366f1" ? 1 : 0.4 }}>{emoji}</Text>;
}
