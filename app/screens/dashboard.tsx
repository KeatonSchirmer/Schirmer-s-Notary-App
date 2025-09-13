import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from '@react-navigation/native';
import apiRequest from "../../api";
import DropDownPicker from 'react-native-dropdown-picker';
import { useTheme } from "../../constants/ThemeContext";

interface Appointment {
  id: number;
  name: string;
  start_date: string;
  location: string;
}

interface RequestItem {
  id: number;
  name: string;
  status: string;
}

export default function Dashboard() {
  const navigation = useNavigation();
  const { darkMode } = useTheme();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [mileage, setMileage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const userId = 1;
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [company, setCompany] = useState("");
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseType, setExpenseType] = useState("expense");
  const [expenseCategory, setExpenseCategory] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownItems, setDropdownItems] = useState([
    { label: 'Expense', value: 'expense' },
    { label: 'Profit', value: 'earning' }
  ]);

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      setError("");
      try {
  const appointmentsData = await apiRequest("https://schirmer-s-notary-backend.onrender.com/calendar/local", "GET", null, { "X-User-Id": String(userId) });
  const requestsData = await apiRequest("https://schirmer-s-notary-backend.onrender.com/jobs/", "GET", null, { "X-User-Id": String(userId) });
        setAppointments(appointmentsData.events || []);
        setRequests(requestsData || []);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to load dashboard data");
        }
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  useEffect(() => {
    async function fetchMileage() {
      try {
  const mileageData = await apiRequest("https://schirmer-s-notary-backend.onrender.com/mileage/weekly", "GET", null, { "X-User-Id": String(userId) });
        setMileage(mileageData.weekly_mileage || 0);
      } catch (err) {
        console.error(err);
      }
    }
    fetchMileage();
  }, []);

  const handleAddClient = async () => {
        try {
  await apiRequest("https://schirmer-s-notary-backend.onrender.com/clients/", "POST", {
        name: clientName,
        email: clientEmail,
        company: company
      } as any, { "X-User-Id": String(userId) });
      setShowClientModal(false);
      setClientName("");
      setClientEmail("");
      setCompany("");
    } catch (err) {
    }
  };

  const handleAddExpense = async () => {
    try {
  await apiRequest("https://schirmer-s-notary-backend.onrender.com/finances/", "POST", {
        category: expenseCategory,
        amount: parseFloat(expenseAmount),
        description: expenseDescription,
        type: expenseType,
        date: new Date().toISOString().slice(0, 10)
      } as any, { "X-User-Id": String(userId) });
      setShowExpenseModal(false);
      setExpenseCategory("");
      setExpenseAmount("");
      setExpenseDescription("");
      setExpenseType("expense");
      Alert.alert("Success", `${expenseType === "expense" ? "Expense" : "Profit"} added.`);
    } catch (err) {
      Alert.alert("Error", `Failed to add ${expenseType === "expense" ? "expense" : "profit"} report.`);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: darkMode ? '#18181b' : '#f9fafb' }}>
      <ScrollView style={{ flex: 1, padding: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8, color: darkMode ? '#fff' : '#222' }}>Hello, Keaton</Text>
        <Text style={{ color: darkMode ? '#d1d5db' : '#6b7280', marginBottom: 24 }}>{new Date().toDateString()}</Text>

        <TouchableOpacity
            onPress={() => (navigation as any).navigate("More", { screen: "Calendar" })}
        >
        <View style={{ backgroundColor: darkMode ? '#27272a' : '#fff', padding: 16, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12, color: darkMode ? '#fff' : '#222' }}>Today's Appointments</Text>
          {loading ? (
            <Text style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}>Loading...</Text>
          ) : error ? (
            <Text style={{ color: '#ef4444' }}>{error}</Text>
          ) : appointments.length === 0 ? (
            <Text style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}>No appointments scheduled.</Text>
          ) : (
            appointments.map((appt) => (
              <Text key={appt.id} style={{ color: darkMode ? '#d1d5db' : '#222' }}>
                {appt.name} - {appt.start_date} @ {appt.location}
              </Text>
            ))
          )}
        </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("Requests" as never)}
        >
        <View style={{ backgroundColor: darkMode ? '#27272a' : '#fff', padding: 16, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12, color: darkMode ? '#fff' : '#222' }}>Recent Requests</Text>
          {loading ? (
            <Text style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}>Loading...</Text>
          ) : error ? (
            <Text style={{ color: '#ef4444' }}>{error}</Text>
          ) : requests.length === 0 ? (
            <Text style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}>No requests pending.</Text>
          ) : (
            requests.map((req) => (
              <Text key={req.id} style={{ color: darkMode ? '#d1d5db' : '#222' }}>
                {req.name} - {req.status}
              </Text>
            ))
          )}
        </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("Mileage" as never)}
        >
        <View style={{ backgroundColor: darkMode ? '#27272a' : '#fff', padding: 16, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, marginBottom: 32 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12, color: darkMode ? '#fff' : '#222' }}>Mileage This Week</Text>
          <Text style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}>{mileage} miles tracked</Text>
        </View>
        </TouchableOpacity> 

        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
          <TouchableOpacity
            style={{ backgroundColor: '#2563eb', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 24, marginRight: 8, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4 }}
            onPress={() => setShowClientModal(true)}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>+ Client</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ backgroundColor: '#16a34a', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 24, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4 }}
            onPress={() => setShowExpenseModal(true)}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>+ Expenses</Text>
          </TouchableOpacity>
        </View>

        <Modal visible={showClientModal} transparent animationType="slide">
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#00000088" }}>
            <View style={{ backgroundColor: darkMode ? '#27272a' : '#fff', padding: 20, borderRadius: 10, width: "80%" }}>
              <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 8, color: darkMode ? '#fff' : '#222' }}>Add New Client</Text>
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

        <Modal visible={showExpenseModal} transparent animationType="slide">
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#00000088" }}>
            <View style={{ backgroundColor: darkMode ? '#27272a' : '#fff', padding: 20, borderRadius: 10, width: "80%" }}>
              <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 8, color: darkMode ? '#fff' : '#222' }}>Add Profit/Expense</Text>
              <DropDownPicker
                open={dropdownOpen}
                value={expenseType}
                items={dropdownItems}
                setOpen={setDropdownOpen}
                setValue={setExpenseType}
                setItems={setDropdownItems}
                containerStyle={{ marginBottom: 10 }}
                style={{ borderColor: darkMode ? '#444' : '#ccc' }}
              />
              <TextInput
                placeholder="Amount"
                placeholderTextColor={darkMode ? '#888' : '#999'}
                value={expenseAmount}
                onChangeText={setExpenseAmount}
                style={{ borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 5, padding: 8, marginBottom: 10, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff' }}
                keyboardType="numeric"
              />
              <TextInput
                placeholder="Description"
                placeholderTextColor={darkMode ? '#888' : '#999'}
                value={expenseDescription}
                onChangeText={setExpenseDescription}
                style={{ borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 5, padding: 8, marginBottom: 10, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff' }}
              />
              <TouchableOpacity style={{ backgroundColor: '#16a34a', borderRadius: 8, padding: 10, marginBottom: 8 }} onPress={handleAddExpense}>
                <Text style={{ color: '#fff', textAlign: 'center' }}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ backgroundColor: darkMode ? '#444' : '#e5e7eb', borderRadius: 8, padding: 10 }} onPress={() => setShowExpenseModal(false)}>
                <Text style={{ color: darkMode ? '#fff' : '#222', textAlign: 'center' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}