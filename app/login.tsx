import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import apiRequest from "../api";
import * as LocalAuthentication from "expo-local-authentication";

export default function LoginScreen({ navigation, setLoggedIn }: { navigation?: any; setLoggedIn: (val: boolean) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const tryBiometricLogin = async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (!hasHardware || !isEnrolled) return;
        const result = await LocalAuthentication.authenticateAsync({ promptMessage: "Authenticate to sign in" });
        if (result.success) {
          setLoggedIn(true);
        }
      } catch (err: any) {
        // Silent fail, user can still use button
      }
    };
    tryBiometricLogin();
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("http://192.168.0.218:5000/auth/login", "POST", {
        email,
        password,
        role: "admin"
      });
      Alert.alert("Login Successful", "Welcome back!");
      setLoggedIn(true);
    } catch (err: any) {
      Alert.alert("Login Failed", err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !isEnrolled) {
        Alert.alert("Biometric Login Not Available", "No biometric authentication found on this device.");
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({ promptMessage: "Authenticate to sign in" });
      if (result.success) {
        Alert.alert("Biometric Login Successful", "Welcome back!");
        setLoggedIn(true);
      } else {
        Alert.alert("Biometric Login Failed", result.error || "Authentication failed");
      }
    } catch (err: any) {
      Alert.alert("Biometric Error", err.message || "Could not authenticate");
    }
  };

  return (
    <View className="flex-1 justify-center items-center bg-gray-50 p-6">
      <Text className="text-2xl font-bold mb-6">Sign In</Text>
      <TextInput
        placeholder="Email"
        placeholderTextColor={"#999"}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        className="w-full bg-white rounded p-3 mb-4 border border-gray-300"
      />
      <TextInput
        placeholder="Password"
        placeholderTextColor={"#999"}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        className="w-full bg-white rounded p-3 mb-6 border border-gray-300"
      />
      <TouchableOpacity
        className="bg-green-600 rounded p-3 w-full"
        onPress={handleLogin}
        disabled={loading}
      >
        <Text className="text-white text-center text-lg">{loading ? "Signing In..." : "Sign In"}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        className="bg-blue-600 rounded p-3 w-full mt-4"
        onPress={handleBiometricLogin}
      >
        <Text className="text-white text-center text-lg">Sign In with Biometrics</Text>
      </TouchableOpacity>
    </View>
  );
}
