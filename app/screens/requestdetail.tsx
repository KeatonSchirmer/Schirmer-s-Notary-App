import { View, Text, TouchableOpacity, TextInput, Modal, Alert } from "react-native";
import * as DocumentPicker from 'expo-document-picker';
import { SafeAreaView } from "react-native-safe-area-context";
import apiRequest from "../../api";
import React, { useState, useEffect } from "react";
import { useTheme } from "../../constants/ThemeContext";
import * as ImagePicker from 'expo-image-picker';
import { ScrollView, KeyboardAvoidingView, Platform } from "react-native";


export default function RequestDetail({ route, navigation }: { route: any, navigation: any }) {
  const { darkMode } = useTheme();
  const [request, setRequest] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editDate, setEditDate] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [journalModalVisible, setJournalModalVisible] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [journalDate, setJournalDate] = useState(request?.date || "");
  const [journalLocation, setJournalLocation] = useState(request?.location || "");
  const [signerName, setSignerName] = useState("");
  const [signers, setSigners] = useState([
    { name: "", address: "", phone: "" }
  ]);
  const addSigner = () => setSigners([...signers, { name: "", address: "", phone: "" }]);
  const removeSigner = (idx: number) => setSigners(signers.filter((_, i) => i !== idx));
  const updateSigner = (idx: number, field: keyof typeof signers[0], value: string) => {
    const updated = [...signers];
    updated[idx][field] = value;
    setSigners(updated);
  };
  const [signerAddress, setSignerAddress] = useState("");
  const [signerPhone, setSignerPhone] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [idVerification, setIdVerification] = useState(false);
  const [journalNotes, setJournalNotes] = useState("");

  useEffect(() => {
    async function fetchRequestDetail() {
      setLoading(true);
      setError("");
      try {
        const data = await apiRequest(`https://schirmer-s-notary-backend.onrender.com/jobs/${route.params.id}`);
        setRequest(data);
        setEditDate(data.date || "");
        setEditLocation(data.location || "");
        if (data && data.client_id) {
          const clientData = await apiRequest(`https://schirmer-s-notary-backend.onrender.com/clients/${data.client_id}`);
          setClient(clientData);
        }
      } catch (err) {
        setError("Failed to load request details");
      } finally {
        setLoading(false);
      }
    }
    fetchRequestDetail();
  }, [route.params.id]);

  const handleAction = async (action: "accept" | "deny") => {
    setActionLoading(true);
    setActionError("");
    try {
      const res = await apiRequest(
        `https://schirmer-s-notary-backend.onrender.com/jobs/${request.id}/${action}`,
        "POST"
      );
      if (res && res.message) {
        Alert.alert("Success", `Request ${action}ed.`);
        navigation.goBack();
      } else {
        setActionError(`Failed to ${action} request.`);
      }
    } catch {
      setActionError(`Failed to ${action} request.`);
    }
    setActionLoading(false);
  };

  const handleEdit = async () => {
    setActionLoading(true);
    setActionError("");
    try {
      await apiRequest(
        `https://schirmer-s-notary-backend.onrender.com/jobs/${request.id}/edit`,
        "PATCH",
        { date: editDate, location: editLocation }
      );
      setEditModalVisible(false);
      Alert.alert("Success", "Request updated.");
      navigation.goBack();
    } catch {
      setActionError("Failed to update request.");
    }
    setActionLoading(false);
  };

  const handleComplete = async () => {
    setActionLoading(true);
    setActionError("");
    try {
      await apiRequest(
        `https://schirmer-s-notary-backend.onrender.com/jobs/${request.id}/complete`,
        "POST"
      );
      Alert.alert("Success", "Request marked as complete.");
      navigation.goBack();
    } catch {
      setActionError("Failed to mark as complete.");
    }
    setActionLoading(false);
  };

  const handleDeleteRequest = async () => {
    setActionLoading(true);
    setActionError("");
    try {
      await apiRequest(
        `https://schirmer-s-notary-backend.onrender.com/jobs/${request.id}`,
        "DELETE"
      );
      Alert.alert("Deleted", "Request deleted.");
      navigation.goBack();
    } catch {
      setActionError("Failed to delete request.");
    }
    setActionLoading(false);
  };

  async function scanAndUploadDocument() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Camera permission is required to scan documents.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
      base64: false,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const { uri } = result.assets[0];
      const userId = 1;

      if (!request.journal_id) {
        Alert.alert('Please complete the journal entry before uploading a document.');
        return;
      }

      const formData = new FormData();
      formData.append('file', {
        uri,
        name: `scan_${Date.now()}.jpg`,
        type: 'image/jpeg',
      } as any);

      const response = await fetch(`https://schirmer-s-notary-backend.onrender.com/journal/${request.journal_id}/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-User-Id': String(userId),
        },
        body: formData,
      });

      if (response.ok) {
        Alert.alert('Document uploaded successfully!');
      } else {
        Alert.alert('Failed to upload document.');
      }
    }
  }

  const handleAddJournalEntry = async () => {
    setActionLoading(true);
    try {
      // Use the first signer for top-level fields
      const firstSigner = signers[0] || { name: "", address: "", phone: "" };

      const journalRes = await apiRequest(
        `https://schirmer-s-notary-backend.onrender.com/journal/new`,
        "POST",
        {
          date: journalDate,
          location: journalLocation,
          signer_name: firstSigner.name,
          signer_address: firstSigner.address,
          signer_phone: firstSigner.phone,
          signers: signers,
          document_type: documentType,
          id_verification: idVerification,
          notes: journalNotes,
        }
      );
      await apiRequest(
        `https://schirmer-s-notary-backend.onrender.com/jobs/${request.id}/complete`,
        "POST",
        { journal_id: journalRes.id }
      );
      Alert.alert("Journal entry added and booking marked as completed.");
      setJournalModalVisible(false);
      setActionLoading(false);
      navigation.goBack();
    } catch (err) {
      Alert.alert("Failed to add journal entry or mark booking completed.");
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: darkMode ? '#18181b' : '#f9fafb', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}>Loading...</Text>
      </SafeAreaView>
    );
  }
  if (error || !request) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: darkMode ? '#18181b' : '#f9fafb', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#ef4444' }}>{error || "Request not found."}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: darkMode ? '#18181b' : '#f9fafb' }}>
      <View style={{ flex: 1, padding: 16 }}>
        <View style={{ backgroundColor: darkMode ? '#27272a' : '#fff', padding: 16, borderRadius: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: darkMode ? '#fff' : '#222' }}>Request #{request.id}</Text>
          <Text style={{ color: darkMode ? '#d1d5db' : '#6b7280', marginBottom: 8 }}>
            Client: {client ? (client.company?.name || client.company || client.name) : `Client #${request.client_id}`}
          </Text>
          <Text style={{ color: darkMode ? '#d1d5db' : '#6b7280', marginBottom: 8 }}>Service: {request.service}</Text>
          <Text style={{ color: darkMode ? '#d1d5db' : '#6b7280', marginBottom: 8 }}>Urgency: {request.urgency}</Text>
          <Text style={{ color: darkMode ? '#d1d5db' : '#6b7280', marginBottom: 8 }}>Notes: {request.notes}</Text>
          <Text style={{ color: darkMode ? '#d1d5db' : '#6b7280', marginBottom: 8 }}>Status: {request.status}</Text>
          {request.date && (
            <Text style={{ color: darkMode ? '#d1d5db' : '#6b7280', marginBottom: 8 }}>Date of Service: {request.date}</Text>
          )}
          {request.time && (
            <Text style={{ color: darkMode ? '#d1d5db' : '#6b7280', marginBottom: 8 }}>Time: {request.time}</Text>
          )}
          {request.location && (
            <Text style={{ color: darkMode ? '#d1d5db' : '#6b7280', marginBottom: 8 }}>Location: {request.location}</Text>
          )}

          {request.status === "pending" && (
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <TouchableOpacity
                onPress={() => handleAction("accept")}
                disabled={actionLoading}
                style={{ backgroundColor: '#16a34a', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16, marginRight: 8 }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleAction("deny")}
                disabled={actionLoading}
                style={{ backgroundColor: '#ef4444', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16 }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Decline</Text>
              </TouchableOpacity>
            </View>
          )}

          {request.status === "accepted" && (
            <>
              <TouchableOpacity
                onPress={() => setEditModalVisible(true)}
                style={{ backgroundColor: '#2563eb', borderRadius: 8, padding: 10, marginTop: 12, alignSelf: 'flex-start' }}
              >
                <Text style={{ color: '#fff', textAlign: 'center' }}>Edit Appointment</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={scanAndUploadDocument}
                style={{ backgroundColor: '#22c55e', borderRadius: 8, padding: 10, marginTop: 12, alignSelf: 'flex-start' }}
              >
                <Text style={{ color: '#fff', textAlign: 'center' }}>Scan & Upload Document</Text>
              </TouchableOpacity>
            </>
          )}

          {request.status !== "denied" && request.status !== "completed" && (
            <TouchableOpacity
              onPress={() => {
                const today = new Date();
                const yyyy = today.getFullYear();
                const mm = String(today.getMonth() + 1).padStart(2, '0');
                const dd = String(today.getDate()).padStart(2, '0');
                setJournalDate(`${yyyy}-${mm}-${dd}`);
                setJournalModalVisible(true);
              }}
              disabled={actionLoading}
              style={{ backgroundColor: '#a855f7', borderRadius: 8, padding: 10, marginTop: 12, alignSelf: 'flex-start' }}
            >
              <Text style={{ color: '#fff', textAlign: 'center' }}>Mark Service as Complete</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleDeleteRequest}
            disabled={actionLoading}
            style={{ backgroundColor: '#ef4444', borderRadius: 8, padding: 10, marginTop: 12, alignSelf: 'flex-start' }}
          >
            <Text style={{ color: '#fff', textAlign: 'center' }}>Delete Request</Text>
          </TouchableOpacity>
        </View>

        <Modal visible={editModalVisible} transparent animationType="slide">
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#00000088" }}>
            <View style={{ backgroundColor: darkMode ? '#27272a' : '#fff', padding: 20, borderRadius: 10, width: "80%" }}>
              <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8, color: darkMode ? '#fff' : '#222' }}>Edit Service Request</Text>
              <TextInput
                placeholder="Date (YYYY-MM-DD)"
                placeholderTextColor={darkMode ? '#888' : '#999'}
                value={editDate}
                onChangeText={setEditDate}
                style={{ borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 5, padding: 8, marginBottom: 10, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff' }}
              />
              <TextInput
                placeholder="Location"
                placeholderTextColor={darkMode ? '#888' : '#999'}
                value={editLocation}
                onChangeText={setEditLocation}
                style={{ borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 5, padding: 8, marginBottom: 10, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff' }}
              />
              <TouchableOpacity
                onPress={handleEdit}
                disabled={actionLoading}
                style={{ backgroundColor: '#2563eb', borderRadius: 8, padding: 10, marginBottom: 8 }}
              >
                <Text style={{ color: '#fff', textAlign: 'center' }}>Save Changes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                style={{ backgroundColor: darkMode ? '#444' : '#e5e7eb', borderRadius: 8, padding: 10 }}
              >
                <Text style={{ color: darkMode ? '#fff' : '#222', textAlign: 'center' }}>Cancel</Text>
              </TouchableOpacity>
              {actionError ? <Text style={{ color: '#ef4444', marginTop: 8 }}>{actionError}</Text> : null}
            </View>
          </View>
        </Modal>

        <Modal visible={journalModalVisible} transparent animationType="slide">
          <View style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#00000088"
          }}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={{ width: "100%", alignItems: "center" }}
            >
              <View style={{
                backgroundColor: darkMode ? '#27272a' : '#fff',
                padding: 20,
                borderRadius: 10,
                width: "90%",
                maxHeight: "80%",
                flex: 0
              }}>
                <ScrollView
                  contentContainerStyle={{ paddingBottom: 16 }}
                  showsVerticalScrollIndicator={true}
                >
                  <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8, color: darkMode ? '#fff' : '#222' }}>Add Journal Entry</Text>
                  <TextInput
                    placeholder="Date (YYYY-MM-DD)"
                    value={journalDate}
                    onChangeText={setJournalDate}
                    style={{ borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 5, padding: 8, marginBottom: 10, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff' }}
                  />
                  <TextInput
                    placeholder="Location"
                    value={journalLocation}
                    onChangeText={setJournalLocation}
                    style={{ borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 5, padding: 8, marginBottom: 10, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff' }}
                  />
                  {signers.map((signer, idx) => (
                    <View key={idx} style={{ marginBottom: 12, borderBottomWidth: 1, borderColor: darkMode ? '#444' : '#ccc', paddingBottom: 8 }}>
                      <Text style={{ fontWeight: 'bold', color: darkMode ? '#fff' : '#222' }}>Signer {idx + 1}</Text>
                      <TextInput
                        placeholder="Signer Name"
                        value={signer.name}
                        onChangeText={v => updateSigner(idx, "name", v)}
                        style={{ borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 5, padding: 8, marginBottom: 6, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff' }}
                      />
                      <TextInput
                        placeholder="Signer Address"
                        value={signer.address}
                        onChangeText={v => updateSigner(idx, "address", v)}
                        style={{ borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 5, padding: 8, marginBottom: 6, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff' }}
                      />
                      <TextInput
                        placeholder="Signer Phone"
                        value={signer.phone}
                        onChangeText={v => updateSigner(idx, "phone", v)}
                        style={{ borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 5, padding: 8, marginBottom: 6, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff' }}
                      />
                      {signers.length > 1 && (
                        <TouchableOpacity
                          onPress={() => removeSigner(idx)}
                          style={{ backgroundColor: '#ef4444', borderRadius: 8, padding: 6, alignSelf: 'flex-start', marginBottom: 4 }}
                        >
                          <Text style={{ color: '#fff' }}>Remove Signer</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                  
                  <TextInput
                    placeholder="Document Type"
                    value={documentType}
                    onChangeText={setDocumentType}
                    style={{ borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 5, padding: 8, marginBottom: 10, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff' }}
                  />
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                    <Text style={{ color: darkMode ? '#fff' : '#222', marginRight: 8 }}>ID Verified?</Text>
                    <TouchableOpacity
                      onPress={() => setIdVerification(!idVerification)}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: idVerification ? '#22c55e' : '#e5e7eb',
                        borderWidth: 1,
                        borderColor: darkMode ? '#444' : '#ccc',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      {idVerification && <Text style={{ color: '#fff', fontWeight: 'bold' }}>✓</Text>}
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    placeholder="Notes"
                    value={journalNotes}
                    onChangeText={setJournalNotes}
                    style={{ borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 5, padding: 8, marginBottom: 10, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff' }}
                    multiline
                    numberOfLines={4}
                  />
                  
                  <TouchableOpacity
                    style={{ backgroundColor: '#a855f7', borderRadius: 8, padding: 10, marginBottom: 8 }}
                    onPress={handleAddJournalEntry}
                    disabled={actionLoading}
                  >           
                    <Text style={{ color: '#fff', textAlign: 'center' }}>Save & Complete Booking</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={addSigner}
                    style={{ backgroundColor: '#2563eb', borderRadius: 8, padding: 10, marginBottom: 8 }}
                    activeOpacity={0.7}
                  >
                    <Text style={{ color: '#fff', textAlign: 'center' }}>Add Another Signer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ backgroundColor: darkMode ? '#444' : '#e5e7eb', borderRadius: 8, padding: 10 }}
                    onPress={() => setJournalModalVisible(false)}
                  >
                    <Text style={{ color: darkMode ? '#fff' : '#222', textAlign: 'center' }}>Cancel</Text>
                  </TouchableOpacity>
                  {actionError ? <Text style={{ color: '#ef4444', marginTop: 8 }}>{actionError}</Text> : null}
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}