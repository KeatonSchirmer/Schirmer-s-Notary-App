import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import apiRequest from "../../api";
import React, { useState, useEffect, useContext } from "react";
import { useTheme } from "../../constants/ThemeContext";
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PendingCountContext } from "@/components/PendingCountContext";

type RequestItem = {
  id: number;
  client_id: number;
  name: string;
  status: string;
};

async function getClientLabel(client_id: number): Promise<string> {
  try {
    const res = await fetch(`https://schirmer-s-notary-backend.onrender.com/clients/${client_id}`);
    if (!res.ok) return "Unnamed";
    const data = await res.json();
    if (data.company) {
      if (typeof data.company === "object" && data.company.name) {
        return data.company.name;
      }
      if (typeof data.company === "string" && data.company.trim()) {
        return data.company.trim();
      }
    }
    return data.name || "Unnamed";
  } catch {
    return "Unnamed";
  }
}

type RequestsProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function Requests({ navigation }: RequestsProps) {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const { darkMode } = useTheme();
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'denied' | 'completed'>('all');
  const { setPendingCount } = useContext(PendingCountContext);

  useEffect(() => {
    let interval: number;
    async function fetchRequests() {
      setLoading(true);
      setError("");
      try {
        const data = await apiRequest("https://schirmer-s-notary-backend.onrender.com/jobs/");
        let items: RequestItem[] = [];
        if (Array.isArray(data)) {
          items = await Promise.all(
            data.map(async (req: any) => ({
              id: req.id,
              client_id: req.client_id,
              name: await getClientLabel(req.client_id),
              status: req.status,
            }))
          );
        }
        setRequests(items);

        const prevPending = await AsyncStorage.getItem('pending_count');
        const currentPending = items.filter((r: any) => r.status === "pending").length;
        setPendingCount(currentPending);
        if (prevPending !== null && Number(prevPending) < currentPending) {
          Notifications.scheduleNotificationAsync({
            content: {
              title: "New Booking Request",
              body: "You have a new pending booking.",
            },
            trigger: null,
          });
        }
        await AsyncStorage.setItem('pending_count', String(currentPending));
      } catch (err) {
        setError("Failed to load requests");
      } finally {
        setLoading(false);
      }
    }
    fetchRequests();
    interval = setInterval(fetchRequests, 15000);
    return () => clearInterval(interval);
  }, []);

  const filteredRequests =
    filter === 'all'
      ? requests
      : requests.filter((req) => req.status === filter);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: darkMode ? '#18181b' : '#f9fafb' }}>
      <ScrollView style={{ flex: 1, padding: 16 }}>
        <View style={{ marginBottom: 16 }}>
            <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 2 }}
            >
            <View style={{ flexDirection: 'row', backgroundColor: darkMode ? '#27272a' : '#f3f4f6', borderRadius: 16, padding: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8 }}>
                {[
                { key: 'all', label: 'All', color: '#2563eb' },
                { key: 'pending', label: 'Pending', color: '#2563eb' },
                { key: 'accepted', label: 'Accepted', color: '#22c55e' },
                { key: 'denied', label: 'Declined', color: '#ef4444' },
                { key: 'completed', label: 'Completed', color: '#a855f7' },
                ].map(tab => (
                <TouchableOpacity
                    key={tab.key}
                    style={{
                    minWidth: 110,
                    paddingVertical: 12,
                    alignItems: 'center',
                    borderRadius: 12,
                    marginHorizontal: 2,
                    backgroundColor: filter === tab.key ? (darkMode ? '#18181b' : '#fff') : 'transparent',
                    borderWidth: filter === tab.key ? 2 : 0,
                    borderColor: filter === tab.key ? tab.color : 'transparent',
                    shadowColor: filter === tab.key ? tab.color : 'transparent',
                    shadowOpacity: filter === tab.key ? 0.12 : 0,
                    shadowRadius: filter === tab.key ? 4 : 0,
                    }}
                    onPress={() => setFilter(tab.key as any)}
                >
                    <Text style={{ fontWeight: '600', color: filter === tab.key ? tab.color : (darkMode ? '#d1d5db' : '#6b7280') }}>{tab.label}</Text>
                </TouchableOpacity>
                ))}
            </View>
            </ScrollView>
        </View>
        {loading ? (
          <Text style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}>Loading...</Text>
        ) : error ? (
          <Text style={{ color: '#ef4444' }}>{error}</Text>
        ) : filteredRequests.length === 0 ? (
          <Text style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}>No requests found.</Text>
        ) : (
          filteredRequests.map((req: any) => (
            <TouchableOpacity
              key={req.id}
              style={{ backgroundColor: darkMode ? '#27272a' : '#fff', padding: 16, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8 }}
              onPress={() => navigation.navigate("JobDetail", { id: req.id })}
            >
              <Text style={{ fontSize: 18, fontWeight: '600', color: darkMode ? '#fff' : '#222' }}>
                {req.name || "Unnamed"}
              </Text>
              <Text style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}>Status: {req.status}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}