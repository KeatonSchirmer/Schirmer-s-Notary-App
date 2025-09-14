import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import apiRequest from "../../api";
import React, { useState, useEffect } from "react";
import * as Location from "expo-location";
import haversine from "haversine";
import { useTheme } from "../../constants/ThemeContext";

export default function Mileage() {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tracking, setTracking] = useState(false);
  const [distance, setDistance] = useState(0);
  const [watcher, setWatcher] = useState<Location.LocationSubscription | null>(null);
  const [lastLocation, setLastLocation] = useState<any>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [stopTime, setStopTime] = useState<number | null>(null);
  const { darkMode } = useTheme();

  useEffect(() => {
    let timer: any = null;
    if (tracking && startTime) {
      timer = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      setElapsedTime(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [tracking, startTime]);

  const userId = 1;
  useEffect(() => {
    async function fetchMileage() {
      setLoading(true);
      setError("");
      try {
        const data = await apiRequest("https://schirmer-s-notary-backend.onrender.com/mileage/", "GET", null, { "X-User-Id": String(userId) });
        setEntries(Array.isArray(data) ? data : data.entries || []);
      } catch (err) {
        setError("No mileage entries");
      } finally {
        setLoading(false);
      }
    }
    fetchMileage();
  }, []);

  const startTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return;
      }

  setTracking(true);
  setDistance(0);
  setLastLocation(null);
  setStartTime(Date.now());
  setStopTime(null);
  setElapsedTime(0);

      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10,
        },
        (location) => {
          try {
            if (lastLocation) {
              const newDistance = haversine(
                { latitude: lastLocation.coords.latitude, longitude: lastLocation.coords.longitude },
                { latitude: location.coords.latitude, longitude: location.coords.longitude },
                { unit: "mile" }
              );
              setDistance((prev) => prev + newDistance);
            }
            setLastLocation(location);
          } catch (err: any) {
            setError("Error calculating distance: " + String(err));
            console.error("Mileage tracking error:", err);
          }
        }
      );

      setWatcher(sub);
    } catch (err: any) {
      setError("Error starting tracking: " + String(err));
      console.error("Error starting location tracking:", err);
    }
  };

  const stopTracking = async () => {
    if (watcher) {
      watcher.remove();
      setWatcher(null);
    }
  setTracking(false);
  setStopTime(Date.now());
  setElapsedTime(0);

    let timeTraveled = 0;
    if (startTime) {
      timeTraveled = ((Date.now() - startTime) / 1000);
    }

    if (distance > 0) {
      try {
        await apiRequest("https://schirmer-s-notary-backend.onrender.com/mileage", "POST", {
          miles: parseFloat(distance.toFixed(2)),
          purpose: "Tracked Trip",
          time: timeTraveled,
        } as any, { "X-User-Id": String(userId) });
        // Refetch entries from backend to ensure UI is up to date
        setLoading(true);
        setError("");
        try {
          const data = await apiRequest("https://schirmer-s-notary-backend.onrender.com/mileage/", "GET", null, { "X-User-Id": String(userId) });
          setEntries(Array.isArray(data) ? data : data.entries || []);
        } catch (err) {
          setError("No mileage entries");
        } finally {
          setLoading(false);
        }
      } catch (err) {
        setError("Failed to save mileage");
      }
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: darkMode ? '#18181b' : '#f9fafb' }}>
      <View style={{ flex: 1, padding: 16 }}>
        <View style={{ backgroundColor: darkMode ? '#27272a' : '#fff', padding: 24, borderRadius: 16, marginBottom: 24, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: darkMode ? '#fff' : '#222' }}>Mileage Tracker</Text>
          <TouchableOpacity
            style={{ paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, backgroundColor: tracking ? '#ef4444' : '#2563eb', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4 }}
            onPress={tracking ? stopTracking : startTracking}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>{tracking ? 'Stop Tracking' : 'Start Tracking'}</Text>
          </TouchableOpacity>
          {tracking && (
            <>
              <Text style={{ marginTop: 16, color: darkMode ? '#d1d5db' : '#222' }}>
                Distance: {distance.toFixed(2)} miles
              </Text>
              <Text style={{ marginTop: 8, color: darkMode ? '#d1d5db' : '#222' }}>
                Time: {elapsedTime} seconds
              </Text>
            </>
          )}
        </View>

        <ScrollView>
          {loading ? (
            <Text style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}>Loading...</Text>
          ) : error ? (
            <Text style={{ color: '#ef4444' }}>{error}</Text>
          ) : Array.isArray(entries) && entries.length === 0 ? (
            <Text style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}>No mileage entries found.</Text>
          ) : Array.isArray(entries) ? (
            entries.map((entry: any) => (
              <View key={entry.id} style={{ backgroundColor: darkMode ? '#27272a' : '#fff', padding: 16, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8 }}>
                <Text style={{ fontWeight: 'bold', color: darkMode ? '#fff' : '#222' }}>{entry.date}</Text>
                <Text style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}>
                  {entry.miles} miles — {entry.purpose}
                  {entry.time ? ` — ${Math.round(entry.time)} seconds` : ""}
                </Text>
              </View>
            ))
          ) : (
            <Text style={{ color: '#ef4444' }}>Mileage data is not available.</Text>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}