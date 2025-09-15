type ClientsScreenProps = {
  navigation: StackNavigationProp<any>;
};
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useTheme } from "../../constants/ThemeContext";
import apiRequest from "../../api";
type Client = {
  id: string;
  name: string;
  email: string;
  company?: string;
};

type GroupedClients = {
  [company: string]: Client[];
};

const ClientsScreen: React.FC<ClientsScreenProps> = ({ navigation }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [company, setCompany] = useState("");
  const { darkMode } = useTheme();

  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      setError("");
      try {
  const data = await apiRequest("https://schirmer-s-notary-backend.onrender.com/clients/all");
        setClients(data.clients || []);
      } catch (err) {
        setError("Failed to load clients");
      }
      setLoading(false);
    };
    fetchClients();
  }, []);

  const groupedClients: GroupedClients = clients.reduce((acc: GroupedClients, client: Client) => {
    const comp = client.company && client.company !== "" ? client.company : client.name;
    if (!acc[comp]) acc[comp] = [];
    acc[comp].push(client);
    return acc;
  }, {});
  const companyNames = Object.keys(groupedClients);

  const handleAddClient = async () => {
    if (!clientName || !clientEmail) {
      Alert.alert("Error", "Name and Email are required.");
      return;
    }
    try {
      const res = await apiRequest("https://schirmer-s-notary-backend.onrender.com/clients/create", "POST", {
        name: clientName,
        email: clientEmail,
        company: company
      } as any);
      if (res && res.error) {
        Alert.alert("Error", res.error);
        return;
      }
      setShowClientModal(false);
      setClientName("");
      setClientEmail("");
      setCompany("");
      Alert.alert("Success", "Client added successfully.");
      const data = await apiRequest("https://schirmer-s-notary-backend.onrender.com/clients/all");
      setClients(data.clients || []);
    } catch (err) {
      Alert.alert("Error", typeof err === 'string' ? err : (err && (err as any).message ? (err as any).message : "Failed to add client."));
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: darkMode ? '#18181b' : '#f9fafb' }}>
      <View style={{ flex: 1, padding: 16 }}>
        <TextInput
          placeholder="Search clients..."
          placeholderTextColor={darkMode ? '#888' : '#999'}
          style={{ backgroundColor: darkMode ? '#27272a' : '#fff', color: darkMode ? '#fff' : '#222', padding: 12, borderRadius: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8 }}
        />
        <ScrollView>
          {loading ? (
            <Text style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}>Loading...</Text>
          ) : error ? (
            <Text style={{ color: '#ef4444' }}>{error}</Text>
          ) : companyNames.length === 0 ? (
            <Text style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}>No clients found.</Text>
          ) : (
            companyNames.map((company) => (
              <TouchableOpacity
                key={company}
                style={{ backgroundColor: darkMode ? '#27272a' : '#fff', padding: 16, borderRadius: 16, marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8 }}
                onPress={() => {
                  const client = groupedClients[company][0];
                  if (!client.company || client.company === "") {
                    navigation.navigate("ClientDetail", { company: null, clientId: client.id, onDelete: async () => {
                      const data = await apiRequest("/contacts/all");
                      setClients(data.clients || []);
                    }});
                  } else {
                    navigation.navigate("ClientDetail", { company });
                  }
                }}
              >
                <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 8, color: darkMode ? '#fff' : '#222' }}>{company}</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
        <TouchableOpacity
          style={{ position: 'absolute', bottom: 24, right: 24, backgroundColor: '#2563eb', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4 }}
          onPress={() => setShowClientModal(true)}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>+ Client</Text>
        </TouchableOpacity>

        <Modal visible={showClientModal} transparent animationType="slide">
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#00000088' }}>
            <View style={{ backgroundColor: darkMode ? '#27272a' : '#fff', padding: 20, borderRadius: 10, width: '80%' }}>
              <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8, color: darkMode ? '#fff' : '#222' }}>Add New Client</Text>
              <TextInput
                placeholder="Name"
                placeholderTextColor={darkMode ? '#888' : '#999'}
                value={clientName}
                onChangeText={setClientName}
                style={{ borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 5, padding: 8, marginBottom: 10, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff' }}
              />
              <TextInput
                placeholder="Email"
                placeholderTextColor={darkMode ? '#888' : '#999'}
                value={clientEmail}
                onChangeText={setClientEmail}
                style={{ borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 5, padding: 8, marginBottom: 10, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff' }}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <TextInput
                placeholder="Company (optional)"
                placeholderTextColor={darkMode ? '#888' : '#999'}
                value={company}
                onChangeText={setCompany}
                style={{ borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 5, padding: 8, marginBottom: 10, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff' }}
              />
              <TouchableOpacity style={{ backgroundColor: '#2563eb', borderRadius: 8, padding: 10, marginBottom: 8 }} onPress={handleAddClient}>
                <Text style={{ color: '#fff', textAlign: 'center' }}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ backgroundColor: darkMode ? '#444' : '#e5e7eb', borderRadius: 8, padding: 10 }} onPress={() => setShowClientModal(false)}>
                <Text style={{ color: darkMode ? '#fff' : '#222', textAlign: 'center' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

export default ClientsScreen;