import React from "react"; // eslint-disable-line
import { StatusBar, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider } from "react-native-safe-area-context";

import HomeScreen from "./screens/HomeScreen";
import ResourcesScreen from "./screens/ResourcesScreen";
import ReportScreen from "./screens/ReportScreen";
import HistoryScreen from "./screens/HistoryScreen";
import TipsScreen from "./screens/TipsScreen";
import QRScreen from "./screens/QRScreen";

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f0f" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: "#111111",
              borderTopColor: "#2a2a2a",
              height: 64,
              paddingBottom: 10,
              paddingTop: 8,
            },
            tabBarActiveTintColor: "#6366f1",
            tabBarInactiveTintColor: "#555",
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
              tabBarLabel: "Check",
              tabBarIcon: ({ color }) => <TabIcon emoji="🔍" color={color} />,
            }}
          />
          <Tab.Screen
            name="QR"
            component={QRScreen}
            options={{
              tabBarLabel: "QR Scan",
              tabBarIcon: ({ color }) => <TabIcon emoji="⬛" color={color} />,
            }}
          />
          <Tab.Screen
            name="History"
            component={HistoryScreen}
            options={{
              tabBarLabel: "History",
              tabBarIcon: ({ color }) => <TabIcon emoji="📋" color={color} />,
            }}
          />
          <Tab.Screen
            name="Tips"
            component={TipsScreen}
            options={{
              tabBarLabel: "Tips",
              tabBarIcon: ({ color }) => <TabIcon emoji="💡" color={color} />,
            }}
          />
          <Tab.Screen
            name="Resources"
            component={ResourcesScreen}
            options={{
              tabBarLabel: "Resources",
              tabBarIcon: ({ color }) => <TabIcon emoji="🏛️" color={color} />,
            }}
          />
          <Tab.Screen
            name="Report"
            component={ReportScreen}
            options={{
              tabBarLabel: "Report",
              tabBarIcon: ({ color }) => <TabIcon emoji="🚨" color={color} />,
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

function TabIcon({ emoji, color }) {
  return <Text style={{ fontSize: 18, opacity: color === "#6366f1" ? 1 : 0.4 }}>{emoji}</Text>;
}
