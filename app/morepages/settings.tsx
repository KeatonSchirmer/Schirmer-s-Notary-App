import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Switch, Alert, TextInput, Modal } from "react-native";
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiRequest from "../../api";
import { useTheme } from "../../constants/ThemeContext";

export default function SettingsScreen({ navigation, setLoggedIn }: { navigation?: any; setLoggedIn?: (val: boolean) => void }) {
  const { darkMode, setDarkMode } = useTheme();
  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    if (typeof setLoggedIn === 'function') setLoggedIn(false);
    Alert.alert("Logged Out", "You have been logged out.");
  };
  const [notifications, setNotifications] = useState(false);

  useEffect(() => {
    // Load notification preference from AsyncStorage
    (async () => {
      const stored = await AsyncStorage.getItem('notifications_enabled');
      if (stored !== null) setNotifications(stored === 'true');
    })();
  }, []);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  useEffect(() => {
    if (notifications) {
      registerForPushNotificationsAsync();
    }
  }, [notifications]);

  async function registerForPushNotificationsAsync() {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        Alert.alert('Permission required', 'Enable notifications in settings.');
        return;
      }
      const tokenData = await Notifications.getExpoPushTokenAsync();
      setExpoPushToken(tokenData.data);
  await apiRequest('https://schirmer-s-notary-backend.onrender.com/profile/update', 'PATCH', { push_token: tokenData.data } as any, { 'X-User-Id': String(userId) });
    } catch (err) {
  const errorMsg = (err && typeof err === 'object' && 'message' in err) ? (err as any).message : JSON.stringify(err);
  Alert.alert('Error', `Could not register for notifications: ${errorMsg}`);
      console.log('Notification registration error:', err);
    }
  }
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [show2FAEmailSent, setShow2FAEmailSent] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState("");

  const userId = 1;

  const handleUpdateEmail = async () => {
    try {
  await apiRequest('https://schirmer-s-notary-backend.onrender.com/profile/update', 'PATCH', { email: newEmail } as any, { 'X-User-Id': String(userId) });
      Alert.alert("Success", "Email updated successfully.");
      setShowEmailModal(false);
    } catch (err) {
      Alert.alert("Error", "Failed to update email.");
    }
  };

  const handleChangePassword = async () => {
    try {
  await apiRequest('https://schirmer-s-notary-backend.onrender.com/auth/change-password', 'PATCH', { password: newPassword } as any, { 'X-User-Id': String(userId) });
      Alert.alert("Success", "Password changed successfully.");
      setShowPasswordModal(false);
    } catch (err) {
      Alert.alert("Error", "Failed to change password.");
    }
  };

  const handleRequest2FA = async () => {
    try {
      await apiRequest('https://schirmer-s-notary-backend.onrender.com/profile/2fa-request', 'POST', null, { 'X-User-Id': String(userId) });
      setShow2FAEmailSent(true);
      Alert.alert("Confirmation Email Sent", "Check your email for a code to enable 2FA.");
    } catch (err) {
      Alert.alert("Error", "Failed to send confirmation email.");
    }
  };

  const handleConfirm2FA = async () => {
    try {
      await apiRequest('https://schirmer-s-notary-backend.onrender.com/profile/2fa-confirm', 'POST', { code: confirmationCode } as any, { 'X-User-Id': String(userId) });
      setTwoFactorEnabled(true);
      setShow2FAModal(false);
      setShow2FAEmailSent(false);
      setConfirmationCode("");
      Alert.alert("Success", "Two-Factor Authentication enabled.");
    } catch (err) {
      Alert.alert("Error", "Invalid or expired code.");
    }
  };

  const handleToggleNotifications = async (value: boolean) => {
    setNotifications(value);
    await AsyncStorage.setItem('notifications_enabled', value ? 'true' : 'false');
    try {
  await apiRequest('https://schirmer-s-notary-backend.onrender.com/profile/update', 'PATCH', { notifications_enabled: value } as any, { 'X-User-Id': String(userId) });
      if (value) {
        await registerForPushNotificationsAsync();
      } else {
        setExpoPushToken(null);
  await apiRequest('https://schirmer-s-notary-backend.onrender.com/profile/update', 'PATCH', { push_token: null } as any, { 'X-User-Id': String(userId) });
      }
    } catch (err) {
      Alert.alert("Error", "Failed to update notifications.");
    }
  };

  const handleToggleDarkMode = (value: boolean) => {
  setDarkMode(value);
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await apiRequest('https://schirmer-s-notary-backend.onrender.com/profile/delete', 'DELETE', null, { 'X-User-Id': String(userId) });
              Alert.alert("Account Deleted", "Your account has been deleted.");
            } catch (err) {
              Alert.alert("Error", "Failed to delete account.");
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: darkMode ? "#18181b" : "#f9fafb", padding: 16 }}>
      <View style={{ backgroundColor: darkMode ? "#27272a" : "#fff", borderRadius: 16, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8, padding: 24, marginBottom: 24, alignItems: "center" }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: "#16a34a", marginBottom: 12 }} />
        <Text style={{ fontSize: 20, fontWeight: "bold", color: darkMode ? "#fff" : "#222" }}>Keaton Schirmer</Text>
        <Text style={{ color: darkMode ? "#d1d5db" : "#6b7280" }}>Schirmer's Notary</Text>
      </View>

      <View style={{ backgroundColor: darkMode ? "#27272a" : "#fff", borderRadius: 16, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8, padding: 16, marginBottom: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 12, color: darkMode ? "#fff" : "#222" }}>Account</Text>
        <TouchableOpacity style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: darkMode ? "#444" : "#e5e7eb" }} onPress={() => setShowEmailModal(true)}>
          <Text style={{ color: darkMode ? "#fff" : "#222" }}>Update Email</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: darkMode ? "#444" : "#e5e7eb" }} onPress={() => setShowPasswordModal(true)}>
          <Text style={{ color: darkMode ? "#fff" : "#222" }}>Change Password</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ paddingVertical: 8 }} onPress={() => setShow2FAModal(true)}>
          <Text style={{ color: darkMode ? "#fff" : "#222" }}>Two-Factor Authentication</Text>
        </TouchableOpacity>
      </View>

      <View style={{ backgroundColor: darkMode ? "#27272a" : "#fff", borderRadius: 16, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8, padding: 16, marginBottom: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 12, color: darkMode ? "#fff" : "#222" }}>Preferences</Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: darkMode ? "#444" : "#e5e7eb" }}>
          <Text style={{ color: darkMode ? "#fff" : "#222" }}>Enable Notifications</Text>
          <Switch
            value={notifications}
            onValueChange={handleToggleNotifications}
            trackColor={{ true: "#16a34a", false: "#d1d5db" }}
          />
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 }}>
          <Text style={{ color: darkMode ? "#fff" : "#222" }}>Dark Mode</Text>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ true: "#16a34a", false: "#d1d5db" }}
          />
        </View>
      </View>

      <View style={{ backgroundColor: darkMode ? "#fee2e2" : "#fee2e2", borderRadius: 16, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8, padding: 16, marginBottom: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 12, color: "#b91c1c" }}>Danger Zone</Text>
        <TouchableOpacity style={{ paddingVertical: 8 }} onPress={handleDeleteAccount}>
          <Text style={{ color: "#b91c1c" }}>Delete Account</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={{ backgroundColor: darkMode ? '#ef4444' : '#ef4444', borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 32 }}
        onPress={handleLogout}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Logout</Text>
      </TouchableOpacity>

      <Modal visible={showEmailModal} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#00000088" }}>
          <View style={{ backgroundColor: darkMode ? "#27272a" : "#fff", padding: 20, borderRadius: 10, width: "80%" }}>
            <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 8, color: darkMode ? "#fff" : "#222" }}>Update Email</Text>
            <TextInput
              placeholder="New Email"
              value={newEmail}
              onChangeText={setNewEmail}
              style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 5, padding: 8, marginBottom: 10, color: darkMode ? "#fff" : "#222", backgroundColor: darkMode ? "#18181b" : "#fff" }}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor={darkMode ? "#888" : "#999"}
            />
            <TouchableOpacity style={{ backgroundColor: "#16a34a", borderRadius: 8, padding: 10, marginBottom: 8 }} onPress={handleUpdateEmail}>
              <Text style={{ color: "#fff", textAlign: "center" }}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ backgroundColor: darkMode ? "#444" : "#e5e7eb", borderRadius: 8, padding: 10 }} onPress={() => setShowEmailModal(false)}>
              <Text style={{ color: darkMode ? "#fff" : "#222", textAlign: "center" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showPasswordModal} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#00000088" }}>
          <View style={{ backgroundColor: darkMode ? "#27272a" : "#fff", padding: 20, borderRadius: 10, width: "80%" }}>
            <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 8, color: darkMode ? "#fff" : "#222" }}>Change Password</Text>
            <TextInput
              placeholder="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 5, padding: 8, marginBottom: 10, color: darkMode ? "#fff" : "#222", backgroundColor: darkMode ? "#18181b" : "#fff" }}
              secureTextEntry
              placeholderTextColor={darkMode ? "#888" : "#999"}
            />
            <TouchableOpacity style={{ backgroundColor: "#16a34a", borderRadius: 8, padding: 10, marginBottom: 8 }} onPress={handleChangePassword}>
              <Text style={{ color: "#fff", textAlign: "center" }}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ backgroundColor: darkMode ? "#444" : "#e5e7eb", borderRadius: 8, padding: 10 }} onPress={() => setShowPasswordModal(false)}>
              <Text style={{ color: darkMode ? "#fff" : "#222", textAlign: "center" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={show2FAModal} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#00000088" }}>
          <View style={{ backgroundColor: darkMode ? "#27272a" : "#fff", padding: 20, borderRadius: 10, width: "80%" }}>
            <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 8, color: darkMode ? "#fff" : "#222" }}>Two-Factor Authentication</Text>
            <Text style={{ color: darkMode ? "#d1d5db" : "#222", marginBottom: 16 }}>Enable extra security for your account.</Text>
            {!twoFactorEnabled && !show2FAEmailSent && (
              <TouchableOpacity style={{ backgroundColor: "#16a34a", borderRadius: 8, padding: 10, marginBottom: 8 }} onPress={handleRequest2FA}>
                <Text style={{ color: "#fff", textAlign: "center" }}>Send Confirmation Email</Text>
              </TouchableOpacity>
            )}
            {show2FAEmailSent && !twoFactorEnabled && (
              <>
                <TextInput
                  placeholder="Enter confirmation code"
                  value={confirmationCode}
                  onChangeText={setConfirmationCode}
                  style={{ borderWidth: 1, borderColor: darkMode ? "#444" : "#ccc", borderRadius: 5, padding: 8, marginBottom: 10, color: darkMode ? "#fff" : "#222", backgroundColor: darkMode ? "#18181b" : "#fff" }}
                  autoCapitalize="none"
                  placeholderTextColor={darkMode ? "#888" : "#999"}
                />
                <TouchableOpacity style={{ backgroundColor: "#16a34a", borderRadius: 8, padding: 10, marginBottom: 8 }} onPress={handleConfirm2FA}>
                  <Text style={{ color: "#fff", textAlign: "center" }}>Confirm 2FA Setup</Text>
                </TouchableOpacity>
              </>
            )}
            {twoFactorEnabled && (
              <Text style={{ color: "#16a34a", marginBottom: 8 }}>Two-Factor Authentication is enabled.</Text>
            )}
            <TouchableOpacity style={{ backgroundColor: darkMode ? "#444" : "#e5e7eb", borderRadius: 8, padding: 10 }} onPress={() => {
              setShow2FAModal(false);
              setShow2FAEmailSent(false);
              setConfirmationCode("");
            }}>
              <Text style={{ color: darkMode ? "#fff" : "#222", textAlign: "center" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}