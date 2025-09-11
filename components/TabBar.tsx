import { View, Text, Pressable, ScrollView } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { useTheme } from '../constants/ThemeContext';

type Tab = { label: string; path: string };

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange?: (tab: string) => void;
}

export default function TabBar({ tabs, activeTab, onTabChange }: TabBarProps) {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const tabLayouts = useRef<{ [key: string]: { x: number; width: number } }>({});
  const [scrollViewWidth, setScrollViewWidth] = useState(0);
  const { darkMode } = useTheme();

  const handlePress = (label: string, path: string) => {
    onTabChange?.(label);
    router.push(path as any);

    // Scroll to center the selected tab (if possible)
    const layout = tabLayouts.current[label];
    if (layout && scrollRef.current && scrollViewWidth) {
      const offsetX = layout.x + layout.width / 2 - scrollViewWidth / 2;
      scrollRef.current.scrollTo({ x: Math.max(0, offsetX), animated: true });
    }
  };

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ borderBottomWidth: 2, borderBottomColor: darkMode ? '#333' : '#e5e7eb', maxHeight: 112, backgroundColor: darkMode ? '#18181b' : '#fff' }}
      contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 4 }}
      onLayout={(e) => setScrollViewWidth(e.nativeEvent.layout.width)}
    >
      {tabs.map(({ label, path }) => (
        <Pressable
          key={label}
          onLayout={(e) => {
            const { x, width } = e.nativeEvent.layout;
            tabLayouts.current[label] = { x, width };
          }}
          onPress={() => handlePress(label, path)}
          style={{
            paddingHorizontal: 40,
            paddingVertical: 2,
            marginHorizontal: 6,
            borderRadius: 6,
            justifyContent: 'center',
            height: 36,
            backgroundColor: activeTab === label ? (darkMode ? '#27272a' : '#333') : (darkMode ? '#222' : '#e5e7eb'),
          }}
        >
          <Text
            style={{
              color: activeTab === label ? (darkMode ? '#fff' : '#fff') : (darkMode ? '#d1d5db' : '#222'),
              fontSize: 20,
              fontWeight: 'bold',
            }}
          >
            {label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}