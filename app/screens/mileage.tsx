function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Modal, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import apiRequest from "../../api";
import React, { useState, useEffect } from "react";
import * as Location from "expo-location";
import haversine from "haversine";
import { useTheme } from "../../constants/ThemeContext";

export default function Mileage() {
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editEntry, setEditEntry] = useState<any>(null);
  const [editPurpose, setEditPurpose] = useState("");
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
        setEditModalVisible(false);
        setEditEntry(null);
        setEditPurpose("");
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

      // Get initial location and set as lastLocation
      const initialLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLastLocation(initialLocation);

      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 5, // more frequent updates for accuracy
        },
        (location) => {
          try {
            // Only add distance if location is valid and not duplicate
            if (lastLocation && (location.coords.latitude !== lastLocation.coords.latitude || location.coords.longitude !== lastLocation.coords.longitude)) {
              const newDistance = haversine(
                { latitude: lastLocation.coords.latitude, longitude: lastLocation.coords.longitude },
                { latitude: location.coords.latitude, longitude: location.coords.longitude },
                { unit: "mile" }
              );
              if (newDistance > 0.0001) { // ignore tiny/noisy jumps
                setDistance((prev) => prev + newDistance);
              }
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

    try {
      const res = await apiRequest("https://schirmer-s-notary-backend.onrender.com/mileage/add", "POST", {
        miles: parseFloat(distance.toFixed(2)),
        purpose: "Tracked Trip",
        date: new Date().toISOString().slice(0, 10),
        time: timeTraveled,
      } as any, { "X-User-Id": String(userId) });
      console.log("Mileage save response:", res);
      if (res && res.error) {
        setError(res.error);
        alert("Error: " + res.error);
      } else {
        alert("Mileage saved!");
      }
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
      alert("Failed to save mileage");
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
                Time: {formatTime(elapsedTime)}
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
                  {entry.time ? ` — ${formatTime(Math.round(entry.time))}` : ""}
                </Text>
                <View style={{ flexDirection: 'row', marginTop: 8 }}>
                  <TouchableOpacity
                    style={{ backgroundColor: '#2563eb', borderRadius: 8, padding: 8, marginRight: 8 }}
                    onPress={() => {
                      setEditEntry(entry);
                      setEditPurpose(entry.purpose || "");
                      setEditModalVisible(true);
                    }}
                  >
                    <Text style={{ color: '#fff' }}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ backgroundColor: '#ef4444', borderRadius: 8, padding: 8 }}
                    onPress={() => {
                      Alert.alert(
                        'Delete Entry',
                        'Are you sure you want to delete this mileage entry?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Delete', style: 'destructive', onPress: async () => {
                            try {
                              await apiRequest(`https://schirmer-s-notary-backend.onrender.com/mileage/${entry.id}`, "DELETE", null, { "X-User-Id": String(userId) });
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
                              Alert.alert("Error", "Failed to delete entry.");
                            }
                          } }
                        ]
                      );
                    }}
                  >
                    <Text style={{ color: '#fff' }}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <Text style={{ color: '#ef4444' }}>Mileage data is not available.</Text>
          )}
        </ScrollView>

        {/* Edit Modal */}
        <Modal visible={editModalVisible} transparent animationType="slide">
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#00000088" }}>
            <View style={{ backgroundColor: darkMode ? '#27272a' : '#fff', padding: 20, borderRadius: 10, width: "80%" }}>
              <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8, color: darkMode ? '#fff' : '#222' }}>Edit Mileage Entry</Text>
              <TextInput
                placeholder="Purpose / Notes"
                placeholderTextColor={darkMode ? '#888' : '#999'}
                value={editPurpose}
                onChangeText={setEditPurpose}
                style={{ borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 5, padding: 8, marginBottom: 10, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff' }}
              />
              <TouchableOpacity
                style={{ backgroundColor: '#2563eb', borderRadius: 8, padding: 10, marginBottom: 8 }}
                onPress={async () => {
                  if (!editEntry) return;
                  try {
                    await apiRequest(`https://schirmer-s-notary-backend.onrender.com/mileage/${editEntry.id}`, "PUT", {
                      purpose: editPurpose
                    }, { "X-User-Id": String(userId) });
                    setEditModalVisible(false);
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
                    Alert.alert("Error", "Failed to update entry.");
                  }
                }}
              >
                <Text style={{ color: '#fff', textAlign: 'center' }}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: darkMode ? '#444' : '#e5e7eb', borderRadius: 8, padding: 10 }}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={{ color: darkMode ? '#fff' : '#222', textAlign: 'center' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}