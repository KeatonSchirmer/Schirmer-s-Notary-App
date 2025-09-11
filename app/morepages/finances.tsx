import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Modal, TouchableOpacity, TextInput, Alert } from "react-native";
import { Picker } from "@react-native-picker/picker";
import DropDownPicker from 'react-native-dropdown-picker';
import apiRequest from "../../api";
import { useTheme } from "../../constants/ThemeContext";

type Finance = {
  id: number;
  type: "earning" | "expense";
  category: string;
  description?: string;
  amount: number;
  date: string;
  created_at: string;
};

export default function FinancesScreen() {
  const { darkMode } = useTheme();
  const [finances, setFinances] = useState<Finance[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editFinance, setEditFinance] = useState<Finance | null>(null);
  const [editType, setEditType] = useState("expense");
  const [editCategory, setEditCategory] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDropdownOpen, setEditDropdownOpen] = useState(false);
  const [editDropdownItems, setEditDropdownItems] = useState([
    { label: 'Expense', value: 'expense' },
    { label: 'Profit', value: 'earning' }
  ]);

  // Auto-refresh finances after add/edit
  const fetchFinances = () => {
    setLoading(true);
  apiRequest("/finances", "GET")
      .then((data) => setFinances(data))
      .catch(() => setFinances([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFinances();
  }, []);

  const handleAddExpense = async () => {
    try {
  await apiRequest("/finances", "POST", {
        category: expenseCategory,
        amount: parseFloat(expenseAmount),
        description: expenseDescription,
        type: expenseType,
        date: new Date().toISOString().slice(0, 10)
      } as any);
      setShowExpenseModal(false);
      setExpenseCategory("");
      setExpenseAmount("");
      setExpenseDescription("");
      setExpenseType("expense");
      fetchFinances();
      Alert.alert("Success", `${expenseType === "expense" ? "Expense" : "Profit"} added.`);
    } catch (err) {
      Alert.alert("Error", `Failed to add ${expenseType === "expense" ? "expense" : "profit"} report.`);
    }
  };

  const openEditModal = (f: Finance) => {
    setEditFinance(f);
    setEditType(f.type);
    setEditCategory(f.category);
    setEditAmount(f.amount.toString());
    setEditDescription(f.description || "");
    setEditModalVisible(true);
  };

  const handleEditExpense = async () => {
    if (!editFinance) return;
    try {
  await apiRequest(`/finances/${editFinance.id}`, "PUT", {
        category: editCategory,
        amount: parseFloat(editAmount),
        description: editDescription,
        type: editType,
        date: editFinance.date
      } as any);
      setEditModalVisible(false);
      fetchFinances();
      Alert.alert("Success", "Transaction updated.");
    } catch (err) {
      Alert.alert("Error", "Failed to update transaction.");
    }
  };

  const handleDeleteExpense = async () => {
    if (!editFinance) return;
    try {
  await apiRequest(`/finances/${editFinance.id}`, "DELETE");
      setEditModalVisible(false);
      fetchFinances();
      Alert.alert("Success", "Transaction deleted.");
    } catch (err) {
      Alert.alert("Error", "Failed to delete transaction.");
    }
  };

  const earnings = finances.filter((f) => f.type === "earning");
  const expenses = finances.filter((f) => f.type === "expense");
  const totalEarnings = earnings.reduce((sum, f) => sum + f.amount, 0);
  const totalExpenses = expenses.reduce((sum, f) => sum + f.amount, 0);
  const netIncome = totalEarnings - totalExpenses;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: darkMode ? '#18181b' : '#f9fafb', padding: 16 }}>
      {/* Summary Cards */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
        <View style={{ backgroundColor: darkMode ? '#14532d' : '#bbf7d0', borderRadius: 16, padding: 16, flex: 1, marginRight: 8 }}>
          <Text style={{ fontSize: 14, color: darkMode ? '#d1d5db' : '#166534' }}>Earnings</Text>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#22c55e' }}>${totalEarnings.toFixed(2)}</Text>
        </View>
        <View style={{ backgroundColor: darkMode ? '#7f1d1d' : '#fecaca', borderRadius: 16, padding: 16, flex: 1, marginLeft: 8 }}>
          <Text style={{ fontSize: 14, color: darkMode ? '#fca5a5' : '#991b1b' }}>Expenses</Text>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#ef4444' }}>${totalExpenses.toFixed(2)}</Text>
        </View>
      </View>

      <View style={{ backgroundColor: darkMode ? '#27272a' : '#fff', padding: 16, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, marginBottom: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8, color: darkMode ? '#fff' : '#222' }}>Net Income</Text>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: darkMode ? '#fff' : '#222' }}>${netIncome.toFixed(2)}</Text>
      </View>

      {/* Transaction List */}
      <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16, color: darkMode ? '#fff' : '#222' }}>Recent Transactions</Text>
      <TouchableOpacity
        style={{ backgroundColor: '#22c55e', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 999, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, marginBottom: 16, alignSelf: 'flex-end' }}
        onPress={() => setShowExpenseModal(true)}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>+ Expenses</Text>
      </TouchableOpacity>
      <Modal visible={showExpenseModal} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#00000088" }}>
          <View style={{ backgroundColor: darkMode ? '#27272a' : '#fff', padding: 20, borderRadius: 10, width: "80%" }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8, color: darkMode ? '#fff' : '#222' }}>Add Profit/Expense</Text>
            <DropDownPicker
              open={dropdownOpen}
              value={expenseType}
              items={dropdownItems}
              setOpen={setDropdownOpen}
              setValue={setExpenseType}
              setItems={setDropdownItems}
              containerStyle={{ marginBottom: 10 }}
              style={{ borderColor: darkMode ? '#444' : '#ccc', backgroundColor: darkMode ? '#18181b' : '#fff' }}
              textStyle={{ color: darkMode ? '#fff' : '#222' }}
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
            <TouchableOpacity style={{ backgroundColor: '#22c55e', borderRadius: 8, padding: 10, marginBottom: 8 }} onPress={handleAddExpense}>
              <Text style={{ color: '#fff', textAlign: 'center' }}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ backgroundColor: darkMode ? '#444' : '#e5e7eb', borderRadius: 8, padding: 10 }} onPress={() => setShowExpenseModal(false)}>
              <Text style={{ color: darkMode ? '#fff' : '#222', textAlign: 'center' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {loading ? (
        <ActivityIndicator size="large" color={darkMode ? '#d1d5db' : '#888'} />
      ) : finances.length === 0 ? (
        <Text style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}>No transactions found.</Text>
      ) : (
        finances.map((f) => (
          <View key={f.id} style={{ backgroundColor: darkMode ? '#27272a' : '#fff', padding: 16, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, marginBottom: 8 }}>
            <Text style={{ fontWeight: '500', color: darkMode ? '#fff' : '#222' }}>{f.category}</Text>
            <Text style={{ fontSize: 14, color: f.type === 'earning' ? '#22c55e' : '#ef4444' }}>
              {f.type === "earning" ? "+" : "-"} ${f.amount.toFixed(2)} — {new Date(f.date).toLocaleDateString()}
            </Text>
            {f.description && (
              <Text style={{ fontSize: 12, color: darkMode ? '#d1d5db' : '#6b7280', marginTop: 4 }}>{f.description}</Text>
            )}
            <TouchableOpacity style={{ backgroundColor: '#2563eb', borderRadius: 8, padding: 8, marginTop: 8, alignSelf: 'flex-end' }} onPress={() => openEditModal(f)}>
              <Text style={{ color: '#fff', textAlign: 'center' }}>Edit</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#00000088" }}>
          <View style={{ backgroundColor: darkMode ? '#27272a' : '#fff', padding: 20, borderRadius: 10, width: "80%" }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8, color: darkMode ? '#fff' : '#222' }}>Edit Transaction</Text>
            <DropDownPicker
              open={editDropdownOpen}
              value={editType}
              items={editDropdownItems}
              setOpen={setEditDropdownOpen}
              setValue={setEditType}
              setItems={setEditDropdownItems}
              containerStyle={{ marginBottom: 10 }}
              style={{ borderColor: darkMode ? '#444' : '#ccc', backgroundColor: darkMode ? '#18181b' : '#fff' }}
              textStyle={{ color: darkMode ? '#fff' : '#222' }}
            />
            <TextInput
              placeholder="Amount"
              placeholderTextColor={darkMode ? '#888' : '#999'}
              value={editAmount}
              onChangeText={setEditAmount}
              style={{ borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 5, padding: 8, marginBottom: 10, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff' }}
              keyboardType="numeric"
            />
            <TextInput
              placeholder="Description"
              placeholderTextColor={darkMode ? '#888' : '#999'}
              value={editDescription}
              onChangeText={setEditDescription}
              style={{ borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 5, padding: 8, marginBottom: 10, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff' }}
            />
            <TouchableOpacity style={{ backgroundColor: '#22c55e', borderRadius: 8, padding: 10, marginBottom: 8 }} onPress={handleEditExpense}>
              <Text style={{ color: '#fff', textAlign: 'center' }}>Save Changes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ backgroundColor: '#ef4444', borderRadius: 8, padding: 10, marginBottom: 8 }} onPress={handleDeleteExpense}>
              <Text style={{ color: '#fff', textAlign: 'center' }}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ backgroundColor: darkMode ? '#444' : '#e5e7eb', borderRadius: 8, padding: 10 }} onPress={() => setEditModalVisible(false)}>
              <Text style={{ color: darkMode ? '#fff' : '#222', textAlign: 'center' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}