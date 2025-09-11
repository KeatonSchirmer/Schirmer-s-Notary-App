import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import apiRequest from "../../api";
import React, { useState, useEffect } from "react";
import { useTheme } from "../../constants/ThemeContext";

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RequestsProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function Requests({ navigation }: RequestsProps) {
  const [requests, setRequests] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const { darkMode } = useTheme();

  React.useEffect(() => {
    async function fetchRequests() {
      setLoading(true);
      setError("");
      try {
  const data = await apiRequest("/jobs/");
        setRequests(data || []);
      } catch (err) {
        setError("Failed to load requests");
      } finally {
        setLoading(false);
      }
    }
    fetchRequests();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: darkMode ? '#18181b' : '#f9fafb' }}>
      <ScrollView style={{ flex: 1, padding: 16 }}>
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