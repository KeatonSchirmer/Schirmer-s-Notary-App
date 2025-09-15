import React, { useEffect, useState } from "react";
import { Picker } from '@react-native-picker/picker';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Linking } from "react-native";
import { useTheme } from "../../constants/ThemeContext";

const API_BASE = "https://schirmer-s-notary-backend.onrender.com/journal";

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
    // Prompt user for camera or file
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
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEntry, setNewEntry] = useState<JournalEntry>({
    date: "",
    client_name: "",
    document_type: "",
    id_type: "",
    id_number: "",
    signature: "",
    notes: "",
  });
  const [scannedDoc, setScannedDoc] = useState<any>(null);
  const [editId, setEditId] = useState<any>(null);
  const [editEntry, setEditEntry] = useState<JournalEntry>({ date: "", client_name: "", document_type: "", id_type: "", id_number: "", signature: "", notes: "" });

  useEffect(() => {
    async function fetchJobs() {
      try {
        const res = await fetch("https://schirmer-s-notary-backend.onrender.com/jobs/?status=completed");
        const data = await res.json();
        setJobs(data || []);
      } catch {
        // ignore job fetch errors
      }
    }
    fetchJobs();
    async function fetchEntries() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/`);
        const data = await res.json();
        setEntries(data.entries || []);
      } catch {
        Alert.alert("Error", "Failed to load journal entries");
      }
      setLoading(false);
    }
    fetchEntries();
  }, []);

  async function addEntry() {
    try {
      let res;
      if (scannedDoc) {
        const formData = new FormData();
        Object.entries(newEntry).forEach(([key, value]) => {
          formData.append(key, value as string);
        });
        if (selectedJobId) {
          formData.append('job_id', selectedJobId);
        }
        formData.append('file', {
          uri: scannedDoc.uri,
          name: scannedDoc.name || 'scanned.pdf',
          type: 'application/pdf',
        } as any);
        res = await fetch(`${API_BASE}/new`, {
          method: "POST",
          headers: {
            'Accept': 'application/json',
          },
          body: formData,
        });
      } else {
        const entryData = { ...newEntry };
        if (selectedJobId) {
          entryData.job_id = selectedJobId;
        }
        res = await fetch(`${API_BASE}/new`, {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entryData),
        });
      }
      if (res.ok) {
        Alert.alert("Success", "Journal entry added");
        setNewEntry({
          date: "",
          client_name: "",
          document_type: "",
          id_type: "",
          id_number: "",
          signature: "",
          notes: "",
        });
        setScannedDoc(null);
        const data = await res.json();
        setEntries((prev) => [{ ...newEntry, id: data.id }, ...prev]);
      } else {
        Alert.alert("Error", "Failed to add entry");
      }
    } catch {
      Alert.alert("Error", "Failed to add entry");
    }
  }

interface SaveEditResponse {
    id: any;
    [key: string]: any;
}

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
        } else {
            Alert.alert("Error", "Failed to update entry");
        }
    } catch {
        Alert.alert("Error", "Failed to update entry");
    }
}

interface DownloadPDFProps {
    id: any;
}

function downloadPDF(id: DownloadPDFProps["id"]): void {
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

      <View style={{ backgroundColor: darkMode ? '#232326' : '#f3f4f6', padding: 16, borderRadius: 12, marginBottom: 24 }}>
        <Text style={{ fontWeight: 'bold', marginBottom: 8, color: darkMode ? '#fff' : '#222' }}>Link to Completed Job</Text>
        <Picker
          selectedValue={selectedJobId}
          onValueChange={(itemValue) => setSelectedJobId(itemValue)}
          style={{ marginBottom: 8, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff' }}
        >
          <Picker.Item label="None" value="" />
          {jobs.map((job: any) => (
            <Picker.Item key={job.id} label={`#${job.id} - ${job.name || job.document_type || 'Job'}`} value={String(job.id)} />
          ))}
        </Picker>
        {scannedDoc ? (
          <View style={{ marginBottom: 8 }}>
            <Text style={{ color: '#22c55e' }}>Scanned Document: {scannedDoc.name || scannedDoc.uri ? scannedDoc.name || 'scanned.pdf' : 'photo.jpg'}</Text>
            <TouchableOpacity onPress={() => setScannedDoc(null)} style={{ backgroundColor: '#ef4444', padding: 6, borderRadius: 6, marginTop: 4 }}>
              <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>Remove</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              'Attach Document',
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
                      setScannedDoc({ uri: result.assets[0].uri, name: 'photo.jpg', mimeType: 'image/jpeg' });
                    }
                  },
                },
                {
                  text: 'File',
                  onPress: async () => {
                    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'] });
                    if (result.assets && result.assets.length > 0) {
                      setScannedDoc(result.assets[0]);
                    }
                  },
                },
                { text: 'Cancel', style: 'cancel' },
              ]
            );
          }}
          style={{ backgroundColor: '#2563eb', padding: 8, borderRadius: 8, marginBottom: 8 }}
        >
          <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>Scan & Attach Document (Camera or File)</Text>
        </TouchableOpacity>
        <Text style={{ fontWeight: 'bold', marginBottom: 8, color: darkMode ? '#fff' : '#222' }}>Add New Entry</Text>
        <TextInput value={newEntry.date} onChangeText={(v) => setNewEntry((e) => ({ ...e, date: v }))} placeholder="Date" style={{ marginBottom: 8, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff', borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 6, padding: 8 }} />
        <TextInput value={newEntry.client_name} onChangeText={(v) => setNewEntry((e) => ({ ...e, client_name: v }))} placeholder="Client Name" style={{ marginBottom: 8, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff', borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 6, padding: 8 }} />
        <TextInput value={newEntry.document_type} onChangeText={(v) => setNewEntry((e) => ({ ...e, document_type: v }))} placeholder="Document Type" style={{ marginBottom: 8, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff', borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 6, padding: 8 }} />
        <TextInput value={newEntry.id_type} onChangeText={(v) => setNewEntry((e) => ({ ...e, id_type: v }))} placeholder="ID Type" style={{ marginBottom: 8, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff', borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 6, padding: 8 }} />
        <TextInput value={newEntry.id_number} onChangeText={(v) => setNewEntry((e) => ({ ...e, id_number: v }))} placeholder="ID Number" style={{ marginBottom: 8, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff', borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 6, padding: 8 }} />
        <TextInput value={newEntry.signature} onChangeText={(v) => setNewEntry((e) => ({ ...e, signature: v }))} placeholder="Signature" style={{ marginBottom: 8, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff', borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 6, padding: 8 }} />
        <TextInput value={newEntry.notes} onChangeText={(v) => setNewEntry((e) => ({ ...e, notes: v }))} placeholder="Notes" style={{ marginBottom: 8, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff', borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 6, padding: 8 }} multiline />
        <TouchableOpacity onPress={addEntry} style={{ backgroundColor: '#22c55e', padding: 10, borderRadius: 8, marginTop: 8 }}>
          <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>Add Entry</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}