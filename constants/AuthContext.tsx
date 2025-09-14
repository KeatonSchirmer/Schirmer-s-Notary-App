import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  isLoggedIn: boolean;
  setLoggedIn: (val: boolean) => void;
  user: any;
  setUser: (user: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Load login state from AsyncStorage
    (async () => {
      const token = await AsyncStorage.getItem('token');
      setLoggedIn(!!token);
      // Optionally load user info here
    })();
  }, []);


  return (
    <AuthContext.Provider value={{ isLoggedIn, setLoggedIn, user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
