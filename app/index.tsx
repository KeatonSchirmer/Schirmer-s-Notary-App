import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Dashboard from "./screens/dashboard";
import Clients from "./screens/clients";
import ClientDetail from "./screens/clientdetail";
import Requests from "./screens/requests";
import RequestDetail from "./screens/requestdetail";
import Mileage from "./screens/mileage";
import More from "./morepages/morestack";
import Ionicons from "@expo/vector-icons/Ionicons";
import LoginScreen from "./login";
import React, { useState } from "react";
import ThemeProvider, { useTheme } from "../constants/ThemeContext";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function ClientsStack() {
  const { darkMode } = useTheme();
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ClientsHome"
        component={Clients}
        options={{
          title: "Clients",
          headerStyle: { backgroundColor: darkMode ? "#18181b" : "#fff" },
          headerTitleStyle: { color: darkMode ? "#fff" : "#222" },
          headerTintColor: darkMode ? "#fff" : "#222",
        }}
      />
      <Stack.Screen
        name="ClientDetail"
        component={ClientDetail}
        options={{
          title: "Client Detail",
          headerStyle: { backgroundColor: darkMode ? "#18181b" : "#fff" },
          headerTitleStyle: { color: darkMode ? "#fff" : "#222" },
          headerTintColor: darkMode ? "#fff" : "#222",
        }}
      />
    </Stack.Navigator>
  );
}

function RequestsStack() {
  const { darkMode } = useTheme();
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="RequestsHome"
        component={Requests}
        options={{
          title: "Requests",
          headerStyle: { backgroundColor: darkMode ? "#18181b" : "#fff" },
          headerTitleStyle: { color: darkMode ? "#fff" : "#222" },
          headerTintColor: darkMode ? "#fff" : "#222",
        }}
      />
      <Stack.Screen
        name="RequestDetail"
        component={RequestDetail}
        options={{
          title: "Request Detail",
          headerStyle: { backgroundColor: darkMode ? "#18181b" : "#fff" },
          headerTitleStyle: { color: darkMode ? "#fff" : "#222" },
          headerTintColor: darkMode ? "#fff" : "#222",
        }}
      />
    </Stack.Navigator>
  );
}
      


function MainApp() {
  const [loggedIn, setLoggedIn] = useState(false);
  const { darkMode } = useTheme();

  if (!loggedIn) {
    return <LoginScreen navigation={null} setLoggedIn={setLoggedIn} />;
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: darkMode ? '#18181b' : '#fff',
          borderTopColor: darkMode ? '#333' : '#e5e7eb',
        },
        tabBarActiveTintColor: darkMode ? '#fff' : '#2563eb',
        tabBarInactiveTintColor: darkMode ? '#d1d5db' : '#222',
        tabBarIcon: ({ color, size }) => {
          let iconName: React.ComponentProps<typeof Ionicons>["name"] = "ellipsis-horizontal";
          if (route.name === "Dashboard") iconName = "home";
          else if (route.name === "Clients") iconName = "people";
          else if (route.name === "Requests") iconName = "file-tray";
          else if (route.name === "Mileage") iconName = "car";
          else if (route.name === "More") iconName = "ellipsis-horizontal";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={Dashboard} />
      <Tab.Screen name="Clients" component={ClientsStack} />
      <Tab.Screen name="Requests" component={RequestsStack} />
      <Tab.Screen name="Mileage" component={Mileage} />
      <Tab.Screen name="More">
        {props => <More {...props} setLoggedIn={setLoggedIn} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}