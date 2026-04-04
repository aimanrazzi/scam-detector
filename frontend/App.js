import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { LanguageProvider } from "./context/LanguageContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";

import MainScreen from "./screens/MainScreen";
import HistoryScreen from "./screens/HistoryScreen";
import TipsScreen from "./screens/TipsScreen";
import ResourcesScreen from "./screens/ResourcesScreen";
import ReportScreen from "./screens/ReportScreen";
import AccountScreen from "./screens/AccountScreen";
import LoginScreen from "./screens/LoginScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TABS = [
  { name: "Home",      icon: "🔍", component: MainScreen,     label: "Check"    },
  { name: "History",   icon: "📋", component: HistoryScreen,  label: "History"  },
  { name: "Tips",      icon: "💡", component: TipsScreen,     label: "Tips"     },
  { name: "Resources", icon: "🏛️", component: ResourcesScreen, label: "Resources" },
  { name: "Report",    icon: "🚨", component: ReportScreen,   label: "Report"   },
];

function TabIcon({ emoji, focused }) {
  return (
    <View style={[styles.tabIconBubble, focused && { backgroundColor: "#ffffff" }]}>
      <Text style={[styles.tabEmoji, { opacity: focused ? 1 : 0.5 }]}>{emoji}</Text>
    </View>
  );
}

function AppTabs() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: "#ffffff",
        tabBarInactiveTintColor: "rgba(255,255,255,0.45)",
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
        tabBarStyle: {
          backgroundColor: theme.isDark ? "#1c1c1e" : "#222222",
          borderTopWidth: 0,
          borderRadius: 36,
          marginHorizontal: 10,
          marginBottom: 24,
          height: 76,
          paddingTop: 8,
          paddingBottom: 10,
          paddingHorizontal: 4,
          position: "absolute",
          elevation: 12,
          shadowColor: "#000",
          shadowOpacity: 0.35,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
        },
      }}
    >
      {TABS.map(({ name, icon, component, label }) => (
        <Tab.Screen
          key={name}
          name={name}
          component={component}
          options={{
            tabBarLabel: label,
            tabBarIcon: ({ focused }) => (
              <TabIcon emoji={icon} focused={focused} />
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={AppTabs} />
      <Stack.Screen
        name="Account"
        component={AccountScreen}
        options={{
          headerShown: false,
          animation: "slide_from_right",
          presentation: "transparentModal",
          contentStyle: { marginLeft: "14%", borderTopLeftRadius: 24, overflow: "hidden" },
        }}
      />
    </Stack.Navigator>
  );
}

function AppRoot() {
  const { user, loading } = useAuth();
  const { theme } = useTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (!user) return <LoginScreen />;

  return (
    <NavigationContainer>
      <AppStack />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LanguageProvider>
          <SafeAreaProvider>
            <AppRoot />
          </SafeAreaProvider>
        </LanguageProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  tabIconBubble: {
    width: 44,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  tabEmoji: { fontSize: 20 },
});
