import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import apiRequest from "../../api";
import React, { useState, useEffect } from "react";
import { useTheme } from "../../constants/ThemeContext";
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';


type RequestItem = {
  id: number;
  name: string;
  status: string;
};


type RequestsProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function Requests({ navigation }: RequestsProps) {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const { darkMode } = useTheme();
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'denied'>('all');

  React.useEffect(() => {
    async function fetchRequests() {
      setLoading(true);
      setError("");
      try {
  const data = await apiRequest("https://schirmer-s-notary-backend.onrender.com/jobs/");
        setRequests(data || []);
      } catch (err) {
        setError("Failed to load requests");
      } finally {
        setLoading(false);
      }
    }
    fetchRequests();
  }, []);

  const filteredRequests =
    filter === 'all'
      ? requests
      : requests.filter((req) => req.status === filter);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: darkMode ? '#18181b' : '#f9fafb' }}>
      <ScrollView style={{ flex: 1, padding: 16 }}>
        <View style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#d1d5db' }}>
            <TouchableOpacity
              style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 4, borderBottomColor: filter === 'all' ? '#2563eb' : 'transparent', backgroundColor: filter === 'all' ? '#fff' : '#f3f4f6' }}
              onPress={() => setFilter('all')}
            >
              <Text style={{ fontWeight: '600', color: filter === 'all' ? '#2563eb' : '#6b7280' }}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 4, borderBottomColor: filter === 'pending' ? '#2563eb' : 'transparent', backgroundColor: filter === 'pending' ? '#fff' : '#f3f4f6' }}
              onPress={() => setFilter('pending')}
            >
              <Text style={{ fontWeight: '600', color: filter === 'pending' ? '#2563eb' : '#6b7280' }}>Pending</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 4, borderBottomColor: filter === 'accepted' ? '#22c55e' : 'transparent', backgroundColor: filter === 'accepted' ? '#fff' : '#f3f4f6' }}
              onPress={() => setFilter('accepted')}
            >
              <Text style={{ fontWeight: '600', color: filter === 'accepted' ? '#22c55e' : '#6b7280' }}>Accepted</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 4, borderBottomColor: filter === 'denied' ? '#ef4444' : 'transparent', backgroundColor: filter === 'denied' ? '#fff' : '#f3f4f6' }}
              onPress={() => setFilter('denied')}
            >
              <Text style={{ fontWeight: '600', color: filter === 'denied' ? '#ef4444' : '#6b7280' }}>Declined</Text>
            </TouchableOpacity>
          </View>
        </View>
        {loading ? (
          <Text style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}>Loading...</Text>
        ) : error ? (
          <Text style={{ color: '#ef4444' }}>{error}</Text>
        ) : requests.length === 0 ? (
          <Text style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}>No requests found.</Text>
        ) : (
          requests.map((req: any) => (
            <TouchableOpacity
              key={req.id}
              style={{ backgroundColor: darkMode ? '#27272a' : '#fff', padding: 16, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8 }}
              onPress={() => navigation.navigate("RequestDetail", { id: req.id })}
            >
              <Text style={{ fontSize: 18, fontWeight: '600', color: darkMode ? '#fff' : '#222' }}>Request #{req.id}</Text>
              <Text style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}>Status: {req.status}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}