import { View, Text, TouchableOpacity } from "react-native";
import * as DocumentPicker from 'expo-document-picker';
import { TextInput, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import apiRequest from "../../api";
import React, { useState, useEffect } from "react";
import { useTheme } from "../../constants/ThemeContext";

export default function RequestDetail({ route }: { route: any }) {
  async function uploadPDF() {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
    if (result.assets && result.assets.length > 0) {
      const { uri, name } = result.assets[0];
      const userId = 1;

      const formData = new FormData();
      formData.append('file', {
        uri,
        name,
        type: 'application/pdf',
      } as any);

      const response = await fetch('https://schirmer-s-notary-backend.onrender.com/pdfs/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-User-Id': String(userId),
        },
        body: formData,
      });

      if (response.ok) {
        alert('PDF uploaded successfully!');
      } else {
        alert('Failed to upload PDF.');
      }
    }
  }
  const [editLocation, setEditLocation] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { darkMode } = useTheme();

  // Journal modal state
  const [journalModalVisible, setJournalModalVisible] = useState(false);
  const [journalNotes, setJournalNotes] = useState("");

  useEffect(() => {
    async function fetchRequestDetail() {
      setLoading(true);
      setError("");
      try {
        const data = await apiRequest(`https://schirmer-s-notary-backend.onrender.com/jobs/admin/request/${route.params.id}`);
        setRequest(data);
      } catch (err) {
        setError("Failed to load request details");
      } finally {
        setLoading(false);
      }
    }
    fetchRequestDetail();
  }, [route.params.id]);

  const handleDeleteRequest = async () => {
    if (!request) return;
    let endpoint = "";
    if (request.status === "accepted") {
      endpoint = `https://schirmer-s-notary-backend.onrender.com/jobs/admin/accepted/${request.id}`;
    } else if (request.status === "denied") {
      endpoint = `https://schirmer-s-notary-backend.onrender.com/jobs/admin/denied/${request.id}`;
    } else {
      endpoint = `https://schirmer-s-notary-backend.onrender.com/jobs/admin/request/${request.id}`;
    }
    try {
      await apiRequest(endpoint, "DELETE");
      alert("Request deleted successfully.");
    } catch (err) {
      alert("Failed to delete request.");
    }
  };

  // Add journal entry and mark booking completed
  const handleAddJournalEntry = async () => {
    if (!request) return;
    try {
      // 1. Create journal entry and connect to job
      await apiRequest(
        `https://schirmer-s-notary-backend.onrender.com/journal/add`,
        "POST",
        {
          job_id: request.id,
          title: `Journal Entry for Booking #${request.id}`,
          notes: journalNotes,
        }
      );
      // 2. Mark booking as completed
      await apiRequest(
        `https://schirmer-s-notary-backend.onrender.com/jobs/${request.id}/complete`,
        "PATCH"
      );
      alert("Journal entry added and booking marked as completed.");
      setJournalModalVisible(false);
      setJournalNotes("");
      // Optionally refresh request details
      // You may want to reload the request here
    } catch (err) {
      alert("Failed to add journal entry or mark booking completed.");
    }
  };

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
              {/* Editable fields for accepted requests */}
              {request.status === 'accepted' ? (
                <>
                  <Text style={{ color: darkMode ? '#d1d5db' : '#6b7280', marginBottom: 4 }}>Date:</Text>
                  <TextInput
                    value={editDate || request.service_date || ""}
                    onChangeText={setEditDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={darkMode ? '#888' : '#999'}
                    style={{ borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 8, padding: 8, marginBottom: 8, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff' }}
                  />
                  <Text style={{ color: darkMode ? '#d1d5db' : '#6b7280', marginBottom: 4 }}>Time:</Text>
                  <TextInput
                    value={editTime}
                    onChangeText={setEditTime}
                    placeholder="HH:MM (24hr)"
                    placeholderTextColor={darkMode ? '#888' : '#999'}
                    style={{ borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 8, padding: 8, marginBottom: 8, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff' }}
                  />
                  <Text style={{ color: darkMode ? '#d1d5db' : '#6b7280', marginBottom: 4 }}>Location:</Text>
                  <TextInput
                    value={editLocation || request.location || ""}
                    onChangeText={setEditLocation}
                    placeholder="Enter location"
                    placeholderTextColor={darkMode ? '#888' : '#999'}
                    style={{ borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 8, padding: 8, marginBottom: 8, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff' }}
                  />
                  <TouchableOpacity style={{ backgroundColor: '#22c55e', borderRadius: 8, padding: 10, marginBottom: 8 }} onPress={async () => {
                    let serviceDate = editDate || request.service_date || "";
                    if (editTime) {
                      serviceDate = `${serviceDate}T${editTime}`;
                    }
                    try {
                      await apiRequest(`https://schirmer-s-notary-backend.onrender.com/jobs/admin/accepted/${request.id}/edit`, "PATCH", {
                        location: editLocation || request.location || "",
                        service_date: serviceDate,
                      });
                      alert("Request updated successfully.");
                    } catch (err) {
                      alert("Failed to update request.");
                    }
                  }}>
                    <Text style={{ color: '#fff', textAlign: 'center' }}>Save Changes</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={{ color: darkMode ? '#d1d5db' : '#6b7280', marginBottom: 8 }}>Date: {request.service_date}</Text>
                  <Text style={{ color: darkMode ? '#d1d5db' : '#6b7280', marginBottom: 8 }}>Location: {request.location}</Text>
                </>
              )}
              <TouchableOpacity
                style={{ backgroundColor: '#2563eb', borderRadius: 8, padding: 10, marginTop: 12, alignSelf: 'flex-end' }}
                onPress={uploadPDF}
              >
                <Text style={{ color: '#fff', textAlign: 'center' }}>Scan & Upload PDF</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: '#a855f7', borderRadius: 8, padding: 10, marginTop: 12, alignSelf: 'flex-end' }}
                onPress={() => setJournalModalVisible(true)}
              >
                <Text style={{ color: '#fff', textAlign: 'center' }}>Add Journal Entry & Complete Booking</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: '#ef4444', borderRadius: 8, padding: 10, marginTop: 12, alignSelf: 'flex-end' }}
                onPress={handleDeleteRequest}
              >
                <Text style={{ color: '#fff', textAlign: 'center' }}>Delete Request</Text>
              </TouchableOpacity>
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
      {/* Journal Entry Modal */}
      <Modal visible={journalModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#00000088" }}>
          <View style={{ backgroundColor: darkMode ? '#27272a' : '#fff', padding: 20, borderRadius: 10, width: "80%" }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8, color: darkMode ? '#fff' : '#222' }}>Add Journal Entry</Text>
            <TextInput
              placeholder="Journal notes"
              placeholderTextColor={darkMode ? '#888' : '#999'}
              value={journalNotes}
              onChangeText={setJournalNotes}
              style={{ borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 5, padding: 8, marginBottom: 10, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff' }}
              multiline
              numberOfLines={4}
            />
            <TouchableOpacity
              style={{ backgroundColor: '#a855f7', borderRadius: 8, padding: 10, marginBottom: 8 }}
              onPress={handleAddJournalEntry}
            >
              <Text style={{ color: '#fff', textAlign: 'center' }}>Save & Complete Booking</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ backgroundColor: darkMode ? '#444' : '#e5e7eb', borderRadius: 8, padding: 10 }}
              onPress={() => setJournalModalVisible(false)}
            >
              <Text style={{ color: darkMode ? '#fff' : '#222', textAlign: 'center' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}