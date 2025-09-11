import React, { useState } from 'react';
import { Platform, View, TextInput, TouchableOpacity, Text } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons'; // install expo/vector-icons if needed

type Props = {
  value: string;
  onChange: (formattedDate: string) => void;
};

const formatDate = (date: Date) => {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
};

const parseInput = (input: string) => {
  const parts = input.split('/');
  if (parts.length === 3) {
    const [mm, dd, yyyy] = parts;
    const date = new Date(`${yyyy}-${mm}-${dd}`);
    if (!isNaN(date.getTime())) return formatDate(date);
  }
  return input;
};

const DatePickerInput = ({ value, onChange }: Props) => {
  const [showPicker, setShowPicker] = useState(false);

  const handleDateChange = (_event: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) {
      const formatted = formatDate(selectedDate);
      onChange(formatted);
    }
  };

  const parseDate = (input: string): Date => {
    const cleaned = input.replace(/\D/g, '');

    if (cleaned.length === 8) {
      const mm = cleaned.slice(0, 2);
      const dd = cleaned.slice(2, 4);
      const yyyy = cleaned.slice(4);
      const date = new Date(`${yyyy}-${mm}-${dd}`);
      if (!isNaN(date.getTime())) return date;
    }

    const parts = input.split('/');
    if (parts.length === 3) {
      const [mm, dd, yyyy] = parts;
      const date = new Date(`${yyyy}-${mm}-${dd}`);
      if (!isNaN(date.getTime())) return date;
    }

    return new Date(); // fallback to today if input is invalid
  };

  return (
    <View className="mb-4 relative">
      <View className="flex-row items-center border border-gray-300 rounded px-3 py-2">
        <TextInput
          value={value}
          onChangeText={(text) => onChange(parseInput(text))}
          placeholder="MM/DD/YYYY"
          placeholderTextColor="black"
          keyboardType="numeric"
          style={{ flex: 1 }}
        />
        <TouchableOpacity onPress={() => setShowPicker(true)}>
          <Ionicons name="calendar-outline" size={22} color="gray" />
        </TouchableOpacity>
      </View>

      {showPicker && (
        <DateTimePicker
          value={parseDate(value)}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
    </View>
  );
};

export default DatePickerInput;