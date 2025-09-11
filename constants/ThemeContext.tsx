import React, { createContext, useContext, useState, useEffect } from "react";
import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ThemeContext = createContext({
  darkMode: false,
  setDarkMode: (value: boolean) => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("darkMode").then((val) => {
      if (val !== null) setDarkMode(val === "true");
      else setDarkMode(Appearance.getColorScheme() === "dark");
    });
  }, []);

  const updateDarkMode = (value: boolean) => {
    setDarkMode(value);
    AsyncStorage.setItem("darkMode", value ? "true" : "false");
  };

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode: updateDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
