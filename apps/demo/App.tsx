import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { HomeScreen } from "./src/screens/HomeScreen";
import { ScenarioScreen } from "./src/screens/ScenarioScreen";
import { theme } from "./src/theme";

export type RootStackParamList = {
  Home: undefined;
  Scenario: { scenario: "honestDeposit" | "drainerBlink" };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: theme.colors.accent,
          background: theme.colors.bg,
          card: theme.colors.bgElevated,
          text: theme.colors.text,
          border: theme.colors.border,
          notification: theme.colors.accent,
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.bgElevated },
          headerTintColor: theme.colors.text,
          contentStyle: { backgroundColor: theme.colors.bg },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: "Halo Demo" }} />
        <Stack.Screen name="Scenario" component={ScenarioScreen} options={{ title: "Transaction" }} />
      </Stack.Navigator>
      <StatusBar style="light" />
    </NavigationContainer>
  );
}
