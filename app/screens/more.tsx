import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import apiRequest from "../../api";
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from "../../constants/ThemeContext";

type MoreProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function More({ navigation }: MoreProps) {
  const items = [
    { name: "Journal", route: "Journal" },
    { name: "Calendar", route: "Calendar" },
    { name: "Finances", route: "Finances" },
    { name: "Settings", route: "Settings" },
  ];
  const { darkMode } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: darkMode ? '#18181b' : '#f9fafb' }}>
      <ScrollView style={{ flex: 1, padding: 16 }}>
        {items.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={{ backgroundColor: darkMode ? '#27272a' : '#fff', padding: 16, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8 }}
            onPress={() => navigation.navigate(item.route)}
          >
            <Text style={{ fontSize: 18, fontWeight: '600', color: darkMode ? '#fff' : '#222' }}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}