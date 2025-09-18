import React, { useEffect, useState } from "react";
import { Picker } from '@react-native-picker/picker';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Linking } from "react-native";
import { useTheme } from "../../constants/ThemeContext";

const API_BASE = "https://schirmer-s-notary-backend.onrender.com";

type JournalEntry = {
  id?: any;
  date: string;
  client_name: string;
  document_type: string;
  id_type: string;
  id_number: string;
  signature: string;
  notes: string;
  job_id?: string;
};

export default function JournalScreen() {
  async function handleUploadDocument(entryId: any) {
    Alert.alert(
      'Upload Document',
      'Choose how to add your document',
      [
        {
          text: 'Camera',
          onPress: async () => {
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 1,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
              const asset = result.assets[0];
              await uploadFile(entryId, asset.uri, 'photo.jpg', 'image/jpeg');
            }
          },
        },
        {
          text: 'File',
          onPress: async () => {
            const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'] });
            if (result.assets && result.assets.length > 0) {
              const asset = result.assets[0];
              await uploadFile(entryId, asset.uri, asset.name || 'document.pdf', asset.mimeType || 'application/pdf');
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }

  async function uploadFile(entryId: any, uri: string, name: string, type: string) {
    try {
      const formData = new FormData();
      formData.append('file', { uri, name, type } as any);
      const res = await fetch(`${API_BASE}/${entryId}/upload`, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: formData,
      });
      if (res.ok) {
        Alert.alert('Success', 'Document uploaded');
      } else {
        Alert.alert('Error', 'Failed to upload document');
      }
    } catch {
      Alert.alert('Error', 'Failed to upload document');
    }
  }
  const { darkMode } = useTheme();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<any>(null);
  const [editEntry, setEditEntry] = useState<JournalEntry>({ date: "", client_name: "", document_type: "", id_type: "", id_number: "", signature: "", notes: "" });

  useEffect(() => {
    async function fetchEntries() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/journal`);
        const data = await res.json();
        setEntries(data.entries || []);
      } catch {
        Alert.alert("Error", "Failed to load journal entries");
      }
      setLoading(false);
    }
    fetchEntries();
  }, []);

  async function saveEdit(id: any): Promise<void> {
    try {
      const res: Response = await fetch(`${API_BASE}/${id}/edit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editEntry),
      });
      if (res.ok) {
        Alert.alert("Success", "Entry updated");
        setEditId(null);
        // Optionally refresh entries
        const updated = entries.map(e => e.id === id ? { ...editEntry, id } : e);
        setEntries(updated);
      } else {
        Alert.alert("Error", "Failed to update entry");
      }
    } catch {
      Alert.alert("Error", "Failed to update entry");
    }
  }

  function downloadPDF(id: any): void {
    Linking.openURL(`${API_BASE}/${id}/pdf`);
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: darkMode ? '#18181b' : '#f9fafb', padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 16, color: darkMode ? '#fff' : '#222' }}>Journal Entries</Text>
      {loading ? (
        <Text style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}>Loading...</Text>
      ) : (
        entries.map((entry) => (
          <View key={entry.id} style={{ backgroundColor: darkMode ? '#27272a' : '#fff', padding: 16, borderRadius: 12, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8 }}>
            {editId === entry.id ? (
              <>
                <TextInput value={editEntry.date} onChangeText={(v) => setEditEntry((e) => ({ ...e, date: v }))} placeholder="Date" style={{ marginBottom: 8, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff', borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 6, padding: 8 }} />
                <TextInput value={editEntry.client_name} onChangeText={(v) => setEditEntry((e) => ({ ...e, client_name: v }))} placeholder="Client Name" style={{ marginBottom: 8, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff', borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 6, padding: 8 }} />
                <TextInput value={editEntry.document_type} onChangeText={(v) => setEditEntry((e) => ({ ...e, document_type: v }))} placeholder="Document Type" style={{ marginBottom: 8, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff', borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 6, padding: 8 }} />
                <TextInput value={editEntry.id_type} onChangeText={(v) => setEditEntry((e) => ({ ...e, id_type: v }))} placeholder="ID Type" style={{ marginBottom: 8, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff', borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 6, padding: 8 }} />
                <TextInput value={editEntry.id_number} onChangeText={(v) => setEditEntry((e) => ({ ...e, id_number: v }))} placeholder="ID Number" style={{ marginBottom: 8, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff', borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 6, padding: 8 }} />
                <TextInput value={editEntry.signature} onChangeText={(v) => setEditEntry((e) => ({ ...e, signature: v }))} placeholder="Signature" style={{ marginBottom: 8, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff', borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 6, padding: 8 }} />
                <TextInput value={editEntry.notes} onChangeText={(v) => setEditEntry((e) => ({ ...e, notes: v }))} placeholder="Notes" style={{ marginBottom: 8, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff', borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 6, padding: 8 }} multiline />
                <TouchableOpacity onPress={() => saveEdit(entry.id)} style={{ backgroundColor: '#22c55e', padding: 10, borderRadius: 8, marginBottom: 8 }}>
                  <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setEditId(null)} style={{ backgroundColor: '#ef4444', padding: 10, borderRadius: 8 }}>
                  <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={{ color: darkMode ? '#fff' : '#222', fontWeight: '500', marginBottom: 2 }}>Date: {entry.date}</Text>
                <Text style={{ color: darkMode ? '#fff' : '#222', marginBottom: 2 }}>Client: {entry.client_name}</Text>
                <Text style={{ color: darkMode ? '#fff' : '#222', marginBottom: 2 }}>Document Type: {entry.document_type}</Text>
                <Text style={{ color: darkMode ? '#fff' : '#222', marginBottom: 2 }}>ID Type: {entry.id_type}</Text>
                <Text style={{ color: darkMode ? '#fff' : '#222', marginBottom: 2 }}>ID Number: {entry.id_number}</Text>
                <Text style={{ color: darkMode ? '#fff' : '#222', marginBottom: 2 }}>Signature: {entry.signature}</Text>
                <Text style={{ color: darkMode ? '#fff' : '#222', marginBottom: 2 }}>Notes: {entry.notes}</Text>
                <TouchableOpacity onPress={() => { setEditId(entry.id); setEditEntry(entry); }} style={{ backgroundColor: '#f59e42', padding: 10, borderRadius: 8, marginTop: 8 }}>
                  <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => downloadPDF(entry.id)} style={{ backgroundColor: '#2563eb', padding: 10, borderRadius: 8, marginTop: 8 }}>
                  <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>Download PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleUploadDocument(entry.id)} style={{ backgroundColor: '#22c55e', padding: 10, borderRadius: 8, marginTop: 8 }}>
                  <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>Upload Document</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}