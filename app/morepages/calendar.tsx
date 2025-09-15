import React, { useState, useEffect } from "react";
// Removed frontend Google OAuth imports
import { View, Text, TouchableOpacity, ScrollView, Modal, TextInput, Alert } from "react-native";
import apiRequest from "../../api";
import { useTheme } from "../../constants/ThemeContext";


const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];


export default function Calendar() {
  const [availabilityModalVisible, setAvailabilityModalVisible] = useState(false);
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [officeStart, setOfficeStart] = useState("09:00");
  const [officeEnd, setOfficeEnd] = useState("17:00");
  function toggleDay(day: string) {
    setAvailableDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  }

  async function fetchAvailability() {
    try {
      const res = await apiRequest("https://schirmer-s-notary-backend.onrender.com/calendar/availability", "GET");
      if (res && res.availability) {
        setAvailableDays(Array.isArray(res.availability.availableDays) ? res.availability.availableDays : (res.availability.availableDays || '').split(','));
        setOfficeStart(res.availability.officeStart || "09:00");
        setOfficeEnd(res.availability.officeEnd || "17:00");
      }
    } catch {
      // fallback to defaults
      setAvailableDays([]);
      setOfficeStart("09:00");
      setOfficeEnd("17:00");
    }
  }
  async function saveAvailability() {
    try {
      const payload = {
        officeStart,
        officeEnd,
        availableDays,
      };
      const res = await apiRequest("https://schirmer-s-notary-backend.onrender.com/calendar/availability", "POST", payload);
      if (res && res.message) {
        Alert.alert("Success", res.message);
      } else {
        Alert.alert("Success", "Availability saved.");
      }
      setAvailabilityModalVisible(false);
    } catch (err) {
      Alert.alert("Error", "Failed to save availability.");
    }
  }
  const [workingStartHour, setWorkingStartHour] = useState(9); // default 9am
  const [workingEndHour, setWorkingEndHour] = useState(17); // default 5pm

  function generateDaySlots(date: Date) {
    const slots = [];
    for (let hour = workingStartHour; hour < workingEndHour; hour++) {
      slots.push({
        time: `${hour}:00`,
        available: true,
      });
    }
    return slots;
  }
  const [adminModalVisible, setAdminModalVisible] = useState(false);
  const [editEvent, setEditEvent] = useState<any>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [userId, setUserId] = useState("");
  const [googleEvents, setGoogleEvents] = useState<any[]>([]);
  // Fetch Google events from backend endpoint
  async function fetchGoogleEventsFromBackend() {
    try {
      const res = await apiRequest("https://schirmer-s-notary-backend.onrender.com/calendar/google-sync-events", "GET");
      setGoogleEvents(res.events || []);
    } catch {
      setGoogleEvents([]);
    }
  }
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
        await fetchGoogleEventsFromBackend();
      } catch (err) {
        setError("Failed to load events");
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, [year, month]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: darkMode ? '#18181b' : '#f9fafb' }} contentContainerStyle={{ padding: 16 }}>
          <TouchableOpacity
            style={{ backgroundColor: '#2563eb', padding: 10, borderRadius: 8, marginBottom: 12 }}
            onPress={async () => {
              await fetchAvailability();
              setAvailabilityModalVisible(true);
            }}
          >
            <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>Set Availability (Admin)</Text>
          </TouchableOpacity>
      <Modal visible={availabilityModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#00000088" }}>
          <View style={{ backgroundColor: darkMode ? '#27272a' : '#fff', padding: 20, borderRadius: 10, width: "80%" }}>
            <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 8, color: darkMode ? '#fff' : '#222' }}>Set Availability</Text>
            <Text style={{ color: darkMode ? '#fff' : '#222', marginBottom: 8 }}>Available Days:</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
              {WEEKDAYS.map(day => (
                <TouchableOpacity
                  key={day}
                  style={{
                    backgroundColor: availableDays.includes(day) ? '#22c55e' : darkMode ? '#444' : '#e5e7eb',
                    borderRadius: 6,
                    padding: 8,
                    margin: 4,
                  }}
                  onPress={() => toggleDay(day)}
                >
                  <Text style={{ color: availableDays.includes(day) ? '#fff' : darkMode ? '#fff' : '#222', fontWeight: 'bold' }}>{day}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={{ color: darkMode ? '#fff' : '#222', marginBottom: 8 }}>Office Hours:</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <TextInput
                style={{ borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 5, padding: 8, width: 80, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff', marginRight: 8 }}
                value={officeStart}
                onChangeText={setOfficeStart}
                placeholder="Start (HH:MM)"
                placeholderTextColor={darkMode ? '#888' : '#999'}
              />
              <Text style={{ color: darkMode ? '#fff' : '#222', marginRight: 8 }}>to</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 5, padding: 8, width: 80, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff' }}
                value={officeEnd}
                onChangeText={setOfficeEnd}
                placeholder="End (HH:MM)"
                placeholderTextColor={darkMode ? '#888' : '#999'}
              />
            </View>
            <TouchableOpacity
              style={{ backgroundColor: '#22c55e', borderRadius: 8, padding: 10, marginBottom: 8 }}
              onPress={saveAvailability}
            >
              <Text style={{ color: '#fff', textAlign: 'center' }}>Save Availability</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ backgroundColor: darkMode ? '#444' : '#e5e7eb', borderRadius: 8, padding: 10 }} onPress={() => setAvailabilityModalVisible(false)}>
              <Text style={{ color: darkMode ? '#fff' : '#222', textAlign: 'center' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
        <TouchableOpacity
          style={{ backgroundColor: '#2563eb', padding: 10, borderRadius: 8, marginBottom: 12 }}
          onPress={() => {
            setEditEvent(null);
            setEventTitle("");
            setEventStartDate("");
            setEventEndDate("");
            setEventLocation("");
            setEventDescription("");
            setAdminModalVisible(true);
          }}
        >
          <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>+ Add/Edit/Delete Event (Admin)</Text>
        </TouchableOpacity>
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
          <>
            <Modal visible={adminModalVisible} transparent animationType="slide">
              <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#00000088" }}>
                <View style={{ backgroundColor: darkMode ? '#27272a' : '#fff', padding: 20, borderRadius: 10, width: "80%" }}>
                  <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 8, color: darkMode ? '#fff' : '#222' }}>{editEvent ? "Edit Event" : "Add Event"}</Text>
                  <TextInput
                    placeholder="Event Title"
                    placeholderTextColor={darkMode ? '#888' : '#999'}
                    value={eventTitle}
                    onChangeText={setEventTitle}
                    style={{ borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 5, padding: 8, marginBottom: 10, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff' }}
                  />
                  <TextInput
                    placeholder="Start Date (YYYY-MM-DD HH:MM)"
                    placeholderTextColor={darkMode ? '#888' : '#999'}
                    value={eventStartDate}
                    onChangeText={setEventStartDate}
                    style={{ borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 5, padding: 8, marginBottom: 10, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff' }}
                  />
                  <TextInput
                    placeholder="End Date (YYYY-MM-DD HH:MM)"
                    placeholderTextColor={darkMode ? '#888' : '#999'}
                    value={eventEndDate}
                    onChangeText={setEventEndDate}
                    style={{ borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 5, padding: 8, marginBottom: 10, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff' }}
                  />
                  <TextInput
                    placeholder="Location"
                    placeholderTextColor={darkMode ? '#888' : '#999'}
                    value={eventLocation}
                    onChangeText={setEventLocation}
                    style={{ borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 5, padding: 8, marginBottom: 10, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff' }}
                  />
                  <TextInput
                    placeholder="Description"
                    placeholderTextColor={darkMode ? '#888' : '#999'}
                    value={eventDescription}
                    onChangeText={setEventDescription}
                    style={{ borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 5, padding: 8, marginBottom: 10, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff' }}
                  />
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                    <Text style={{ color: darkMode ? '#fff' : '#222', marginRight: 8 }}>Working Hours:</Text>
                    <TextInput
                      style={{ borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 5, padding: 4, width: 40, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff', marginRight: 4 }}
                      keyboardType="numeric"
                      value={String(workingStartHour)}
                      onChangeText={v => setWorkingStartHour(Number(v))}
                    />
                    <Text style={{ color: darkMode ? '#fff' : '#222', marginRight: 4 }}>to</Text>
                    <TextInput
                      style={{ borderWidth: 1, borderColor: darkMode ? '#444' : '#ccc', borderRadius: 5, padding: 4, width: 40, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#18181b' : '#fff' }}
                      keyboardType="numeric"
                      value={String(workingEndHour)}
                      onChangeText={v => setWorkingEndHour(Number(v))}
                    />
                  </View>
                  <TouchableOpacity
                    style={{ backgroundColor: '#22c55e', borderRadius: 8, padding: 10, marginBottom: 8 }}
                    onPress={async () => {
                      try {
                        const payload = {
                          title: eventTitle,
                          start_date: eventStartDate,
                          end_date: eventEndDate,
                          location: eventLocation,
                          description: eventDescription,
                          user_id: userId,
                        };
                        if (editEvent) {
                          await apiRequest(`https://schirmer-s-notary-backend.onrender.com/calendar/local/${editEvent.id}`, "PUT", payload);
                          Alert.alert("Success", "Event updated.");
                        } else {
                          await apiRequest("https://schirmer-s-notary-backend.onrender.com/calendar/local", "POST", payload);
                          Alert.alert("Success", "Event added.");
                        }
                        setAdminModalVisible(false);
                        setEventTitle("");
                        setEventStartDate("");
                        setEventEndDate("");
                        setEventLocation("");
                        setEventDescription("");
                      } catch {
                        Alert.alert("Error", "Failed to save event.");
                      }
                    }}
                  >
                    <Text style={{ color: '#fff', textAlign: 'center' }}>{editEvent ? "Save Changes" : "Add Event"}</Text>
                  </TouchableOpacity>
                  {editEvent && (
                    <TouchableOpacity
                      style={{ backgroundColor: '#ef4444', borderRadius: 8, padding: 10, marginBottom: 8 }}
                      onPress={async () => {
                        try {
                          await apiRequest(`https://schirmer-s-notary-backend.onrender.com/calendar/local/${editEvent.id}`, "DELETE");
                          Alert.alert("Success", "Event deleted.");
                          setAdminModalVisible(false);
                          setEventTitle("");
                          setEventStartDate("");
                          setEventEndDate("");
                          setEventLocation("");
                          setEventDescription("");
                        } catch {
                          Alert.alert("Error", "Failed to delete event.");
                        }
                      }}
                    >
                      <Text style={{ color: '#fff', textAlign: 'center' }}>Delete Event</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={{ backgroundColor: darkMode ? '#444' : '#e5e7eb', borderRadius: 8, padding: 10 }} onPress={() => setAdminModalVisible(false)}>
                    <Text style={{ color: darkMode ? '#fff' : '#222', textAlign: 'center' }}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
            <ScrollView style={{ marginTop: 24 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8, color: darkMode ? '#fff' : '#222' }}>
                Events on {selectedDate} {new Date(year, month).toLocaleString('default', { month: 'long' })}:
              </Text>
              {/* Show all slots for the selected day based on working hours */}
              {(() => {
                const dateObj = new Date(year, month, selectedDate!);
                const slots = generateDaySlots(dateObj);
                // Mark slots unavailable if they overlap with any event (DB or Google)
                const allEvents = [
                  ...events.filter((event: any) => {
                    const eventDate = new Date(event.start_date);
                    return (
                      eventDate.getFullYear() === year &&
                      eventDate.getMonth() === month &&
                      eventDate.getDate() === selectedDate
                    );
                  }),
                  ...googleEvents.filter((event: any) => {
                    const eventDate = new Date(event.start?.dateTime || event.start?.date);
                    return (
                      eventDate.getFullYear() === year &&
                      eventDate.getMonth() === month &&
                      eventDate.getDate() === selectedDate
                    );
                  })
                ];
                return slots.map((slot, idx) => {
                  // Check if any event overlaps this slot
                  const slotHour = parseInt(slot.time.split(':')[0]);
                  const isUnavailable = allEvents.some(ev => {
                    const evStart = new Date(ev.start_date || ev.start?.dateTime || ev.start?.date);
                    const evEnd = new Date(ev.end_date || ev.end?.dateTime || ev.end?.date || evStart);
                    return evStart.getHours() <= slotHour && evEnd.getHours() > slotHour;
                  });
                  return (
                    <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                      <Text style={{ color: isUnavailable ? '#ef4444' : '#22c55e', fontWeight: 'bold', width: 60 }}>{slot.time}</Text>
                      <Text style={{ color: isUnavailable ? '#ef4444' : '#22c55e', marginLeft: 8 }}>{isUnavailable ? 'Unavailable' : 'Available'}</Text>
                    </View>
                  );
                });
              })()}
              {/* List events for the day below slots */}
              <Text style={{ fontSize: 16, fontWeight: '500', marginTop: 16, marginBottom: 4, color: darkMode ? '#fff' : '#222' }}>Events:</Text>
              {loading ? (
                <Text style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}>Loading...</Text>
              ) : error ? (
                <Text style={{ color: '#ef4444' }}>{error}</Text>
              ) : ([
                ...events
                  .filter((event: any) => {
                    const eventDate = new Date(event.start_date);
                    return (
                      eventDate.getFullYear() === year &&
                      eventDate.getMonth() === month &&
                      eventDate.getDate() === selectedDate
                    );
                  })
                  .map((event: any) => (
                    <TouchableOpacity
                      key={event.id}
                      onPress={() => {
                        setEditEvent(event);
                        setEventTitle(event.title);
                        setEventStartDate(event.start_date);
                        setEventEndDate(event.end_date);
                        setEventLocation(event.location);
                        setEventDescription(event.description);
                        setAdminModalVisible(true);
                      }}
                      style={{ backgroundColor: darkMode ? '#27272a' : '#fff', borderRadius: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, padding: 16, marginBottom: 8 }}
                    >
                      <Text style={{ fontWeight: '500', color: darkMode ? '#fff' : '#222' }}>{event.title}</Text>
                      <Text style={{ fontSize: 14, color: darkMode ? '#d1d5db' : '#6b7280' }}>{event.start_date} - {event.end_date} @ {event.location}</Text>
                    </TouchableOpacity>
                  )),
                ...googleEvents
                  .filter((event: any) => {
                    const eventDate = new Date(event.start?.dateTime || event.start?.date);
                    return (
                      eventDate.getFullYear() === year &&
                      eventDate.getMonth() === month &&
                      eventDate.getDate() === selectedDate
                    );
                  })
                  .map((event: any) => (
                    <View key={event.id} style={{ backgroundColor: '#4285F4', borderRadius: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, padding: 16, marginBottom: 8 }}>
                      <Text style={{ fontWeight: '500', color: '#fff' }}>{event.summary}</Text>
                      <Text style={{ fontSize: 14, color: '#fff' }}>{event.start?.dateTime || event.start?.date}</Text>
                    </View>
                  ))
              ])}
            </ScrollView>
          </>
        )}
      </ScrollView>
  );
}

