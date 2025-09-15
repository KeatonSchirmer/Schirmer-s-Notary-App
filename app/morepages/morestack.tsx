import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MoreScreen from "../screens/more";
import CalendarScreen from "./calendar";
import FinancesScreen from "./finances";
import SettingsScreen from "./settings";
import JournalScreen from "./journal";
import apiRequest from "../../api";


const Stack = createNativeStackNavigator();

export default function MoreStack({ setLoggedIn }: { setLoggedIn?: (val: boolean) => void }) {
  const { darkMode } = require("../../constants/ThemeContext").useTheme();
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MoreHome"
        component={MoreScreen}
        options={{
          title: "More",
          headerStyle: { backgroundColor: darkMode ? "#18181b" : "#fff" },
          headerTitleStyle: { color: darkMode ? "#fff" : "#222" },
          headerTintColor: darkMode ? "#fff" : "#222",
        }}
      />
      <Stack.Screen
        name="Settings"
        children={props => <SettingsScreen {...props} setLoggedIn={setLoggedIn} />}
        options={{
          title: "Settings",
          headerStyle: { backgroundColor: darkMode ? "#18181b" : "#fff" },
          headerTitleStyle: { color: darkMode ? "#fff" : "#222" },
          headerTintColor: darkMode ? "#fff" : "#222",
        }}
      />
      <Stack.Screen
        name="Finances"
        component={FinancesScreen}
        options={{
          title: "Finances",
          headerStyle: { backgroundColor: darkMode ? "#18181b" : "#fff" },
          headerTitleStyle: { color: darkMode ? "#fff" : "#222" },
          headerTintColor: darkMode ? "#fff" : "#222",
        }}
      />
      <Stack.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          title: "Calendar",
          headerStyle: { backgroundColor: darkMode ? "#18181b" : "#fff" },
          headerTitleStyle: { color: darkMode ? "#fff" : "#222" },
          headerTintColor: darkMode ? "#fff" : "#222",
        }}
      />
      <Stack.Screen
        name="Journal"
        component={JournalScreen}
        options={{
          title: "Journal",
          headerStyle: { backgroundColor: darkMode ? "#18181b" : "#fff" },
          headerTitleStyle: { color: darkMode ? "#fff" : "#222" },
          headerTintColor: darkMode ? "#fff" : "#222",
        }}
      />
    </Stack.Navigator>
  );
}