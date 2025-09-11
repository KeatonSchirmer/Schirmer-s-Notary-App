import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import apiRequest from "../../api";
import React, { useState, useEffect } from "react";
import { useTheme } from "../../constants/ThemeContext";

export default function RequestDetail({ route }: { route: any }) {
  const { id } = route.params;
  const [request, setRequest] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const { darkMode } = useTheme();

  React.useEffect(() => {
    async function fetchRequestDetail() {
      setLoading(true);
      setError("");
      try {
  const data = await apiRequest(`/jobs/admin/request/${id}`);
        setRequest(data);
      } catch (err) {
        setError("Failed to load request details");
      } finally {
        setLoading(false);
      }
    }
    fetchRequestDetail();
  }, [id]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: darkMode ? '#18181b' : '#f9fafb' }}>
      <View style={{ flex: 1, padding: 16 }}>
        <View style={{ backgroundColor: darkMode ? '#27272a' : '#fff', padding: 16, borderRadius: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8 }}>
          {loading ? (
            <Text style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}>Loading...</Text>
          ) : error ? (
            <Text style={{ color: '#ef4444' }}>{error}</Text>
          ) : request ? (
            <>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: darkMode ? '#fff' : '#222' }}>Request #{request.id}</Text>
              <Text style={{ color: darkMode ? '#d1d5db' : '#6b7280', marginBottom: 8 }}>Client: {request.name}</Text>
              <Text style={{ color: darkMode ? '#d1d5db' : '#6b7280', marginBottom: 8 }}>Type: {request.document_type}</Text>
              <Text style={{ color: darkMode ? '#d1d5db' : '#6b7280', marginBottom: 8 }}>Status: {request.status}</Text>
              <Text style={{ color: darkMode ? '#d1d5db' : '#6b7280', marginBottom: 8 }}>Service: {request.service}</Text>
              <Text style={{ color: darkMode ? '#d1d5db' : '#6b7280', marginBottom: 8 }}>Date: {request.service_date}</Text>
              <Text style={{ color: darkMode ? '#d1d5db' : '#6b7280', marginBottom: 8 }}>Location: {request.location}</Text>
            </>
          ) : null}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <TouchableOpacity style={{ backgroundColor: '#16a34a', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ backgroundColor: '#ef4444', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Decline</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}