import { Stack } from 'expo-router';
import './globals.css';
import ThemeProvider from '../constants/ThemeContext';
import { useTheme } from '../constants/ThemeContext';
import AuthProvider from '../constants/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    <SafeAreaView style={{ flex: 1 }}>
      <AuthProvider>
        <ThemeProvider>
          <AppStack />
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaView>
  );
}
