import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import apiRequest from "../../api";
import { useTheme } from "../../constants/ThemeContext";


export default function Calendar() {
  const { darkMode } = useTheme();
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const prevFiller = Array.from(
    { length: firstDay },
    (_, i) => prevMonthDays - firstDay + i + 1
  );

  const currentDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const totalCells = 42;
  const nextFiller = Array.from(
    { length: totalCells - (prevFiller.length + currentDays.length) },
    (_, i) => i + 1
  );

  const calendarDays = [
    ...prevFiller.map((d) => ({ day: d, type: "prev" })),
    ...currentDays.map((d) => ({ day: d, type: "current" })),
    ...nextFiller.map((d) => ({ day: d, type: "next" })),
  ];

  const weeks = [];
  for (let i = 0; i < totalCells; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      setError("");
      try {
  const data = await apiRequest("https://schirmer-s-notary-backend.onrender.com/calendar/local");
        setEvents(data.events || []);
      } catch (err) {
        setError("Failed to load events");
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, [year, month]);

  return (
    <View style={{ flex: 1, backgroundColor: darkMode ? '#18181b' : '#f9fafb', padding: 16 }}>
      <View className="flex-row justify-between items-center mb-4">
        <TouchableOpacity
          onPress={() => {
            if (month === 0) {
              setMonth(11);
              setYear(year - 1);
            } else {
              setMonth(month - 1);
            }
            setSelectedDate(null);
          }}
        >
          <Text className="text-xl font-bold text-green-700">◀</Text>
        </TouchableOpacity>
  <Text style={{ fontSize: 20, fontWeight: 'bold', color: darkMode ? '#fff' : '#222' }}>{new Date(year, month).toLocaleString('default', { month: 'long' })} {year}</Text>
        <TouchableOpacity
          onPress={() => {
            if (month === 11) {
              setMonth(0);
              setYear(year + 1);
            } else {
              setMonth(month + 1);
            }
            setSelectedDate(null);
          }}
        >
          <Text className="text-xl font-bold text-green-700">▶</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <Text
            key={day}
            className="flex-1 text-center font-semibold text-gray-600"
          >
            {day}
          </Text>
        ))}
      </View>

      {weeks.map((week, wi) => (
        <View key={wi} style={{ flexDirection: 'row' }}>
          {week.map((cell, di) => (
            <TouchableOpacity
              key={di}
              disabled={cell.type !== 'current'}
              style={{
                flex: 1,
                height: 64,
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 8,
                margin: 2,
                backgroundColor:
                  cell.type === 'current'
                    ? selectedDate === cell.day
                      ? '#22c55e'
                      : darkMode ? '#27272a' : '#fff'
                    : darkMode ? '#222' : '#e5e7eb',
              }}
              onPress={() => cell.type === 'current' && setSelectedDate(cell.day)}
            >
              <Text
                style={{
                  fontSize: 16,
                  color:
                    cell.type === 'current'
                      ? selectedDate === cell.day
                        ? '#fff'
                        : darkMode ? '#fff' : '#222'
                      : darkMode ? '#444' : '#bbb',
                }}
              >
                {cell.day}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}

      {selectedDate && (
        <ScrollView style={{ marginTop: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8, color: darkMode ? '#fff' : '#222' }}>
            Events on {selectedDate} {new Date(year, month).toLocaleString('default', { month: 'long' })}:
          </Text>
          {loading ? (
            <Text style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}>Loading...</Text>
          ) : error ? (
            <Text style={{ color: '#ef4444' }}>{error}</Text>
          ) : (
            events
              .filter((event: any) => {
                const eventDate = new Date(event.start_date);
                return (
                  eventDate.getFullYear() === year &&
                  eventDate.getMonth() === month &&
                  eventDate.getDate() === selectedDate
                );
              })
              .map((event: any) => (
                <View key={event.id} style={{ backgroundColor: darkMode ? '#27272a' : '#fff', borderRadius: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, padding: 16, marginBottom: 8 }}>
                  <Text style={{ fontWeight: '500', color: darkMode ? '#fff' : '#222' }}>{event.name}</Text>
                  <Text style={{ fontSize: 14, color: darkMode ? '#d1d5db' : '#6b7280' }}>{event.start_date} @ {event.location}</Text>
                </View>
              ))
          )}
        </ScrollView>
      )}
    </View>
  );
}