import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Modal, Alert, ScrollView } from "react-native";
import apiRequest from "../../api";
import { useTheme } from "../../constants/ThemeContext";
import { Picker } from "@react-native-picker/picker";
import { useRoute } from '@react-navigation/native';

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? "00" : "30";
  return `${hour.toString().padStart(2, "0")}:${minute}`;
});

export default function CalendarScreen() {
  type CalendarRouteParams = {
    selectedYear?: number;
    selectedMonth?: number;
    selectedDay?: number;
  };
  const route = useRoute();
  const { selectedYear, selectedMonth, selectedDay } = (route.params as CalendarRouteParams) || {};

  const initialDate = selectedYear !== undefined && selectedMonth !== undefined && selectedMonth >= 0 && selectedDay !== undefined
    ? new Date(selectedYear, selectedMonth, selectedDay)
    : new Date();

  const [currentDate, setCurrentDate] = useState(initialDate);
  const [selectedDate, setSelectedDate] = useState<number | null>(selectedDay ?? initialDate.getDate());

  const { darkMode } = useTheme();
  const [dayAvailabilities, setDayAvailabilities] = useState<{
    [day: string]: { start: string; end: string };
  }>({});
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [editDays, setEditDays] = useState<string[]>([]);
  const [editTimes, setEditTimes] = useState<{ [day: string]: { start: string; end: string } }>({});

  useEffect(() => {
    if (
      selectedYear !== undefined &&
      selectedMonth !== undefined &&
      selectedMonth >= 0 &&
      selectedDay !== undefined
    ) {
      const newDate = new Date(selectedYear, selectedMonth, selectedDay);
      setCurrentDate(newDate);
      setSelectedDate(selectedDay);
    }
  }, [selectedYear, selectedMonth, selectedDay]);



  async function fetchAvailability() {
    try {
      const res = await apiRequest(
        "https://schirmer-s-notary-backend.onrender.com/calendar/availability",
        "GET"
      );
      if (res && res.available_days_json) {
        setDayAvailabilities(JSON.parse(res.available_days_json));
      }
    } catch {
      setDayAvailabilities({});
    }
  }

  async function saveAvailability() {
    try {
      const payload = { available_days_json: JSON.stringify(editTimes) };
      const res = await apiRequest(
        "https://schirmer-s-notary-backend.onrender.com/calendar/availability",
        "POST",
        payload
      );
      Alert.alert("Success", res.message || "Availability saved.");
      setEditModalVisible(false);
      fetchAvailability();
    } catch {
      Alert.alert("Error", "Failed to save availability.");
    }
  }

  async function fetchEventsForMonth(year: number, month: number) {
    try {
      const res = await apiRequest(
        "https://schirmer-s-notary-backend.onrender.com/calendar/local",
        "GET"
      );
      if (Array.isArray(res)) {
        setEvents(res);
      } else {
        setEvents([]);
      }
    } catch {
      setEvents([]);
    }
  }

  useEffect(() => {
    fetchAvailability();
  }, []);

  useEffect(() => {
    fetchEventsForMonth(currentDate.getFullYear(), currentDate.getMonth());
    if (selectedDay === undefined || selectedDay === null) {
      setSelectedDate(null);
    }
  }, [currentDate, selectedDay]);

  function generateCalendar(date: Date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const weeks: (number | null)[][] = [];
    let week: (number | null)[] = Array(firstDay).fill(null);

    for (let day = 1; day <= daysInMonth; day++) {
      week.push(day);
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }
    if (week.length > 0) {
      while (week.length < 7) week.push(null);
      weeks.push(week);
    }
    return weeks;
  }

  const weeks = generateCalendar(currentDate);

  function getEventsForSelectedDate() {
    if (!selectedDate) return [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    return events.filter((event: any) => {
      const rawDate = event.date || event.start_date;
      if (!rawDate) return false;

      const [datePart] = rawDate.split("T");
      const [eventYear, eventMonth, eventDay] = datePart.split("-").map(Number);

      return (
        eventYear === year &&
        eventMonth - 1 === month &&
        eventDay === selectedDate
      );
    });
  }

  function handleToggleEditDay(day: string) {
    setEditDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
    setEditTimes(prev =>
      prev[day]
        ? prev
        : { ...prev, [day]: { start: "09:00", end: "17:00" } }
    );
  }

  useEffect(() => {
    if (editModalVisible) {
      setEditDays(Object.keys(dayAvailabilities));
      setEditTimes({ ...dayAvailabilities });
    }
  }, [editModalVisible]);

  return (
    <ScrollView
      style={{
        backgroundColor: darkMode ? "#18181b" : "#f9fafb",
        flex: 1,
      }}
    >
      {/* Availability Card */}
      <View
        style={{
          backgroundColor: darkMode ? "#27272a" : "#fff",
          borderRadius: 10,
          padding: 16,
          margin: 16,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: darkMode ? "#fff" : "#222",
            marginBottom: 8,
          }}
        >
          Availability
        </Text>
        {Object.keys(dayAvailabilities).length > 0 ? (
          WEEKDAYS.map((day) =>
            dayAvailabilities[day] ? (
              <Text
                key={day}
                style={{
                  fontSize: 14,
                  color: darkMode ? "#fff" : "#222",
                  marginBottom: 4,
                }}
              >
                {day}: {dayAvailabilities[day].start} - {dayAvailabilities[day].end}
              </Text>
            ) : null
          )
        ) : (
          <Text style={{ color: "#888" }}>No availability set.</Text>
        )}

        {/* Small edit button */}
        <TouchableOpacity
          style={{
            backgroundColor: "#2563eb",
            padding: 8,
            borderRadius: 50,
            position: "absolute",
            bottom: 10,
            right: 10,
          }}
          onPress={() => setEditModalVisible(true)}
        >
          <Text style={{ color: "#fff", fontSize: 12 }}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Calendar Navigation */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, marginBottom: 10 }}>
        <TouchableOpacity
          onPress={() => {
            setCurrentDate((prev) => {
              const year = prev.getFullYear();
              const month = prev.getMonth();
              if (month === 0) {
                return new Date(year - 1, 11, 1);
              }
              return new Date(year, month - 1, 1);
            });
          }}
        >
          <Text style={{ fontSize: 24, color: "#2563eb", fontWeight: "bold" }}>◀</Text>
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
            color: darkMode ? "#fff" : "#111",
            textAlign: "center",
          }}
        >
          {currentDate.toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
        </Text>
        <TouchableOpacity
          onPress={() => {
            setCurrentDate((prev) => {
              const year = prev.getFullYear();
              const month = prev.getMonth();
              if (month === 11) {
                return new Date(year + 1, 0, 1);
              }
              return new Date(year, month + 1, 1);
            });
          }}
        >
          <Text style={{ fontSize: 24, color: "#2563eb", fontWeight: "bold" }}>▶</Text>
        </TouchableOpacity>
      </View>

      {/* Weekday Headers */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16 }}>
        {WEEKDAYS.map((day) => (
          <Text
            key={day}
            style={{
              flex: 1,
              textAlign: "center",
              fontWeight: "600",
              color: darkMode ? "#fff" : "#111",
            }}
          >
            {day}
          </Text>
        ))}
      </View>

      {/* Days */}
      {weeks.map((week, i) => (
        <View
          key={i}
          style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16 }}
        >
          {week.map((day, j) => (
            <TouchableOpacity
              key={j}
              style={{
                flex: 1,
                height: 60,
                margin: 2,
                justifyContent: "center",
                alignItems: "center",
                borderRadius: 8,
                backgroundColor: day
                  ? selectedDate === day
                    ? "#2563eb"
                    : darkMode
                      ? "#3f3f46"
                      : "#e5e7eb"
                  : "transparent",
              }}
              disabled={!day}
              onPress={() => {
                if (day) {
                  setSelectedDate(day);
                }
              }}
            >
              <Text
                style={{
                  color: day
                    ? selectedDate === day
                      ? "#fff"
                      : darkMode
                        ? "#fff"
                        : "#111"
                    : "transparent",
                  fontWeight: selectedDate === day ? "bold" : "normal",
                }}
              >
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}

      {/* Events for selected date at the bottom */}
      {selectedDate && (
        <View style={{ margin: 16, backgroundColor: darkMode ? "#27272a" : "#fff", borderRadius: 10, padding: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 12, color: darkMode ? "#fff" : "#222" }}>
            Events for {selectedDate} {currentDate.toLocaleString("default", { month: "long", year: "numeric" })}
          </Text>
          {getEventsForSelectedDate().length > 0 ? (
            getEventsForSelectedDate().map((event, idx) => (
              <View key={idx} style={{ marginBottom: 12, backgroundColor: darkMode ? "#18181b" : "#f3f4f6", borderRadius: 8, padding: 12 }}>
                <Text style={{ fontWeight: "bold", color: darkMode ? "#fff" : "#222" }}>
                  {event.title || event.name || "Event"}
                </Text>
                <Text style={{ color: darkMode ? "#d1d5db" : "#6b7280" }}>
                  {event.start_date || event.date} {event.time ? `@ ${event.time}` : ""}
                </Text>
                {event.location && (
                  <Text style={{ color: darkMode ? "#d1d5db" : "#6b7280" }}>
                    Location: {event.location}
                  </Text>
                )}
                {event.notes && (
                  <Text style={{ color: "#22c55e", marginTop: 4 }}>
                    Notes: {event.notes}
                  </Text>
                )}
              </View>
            ))
          ) : (
            <Text style={{ color: "#888" }}>No events for this day.</Text>
          )}
        </View>
      )}

      {/* Edit Availability Modal */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#00000088",
          }}
        >
          <View
            style={{
              backgroundColor: darkMode ? "#27272a" : "#fff",
              padding: 20,
              borderRadius: 10,
              width: "90%",
              maxHeight: "80%", // Add this to limit height for scrolling
            }}
          >
            <ScrollView>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  marginBottom: 12,
                  color: darkMode ? "#fff" : "#222",
                }}
              >
                Edit Weekly Availability
              </Text>
              <Text style={{ color: darkMode ? "#fff" : "#222", marginBottom: 8 }}>
                Select days to set availability:
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 12 }}>
                {WEEKDAYS.map(day => (
                  <TouchableOpacity
                    key={day}
                    style={{
                      backgroundColor: editDays.includes(day) ? "#22c55e" : darkMode ? "#444" : "#e5e7eb",
                      borderRadius: 6,
                      padding: 8,
                      margin: 4,
                    }}
                    onPress={() => handleToggleEditDay(day)}
                  >
                    <Text style={{ color: editDays.includes(day) ? "#fff" : darkMode ? "#fff" : "#222", fontWeight: "bold" }}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {editDays.map(day => (
                <View key={day} style={{ marginBottom: 12 }}>
                  <Text style={{ color: darkMode ? "#fff" : "#222", marginBottom: 4, fontWeight: "600" }}>
                    {day} Hours:
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Picker
                      selectedValue={editTimes[day]?.start || "09:00"}
                      style={{ width: 120, color: darkMode ? "#fff" : "#222", marginRight: 8 }}
                      onValueChange={val =>
                        setEditTimes(prev => ({
                          ...prev,
                          [day]: { ...prev[day], start: val }
                        }))
                      }
                    >
                      {TIME_OPTIONS.map(t => (
                        <Picker.Item key={t} label={t} value={t} />
                      ))}
                    </Picker>
                    <Text style={{ color: darkMode ? "#fff" : "#222", marginHorizontal: 4 }}>to</Text>
                    <Picker
                      selectedValue={editTimes[day]?.end || "17:00"}
                      style={{ width: 120, color: darkMode ? "#fff" : "#222" }}
                      onValueChange={val =>
                        setEditTimes(prev => ({
                          ...prev,
                          [day]: { ...prev[day], end: val }
                        }))
                      }
                    >
                      {TIME_OPTIONS.map(t => (
                        <Picker.Item key={t} label={t} value={t} />
                      ))}
                    </Picker>
                  </View>
                </View>
              ))}
              <TouchableOpacity
                style={{
                  backgroundColor: "#22c55e",
                  borderRadius: 8,
                  padding: 10,
                  marginTop: 12,
                }}
                onPress={saveAvailability}
              >
                <Text style={{ color: "#fff", textAlign: "center" }}>
                  Save Availability
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  backgroundColor: darkMode ? "#444" : "#e5e7eb",
                  borderRadius: 8,
                  padding: 10,
                  marginTop: 8,
                }}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={{ color: darkMode ? "#fff" : "#222", textAlign: "center" }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}