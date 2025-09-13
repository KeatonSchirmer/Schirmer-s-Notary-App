import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Linking } from "react-native";

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
};

export default function JournalScreen() {
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
  const [editId, setEditId] = useState<any>(null);
  const [editEntry, setEditEntry] = useState<JournalEntry>({ date: "", client_name: "", document_type: "", id_type: "", id_number: "", signature: "", notes: "" });

  useEffect(() => {
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
      const res = await fetch(`${API_BASE}/new`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEntry),
      });
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
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 16 }}>Journal Entries</Text>
      {loading ? (
        <Text>Loading...</Text>
      ) : (
        entries.map((entry) => (
          <View key={entry.id} style={{ backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 16 }}>
            {editId === entry.id ? (
              <>
                <TextInput value={editEntry.date} onChangeText={(v) => setEditEntry((e) => ({ ...e, date: v }))} placeholder="Date" style={{ marginBottom: 8 }} />
                <TextInput value={editEntry.client_name} onChangeText={(v) => setEditEntry((e) => ({ ...e, client_name: v }))} placeholder="Client Name" style={{ marginBottom: 8 }} />
                <TextInput value={editEntry.document_type} onChangeText={(v) => setEditEntry((e) => ({ ...e, document_type: v }))} placeholder="Document Type" style={{ marginBottom: 8 }} />
                <TextInput value={editEntry.id_type} onChangeText={(v) => setEditEntry((e) => ({ ...e, id_type: v }))} placeholder="ID Type" style={{ marginBottom: 8 }} />
                <TextInput value={editEntry.id_number} onChangeText={(v) => setEditEntry((e) => ({ ...e, id_number: v }))} placeholder="ID Number" style={{ marginBottom: 8 }} />
                <TextInput value={editEntry.signature} onChangeText={(v) => setEditEntry((e) => ({ ...e, signature: v }))} placeholder="Signature" style={{ marginBottom: 8 }} />
                <TextInput value={editEntry.notes} onChangeText={(v) => setEditEntry((e) => ({ ...e, notes: v }))} placeholder="Notes" style={{ marginBottom: 8 }} multiline />
                <TouchableOpacity onPress={() => saveEdit(entry.id)} style={{ backgroundColor: "#22c55e", padding: 10, borderRadius: 8, marginBottom: 8 }}>
                  <Text style={{ color: "#fff", textAlign: "center" }}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setEditId(null)} style={{ backgroundColor: "#ef4444", padding: 10, borderRadius: 8 }}>
                  <Text style={{ color: "#fff", textAlign: "center" }}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text>Date: {entry.date}</Text>
                <Text>Client: {entry.client_name}</Text>
                <Text>Document Type: {entry.document_type}</Text>
                <Text>ID Type: {entry.id_type}</Text>
                <Text>ID Number: {entry.id_number}</Text>
                <Text>Signature: {entry.signature}</Text>
                <Text>Notes: {entry.notes}</Text>
                <TouchableOpacity onPress={() => { setEditId(entry.id); setEditEntry(entry); }} style={{ backgroundColor: "#f59e42", padding: 10, borderRadius: 8, marginTop: 8 }}>
                  <Text style={{ color: "#fff", textAlign: "center" }}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => downloadPDF(entry.id)} style={{ backgroundColor: "#2563eb", padding: 10, borderRadius: 8, marginTop: 8 }}>
                  <Text style={{ color: "#fff", textAlign: "center" }}>Download PDF</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        ))
      )}

      <View style={{ backgroundColor: "#f3f4f6", padding: 16, borderRadius: 12 }}>
        <Text style={{ fontWeight: "bold", marginBottom: 8 }}>Add New Entry</Text>
        <TextInput value={newEntry.date} onChangeText={(v) => setNewEntry((e) => ({ ...e, date: v }))} placeholder="Date" style={{ marginBottom: 8 }} />
        <TextInput value={newEntry.client_name} onChangeText={(v) => setNewEntry((e) => ({ ...e, client_name: v }))} placeholder="Client Name" style={{ marginBottom: 8 }} />
        <TextInput value={newEntry.document_type} onChangeText={(v) => setNewEntry((e) => ({ ...e, document_type: v }))} placeholder="Document Type" style={{ marginBottom: 8 }} />
        <TextInput value={newEntry.id_type} onChangeText={(v) => setNewEntry((e) => ({ ...e, id_type: v }))} placeholder="ID Type" style={{ marginBottom: 8 }} />
        <TextInput value={newEntry.id_number} onChangeText={(v) => setNewEntry((e) => ({ ...e, id_number: v }))} placeholder="ID Number" style={{ marginBottom: 8 }} />
        <TextInput value={newEntry.signature} onChangeText={(v) => setNewEntry((e) => ({ ...e, signature: v }))} placeholder="Signature" style={{ marginBottom: 8 }} />
        <TextInput value={newEntry.notes} onChangeText={(v) => setNewEntry((e) => ({ ...e, notes: v }))} placeholder="Notes" style={{ marginBottom: 8 }} multiline />
        <TouchableOpacity onPress={addEntry} style={{ backgroundColor: "#2563eb", padding: 10, borderRadius: 8 }}>
          <Text style={{ color: "#fff", textAlign: "center" }}>Add Entry</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}