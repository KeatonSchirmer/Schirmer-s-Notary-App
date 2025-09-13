import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, Switch } from "react-native";
import apiRequest from "../api";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

export default function LoginScreen({ navigation, setLoggedIn }: { navigation?: any; setLoggedIn: (val: boolean) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricOptIn, setBiometricOptIn] = useState(false);

  useEffect(() => {
    const checkBiometric = async () => {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(hasHardware && isEnrolled);
      const optIn = await SecureStore.getItemAsync("biometricOptIn");
      setBiometricOptIn(optIn === "true");
    };
    checkBiometric();
  }, []);

  useEffect(() => {
    // Automatically try biometric login if enabled and available
    const tryBiometricLogin = async () => {
      if (biometricAvailable && biometricOptIn) {
        try {
          const result = await LocalAuthentication.authenticateAsync({ promptMessage: "Authenticate to sign in" });
          if (result.success) {
            const savedEmail = await SecureStore.getItemAsync("biometricEmail");
            const savedPassword = await SecureStore.getItemAsync("biometricPassword");
            if (savedEmail && savedPassword) {
              setLoading(true);
              try {
                const data = await apiRequest("https://schirmer-s-notary-backend.onrender.com/auth/login", "POST", {
                  email: savedEmail,
                  password: savedPassword,
                  role: "admin"
                });
                setLoggedIn(true);
              } catch (err: any) {
              } finally {
                setLoading(false);
              }
            }
          }
        } catch (err: any) {
        }
      }
    };
    tryBiometricLogin();
  }, [biometricAvailable, biometricOptIn]);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("https://schirmer-s-notary-backend.onrender.com/auth/login", "POST", {
        email,
        password,
        role: "admin"
      });
      setLoggedIn(true);
      // If biometric is enabled, update credentials
      if (biometricAvailable && biometricOptIn) {
        await SecureStore.setItemAsync("biometricEmail", email);
        await SecureStore.setItemAsync("biometricPassword", password);
      }
    } catch (err: any) {
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    if (!biometricOptIn) {
      return;
    }
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !isEnrolled) {
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({ promptMessage: "Authenticate to sign in" });
      if (result.success) {
        const savedEmail = await SecureStore.getItemAsync("biometricEmail");
        const savedPassword = await SecureStore.getItemAsync("biometricPassword");
        if (savedEmail && savedPassword) {
          setLoading(true);
          try {
            const data = await apiRequest("https://schirmer-s-notary-backend.onrender.com/auth/login", "POST", {
              email: savedEmail,
              password: savedPassword,
              role: "admin"
            });
            setLoggedIn(true);
          } catch (err: any) {
          } finally {
            setLoading(false);
          }
        }
      }
    } catch (err: any) {
    }
  };

  const handleBiometricSwitch = async (value: boolean) => {
    setBiometricOptIn(value);
    await SecureStore.setItemAsync("biometricOptIn", value ? "true" : "false");
    if (!value) {
      await SecureStore.deleteItemAsync("biometricEmail");
      await SecureStore.deleteItemAsync("biometricPassword");
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
      {biometricAvailable && (
        <View className="w-full flex-row items-center mt-4 mb-2">
          <Switch
            value={biometricOptIn}
            onValueChange={handleBiometricSwitch}
          />
          <Text className="ml-3 text-lg" style={{ color: biometricOptIn ? '#2563eb' : '#888' }}>
            Enable Biometric Login
          </Text>
        </View>
      )}
    </View>
  );
}
