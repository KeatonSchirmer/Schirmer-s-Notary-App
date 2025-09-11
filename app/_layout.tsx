import { Stack } from 'expo-router';
import './globals.css';
import { ThemeProvider, useTheme } from '../constants/ThemeContext';
import { AuthProvider } from '../constants/AuthContext';

function AppStack() {
  const { darkMode } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: darkMode ? '#18181b' : '#fff',
        },
        headerTitleStyle: {
          color: darkMode ? '#fff' : '#222',
        },
        headerTintColor: darkMode ? '#fff' : '#222',
      }}
    />
  );
}

export default function Layout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppStack />
      </ThemeProvider>
    </AuthProvider>
  );
}
