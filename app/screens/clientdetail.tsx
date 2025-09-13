
import { View, Text, ScrollView, Modal, TextInput, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import apiRequest from "../../api";
import React, { useState, useEffect } from "react";
import { useTheme } from "../../constants/ThemeContext";

export default function ClientDetail({ route, navigation }: { route: any, navigation: any }) {
  const { darkMode } = useTheme();
  const { company } = route.params;
  const [contacts, setContacts] = useState<any[]>([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editContact, setEditContact] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editCompany, setEditCompany] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [companyRequests, setCompanyRequests] = useState<any[]>([]);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [isClientOnly, setIsClientOnly] = useState(false);

  // Fetch contacts for this company
  const fetchContacts = async () => {
    try {
      if (!company || company === "Other" || company === "" || company === null) {
        // Fetch all clients without a company
    const res = await apiRequest("https://schirmer-s-notary-backend.onrender.com/clients/all");
        const clientOnly = (res.clients || []).filter((c: any) => !c.company || c.company === "" || c.company === null);
        // Only show the selected client (from navigation)
        if (route.params && route.params.clientId) {
          const selected = clientOnly.find((c: any) => c.id === route.params.clientId);
          setContacts(selected ? [selected] : []);
        } else {
          setContacts([]);
        }
        setIsClientOnly(true);
      } else {
  const res = await apiRequest(`https://schirmer-s-notary-backend.onrender.com/clients/company/${encodeURIComponent(company)}`);
        setContacts(res.contacts || []);
        setIsClientOnly(false);
      }
    } catch {
      setContacts([]);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [company]);

  const openEditModal = (contact: any) => {
    setEditContact(contact);
    setEditName(contact.name || "");
    setEditEmail(contact.email || "");
    setEditCompany(contact.company || "");
    setEditPhone(contact.phone || "");
    setEditModalVisible(true);
  };

  const handleEditContact = async () => {
    if (!editContact) return;
    try {
  await apiRequest(`https://schirmer-s-notary-backend.onrender.com/contacts/${editContact.id}`, "PUT", {
        name: editName,
        email: editEmail,
        company: editCompany,
        phone: editPhone
      } as any);
      setEditModalVisible(false);
      Alert.alert("Success", "Contact updated.");
      await fetchContacts();
    } catch (err) {
      Alert.alert("Error", "Failed to update contact.");
    }
  };

  const handleDeleteContact = async () => {
    if (!editContact) return;
    try {
  await apiRequest(`https://schirmer-s-notary-backend.onrender.com/contacts/${editContact.id}`, "DELETE");
      setEditModalVisible(false);
      Alert.alert("Success", "Contact deleted.");
      // If solo client, navigate back to clients screen to remove card immediately
      if (isClientOnly) {
        if (route.params && typeof route.params.onDelete === 'function') {
          await route.params.onDelete();
        }
        navigation.goBack();
      } else {
        await fetchContacts();
      }
    } catch (err) {
      Alert.alert("Error", "Failed to delete contact.");
    }
  };

  const handleAddContact = async () => {
    try {
  await apiRequest("https://schirmer-s-notary-backend.onrender.com/contacts", "POST", {
        name: newName,
        email: newEmail,
        company,
        phone: newPhone
      } as any);
      setAddModalVisible(false);
      setNewName("");
      setNewEmail("");
      setNewPhone("");
      Alert.alert("Success", "Contact added.");
      await fetchContacts();
    } catch (err) {
      Alert.alert("Error", "Failed to add contact.");
    }
  };

  useEffect(() => {
    async function fetchCompanyRequests() {
      try {
    const res = await apiRequest(`https://schirmer-s-notary-backend.onrender.com/jobs/company/requests/${encodeURIComponent(company)}`);
        setCompanyRequests(res.requests || []);
      } catch {
        setCompanyRequests([]);
      }
    }
    fetchCompanyRequests();
  }, [company]);


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: darkMode ? '#18181b' : '#f9fafb' }}>
      <ScrollView style={{ flex: 1, backgroundColor: darkMode ? '#18181b' : '#f9fafb', padding: 16 }}>
        <View style={{ backgroundColor: darkMode ? '#27272a' : '#fff', padding: 16, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, marginBottom: 16 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8, color: darkMode ? '#fff' : '#222' }}>{isClientOnly ? "Client" : company}</Text>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8, color: darkMode ? '#fff' : '#222' }}>{isClientOnly ? "Client Info" : "Contacts"}</Text>
            {!isClientOnly && (
              <TouchableOpacity style={{ backgroundColor: '#2563eb', borderRadius: 8, padding: 10, marginBottom: 12, alignSelf: 'flex-end' }} onPress={() => setAddModalVisible(true)}>
                <Text style={{ color: '#fff', textAlign: 'center' }}>+ Add Contact</Text>
              </TouchableOpacity>
            )}
            {contacts && contacts.length > 0 ? (
              contacts.map((contact: any) => (
                <View key={contact.id} style={{ marginBottom: 12 }}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: darkMode ? '#fff' : '#222' }}>{contact.name}</Text>
                  <Text style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}>{contact.email}</Text>
                  {!isClientOnly && contact.phone && (
                    <Text style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}>Phone: {contact.phone}</Text>
                  )}
                  <TouchableOpacity style={{ backgroundColor: '#2563eb', borderRadius: 8, padding: 8, marginTop: 8 }} onPress={() => openEditModal(contact)}>
                    <Text style={{ color: '#fff', textAlign: 'center' }}>Edit</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}>{isClientOnly ? "No client info found." : "No contacts for this company."}</Text>
            )}
        </View>
        <View style={{ backgroundColor: darkMode ? '#27272a' : '#fff', padding: 16, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8, color: darkMode ? '#fff' : '#222' }}>Request/Service History</Text>
          {companyRequests.length === 0 ? (
            <Text style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}>No past requests.</Text>
          ) : (
            companyRequests.map((req: any) => (
              <Text key={req.id} style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}>
                {req.document_type} - {req.status}
              </Text>
            ))
          )}
        </View>
      </ScrollView>
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#00000088" }}>
          <View style={{ backgroundColor: darkMode ? '#27272a' : '#fff', padding: 20, borderRadius: 10, width: "80%" }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8, color: darkMode ? '#fff' : '#222' }}>Edit Contact</Text>
            <TextInput
              placeholder="Name"
              placeholderTextColor={darkMode ? '#888' : '#999'}
              value={editName}
              onChangeText={setEditName}
              style={{ borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 5, padding: 8, marginBottom: 10, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff' }}
            />
            <TextInput
              placeholder="Email"
              placeholderTextColor={darkMode ? '#888' : '#999'}
              value={editEmail}
              onChangeText={setEditEmail}
              style={{ borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 5, padding: 8, marginBottom: 10, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff' }}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              placeholder="Company"
              placeholderTextColor={darkMode ? '#888' : '#999'}
              value={editCompany}
              onChangeText={setEditCompany}
              style={{ borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 5, padding: 8, marginBottom: 10, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff' }}
            />
            <TextInput
              placeholder="Phone (optional)"
              placeholderTextColor={darkMode ? '#888' : '#999'}
              value={editPhone}
              onChangeText={setEditPhone}
              style={{ borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 5, padding: 8, marginBottom: 10, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff' }}
              keyboardType="phone-pad"
            />
            <TouchableOpacity style={{ backgroundColor: '#22c55e', borderRadius: 8, padding: 10, marginBottom: 8 }} onPress={handleEditContact}>
              <Text style={{ color: '#fff', textAlign: 'center' }}>Save Changes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ backgroundColor: '#ef4444', borderRadius: 8, padding: 10, marginBottom: 8 }} onPress={handleDeleteContact}>
              <Text style={{ color: '#fff', textAlign: 'center' }}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ backgroundColor: darkMode ? '#444' : '#e5e7eb', borderRadius: 8, padding: 10 }} onPress={() => setEditModalVisible(false)}>
              <Text style={{ color: darkMode ? '#fff' : '#222', textAlign: 'center' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal visible={addModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#00000088" }}>
          <View style={{ backgroundColor: darkMode ? '#27272a' : '#fff', padding: 20, borderRadius: 10, width: "80%" }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8, color: darkMode ? '#fff' : '#222' }}>Add New Contact</Text>
            <TextInput
              placeholder="Name"
              placeholderTextColor={darkMode ? '#888' : '#999'}
              value={newName}
              onChangeText={setNewName}
              style={{ borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 5, padding: 8, marginBottom: 10, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff' }}
            />
            <TextInput
              placeholder="Email"
              placeholderTextColor={darkMode ? '#888' : '#999'}
              value={newEmail}
              onChangeText={setNewEmail}
              style={{ borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 5, padding: 8, marginBottom: 10, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff' }}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              placeholder="Phone (optional)"
              placeholderTextColor={darkMode ? '#888' : '#999'}
              value={newPhone}
              onChangeText={setNewPhone}
              style={{ borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 5, padding: 8, marginBottom: 10, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff' }}
              keyboardType="phone-pad"
            />
            <TouchableOpacity style={{ backgroundColor: '#22c55e', borderRadius: 8, padding: 10, marginBottom: 8 }} onPress={handleAddContact}>
              <Text style={{ color: '#fff', textAlign: 'center' }}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ backgroundColor: darkMode ? '#444' : '#e5e7eb', borderRadius: 8, padding: 10 }} onPress={() => setAddModalVisible(false)}>
              <Text style={{ color: darkMode ? '#fff' : '#222', textAlign: 'center' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}