import React, { useEffect, useState } from "react";
import { Picker } from '@react-native-picker/picker';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Linking, Modal, Dimensions } from "react-native";
import { useTheme } from "../../constants/ThemeContext";
import Pdf from "react-native-pdf";

const API_BASE = "https://schirmer-s-notary-backend.onrender.com";

type PDF = {
  id: number;
  filename: string;
  url: string;
};

type Signer = {
  name: string;
  address?: string;
  phone?: string;
};

type JournalEntry = {
  id: number;
  date: string;
  location: string;
  signers: Signer[];
  document_type: string;
  id_verification: boolean;
  notes: string;
  pdfs?: PDF[];
};

export default function JournalScreen() {
  const { darkMode } = useTheme();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<number | null>(null);
  const [editEntry, setEditEntry] = useState<JournalEntry>({
    id: 0,
    date: "",
    location: "",
    signers: [],
    document_type: "",
    id_verification: false,
    notes: "",
    pdfs: [],
  });

  // PDF Modal State
  const [pdfModalVisible, setPdfModalVisible] = useState(false);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEntries() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/journal/`);
        const data = await res.json();
        setEntries(Array.isArray(data) ? data : []);
      } catch {
        Alert.alert("Error", "Failed to load journal entries");
        setEntries([]);
      }
      setLoading(false);
    }
    fetchEntries();
  }, []);

  async function saveEdit(id: number): Promise<void> {
    try {
      const res: Response = await fetch(`${API_BASE}/${id}/edit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editEntry),
      });
      if (res.ok) {
        Alert.alert("Success", "Entry updated");
        setEditId(null);
        const updated = entries.map(e => e.id === id ? { ...editEntry, id } : e);
        setEntries(updated);
      } else {
        Alert.alert("Error", "Failed to update entry");
      }
    } catch {
      Alert.alert("Error", "Failed to update entry");
    }
  }

  async function handleUploadDocument(entryId: number) {
    Alert.alert(
      'Upload Document',
      'Choose how to add your document',
      [
        {
          text: 'Camera',
          onPress: async () => {
            // Request permission first
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission Denied', 'Camera permission is required to take a photo.');
              return;
            }
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

  async function uploadFile(entryId: number, uri: string, name: string, type: string) {
    try {
      const formData = new FormData();
      formData.append('file', { uri, name, type } as any);
      const res = await fetch(`${API_BASE}/journal/${entryId}/upload`, {
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

  // PDF Modal open/close helpers
  function openPdfModal(url: string) {
    setSelectedPdfUrl(url);
    setPdfModalVisible(true);
  }
  function closePdfModal() {
    setPdfModalVisible(false);
    setSelectedPdfUrl(null);
  }

  return (
    <>
      {/* PDF Preview Modal */}
      <Modal
        visible={pdfModalVisible}
        animationType="slide"
        onRequestClose={closePdfModal}
        transparent={false}
      >
        <View style={{ flex: 1, backgroundColor: "#000" }}>
          <TouchableOpacity
            onPress={closePdfModal}
            style={{ padding: 16, backgroundColor: "#222", alignItems: "center" }}
          >
            <Text style={{ color: "#fff", fontWeight: "bold" }}>Close PDF</Text>
          </TouchableOpacity>
          {selectedPdfUrl && (
            <Pdf
              source={{ uri: selectedPdfUrl }}
              style={{ flex: 1, width: Dimensions.get("window").width }}
              onError={error => Alert.alert("PDF Error", (error as any).message || "Unknown PDF error")}
            />
          )}
        </View>
      </Modal>

      <ScrollView style={{ flex: 1, backgroundColor: darkMode ? '#18181b' : '#f9fafb', padding: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 16, color: darkMode ? '#fff' : '#222' }}>Journal Entries</Text>
        {loading ? (
          <Text style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}>Loading...</Text>
        ) : (
          entries.map((entry) => (
            <View key={entry.id} style={{ backgroundColor: darkMode ? '#27272a' : '#fff', padding: 16, borderRadius: 12, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8 }}>
              {editId === entry.id ? (
                <>
                  {/* Date */}
                  <TextInput
                    value={editEntry.date}
                    onChangeText={(v) => setEditEntry((e) => ({ ...e, date: v }))}
                    placeholder="Date"
                    style={{ marginBottom: 8, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff', borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 6, padding: 8 }}
                  />
                  {/* Document Type */}
                  <TextInput
                    value={editEntry.document_type}
                    onChangeText={(v) => setEditEntry((e) => ({ ...e, document_type: v }))}
                    placeholder="Document Type"
                    style={{ marginBottom: 8, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff', borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 6, padding: 8 }}
                  />
                  {/* Location */}
                  <TextInput
                    value={editEntry.location}
                    onChangeText={(v) => setEditEntry((e) => ({ ...e, location: v }))}
                    placeholder="Location"
                    style={{ marginBottom: 8, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff', borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 6, padding: 8 }}
                  />
                  {/* Notes */}
                  <TextInput
                    value={editEntry.notes}
                    onChangeText={(v) => setEditEntry((e) => ({ ...e, notes: v }))}
                    placeholder="Notes"
                    style={{ marginBottom: 8, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff', borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 6, padding: 8 }}
                    multiline
                  />
                  {/* Signers */}
                  <Text style={{ color: darkMode ? '#fff' : '#222', fontWeight: 'bold', marginBottom: 4 }}>Signers:</Text>
                  {editEntry.signers && editEntry.signers.length > 0 ? (
                    editEntry.signers.map((s, idx) => (
                      <View key={idx} style={{ marginBottom: 8 }}>
                        <TextInput
                          value={s.name}
                          onChangeText={(v) => {
                            const newSigners = [...editEntry.signers];
                            newSigners[idx] = { ...newSigners[idx], name: v };
                            setEditEntry((e) => ({ ...e, signers: newSigners }));
                          }}
                          placeholder="Signer Name"
                          style={{ marginBottom: 4, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff', borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 6, padding: 8 }}
                        />
                        <TextInput
                          value={s.address || ""}
                          onChangeText={(v) => {
                            const newSigners = [...editEntry.signers];
                            newSigners[idx] = { ...newSigners[idx], address: v };
                            setEditEntry((e) => ({ ...e, signers: newSigners }));
                          }}
                          placeholder="Signer Address"
                          style={{ marginBottom: 4, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff', borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 6, padding: 8 }}
                        />
                        <TextInput
                          value={s.phone || ""}
                          onChangeText={(v) => {
                            const newSigners = [...editEntry.signers];
                            newSigners[idx] = { ...newSigners[idx], phone: v };
                            setEditEntry((e) => ({ ...e, signers: newSigners }));
                          }}
                          placeholder="Signer Phone"
                          style={{ color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff', borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 6, padding: 8 }}
                        />
                      </View>
                    ))
                  ) : (
                    <Text style={{ fontSize: 14, color: darkMode ? '#d1d5db' : '#4b5563', marginBottom: 2 }}>
                      No signer
                    </Text>
                  )}
                  <TouchableOpacity
                    onPress={() => setEditEntry((e) => ({
                      ...e,
                      signers: [...(e.signers || []), { name: "", address: "", phone: "" }]
                    }))}
                    style={{ backgroundColor: '#2563eb', padding: 8, borderRadius: 6, marginBottom: 8 }}
                  >
                    <Text style={{ color: '#fff', textAlign: 'center' }}>Add Signer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => saveEdit(entry.id)} style={{ backgroundColor: '#22c55e', padding: 10, borderRadius: 8, marginBottom: 8 }}>
                    <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setEditId(null)} style={{ backgroundColor: '#ef4444', padding: 10, borderRadius: 8 }}>
                    <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>Cancel</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {/* Signers */}
                  {entry.signers && entry.signers.length > 0 ? (
                    entry.signers.map((s, idx) => (
                      <Text key={idx} style={{ fontSize: 14, color: darkMode ? '#d1d5db' : '#4b5563', marginBottom: 2 }}>
                        {s.name}
                        {s.address ? ` | ${s.address}` : ""}
                        {s.phone ? ` | ${s.phone}` : ""}
                      </Text>
                    ))
                  ) : (
                    <Text style={{ fontSize: 14, color: darkMode ? '#d1d5db' : '#4b5563', marginBottom: 2 }}>
                      No signer
                    </Text>
                  )}
                  {/* Date */}
                  <Text style={{ fontSize: 14, color: darkMode ? '#d1d5db' : '#4b5563', marginBottom: 2 }}>
                    Date: {entry.date}
                  </Text>
                  {/* Document Type */}
                  <Text style={{ fontSize: 14, color: darkMode ? '#d1d5db' : '#4b5563', marginBottom: 2 }}>
                    Document: {entry.document_type}
                  </Text>
                  {/* Location */}
                  <Text style={{ fontSize: 14, color: darkMode ? '#d1d5db' : '#4b5563', marginBottom: 2 }}>
                    Location: {entry.location}
                  </Text>
                  {/* Notes */}
                  <Text style={{ fontSize: 14, color: darkMode ? '#d1d5db' : '#4b5563', marginBottom: 2 }}>
                    Notes: {entry.notes}
                  </Text>
                  <TouchableOpacity onPress={() => { setEditId(entry.id); setEditEntry(entry); }} style={{ backgroundColor: '#f59e42', padding: 10, borderRadius: 8, marginTop: 8 }}>
                    <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>Edit</Text>
                  </TouchableOpacity>
                  {/* PDF Section with in-app preview */}
                  {entry.pdfs && entry.pdfs.length > 0 && (
                    <View style={{ marginTop: 8 }}>
                      <Text style={{ color: darkMode ? '#fff' : '#222', fontWeight: 'bold', marginBottom: 4 }}>Documents:</Text>
                      {entry.pdfs.map(pdf => (
                        <View key={pdf.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                          <Text style={{ color: darkMode ? '#fff' : '#222', flex: 1 }}>{pdf.filename}</Text>
                          <TouchableOpacity
                            onPress={() => openPdfModal(pdf.url)}
                            style={{ backgroundColor: '#2563eb', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, marginLeft: 8 }}
                          >
                            <Text style={{ color: '#fff' }}>View PDF</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}
                  <TouchableOpacity onPress={() => handleUploadDocument(entry.id)} style={{ backgroundColor: '#22c55e', padding: 10, borderRadius: 8, marginTop: 8 }}>
                    <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>Upload Document</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </>
  );
}