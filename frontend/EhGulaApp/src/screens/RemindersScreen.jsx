// ─────────────────────────────────────────────────────────────────────────────
// src/screens/RemindersScreen.js
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, Image, Modal, TextInput, Alert,
  KeyboardAvoidingView, Platform, ActivityIndicator, RefreshControl,
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { usePatientData }         from '../hooks/usePatientData'
import { buildAllReminders, MAX_SNOOZES, SNOOZE_DURATIONS_MINS, getSnoozeLabel } from '../components/reminderEngine'
import { supabase }               from '../supabase'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORIES   = ['General', 'Medications', 'Appointments', 'Meals', 'Exercise']
const LOG_CATS     = ['Meal', 'Exercise', 'Glucose', 'Medication', 'Symptom', 'Other']

const PRIORITY_COLORS = {
  high:   '#E53935',
  medium: '#FB8C00',
  low:    '#43A047',
}

const ACTION_ICONS = {
  remind:       'bell-ring-outline',
  held:         'pause-circle-outline',
  delayed:      'clock-outline',
  upcoming:     'clock-outline',
  book:         'calendar-plus',
  view:         'calendar-check',
  log_meal:     'food',
  log_exercise: 'run',
  info:         'information-outline',
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

const CategoryPill = ({ label, active, count, onPress }) => (
  <TouchableOpacity
    style={[styles.pill, active && styles.pillActive]}
    onPress={onPress}
    activeOpacity={0.75}
  >
    <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    {count > 0 && (
      <View style={[styles.pillBadge, active && styles.pillBadgeActive]}>
        <Text style={styles.pillBadgeText}>{count}</Text>
      </View>
    )}
  </TouchableOpacity>
)

const ReminderCard = ({ item, onComplete, onSnooze, onBook }) => {
  const borderColor = PRIORITY_COLORS[item.priority]
  const iconName    = ACTION_ICONS[item.action] || 'bell-outline'
  const maxSnoozed  = item.snoozeCount >= MAX_SNOOZES

  return (
    <View style={[styles.reminderCard, { borderLeftColor: borderColor }]}>
      <View style={styles.reminderHeader}>
        <View style={styles.reminderHeaderLeft}>
          <MaterialCommunityIcons name={iconName} size={15} color={borderColor} style={{ marginRight: 5 }} />
          <Text style={styles.reminderTime}>{item.time}</Text>
        </View>
        <View style={[styles.tagBadge, { backgroundColor: item.tagColor }]}>
          <Text style={[styles.tagText, { color: item.tagTextColor }]}>{item.category}</Text>
        </View>
      </View>

      <Text style={styles.reminderTitle}>{item.title}</Text>
      <Text style={styles.reminderDetail}>{item.detail}</Text>

      {/* Clinic slots for book action */}
      {item.action === 'book' && item.suggestedSlots?.length > 0 && (
        <View style={styles.slotList}>
          <Text style={styles.slotHeader}>Suggested slots:</Text>
          {item.suggestedSlots.map((slot) => (
            <TouchableOpacity key={slot.id} style={styles.slotBtn} onPress={() => onBook(slot)} activeOpacity={0.8}>
              <MaterialCommunityIcons name="calendar-check" size={13} color="#1565C0" />
              <Text style={styles.slotBtnText}>{slot.date} at {slot.time} — {slot.clinic}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.completeBtn} onPress={() => onComplete(item.id)} activeOpacity={0.8}>
          <MaterialCommunityIcons name="check-circle-outline" size={14} color="#2E7D32" />
          <Text style={styles.completeBtnText}>Done</Text>
        </TouchableOpacity>

        {item.snoozeable && (
          <TouchableOpacity
            style={[styles.snoozeBtn, maxSnoozed && styles.snoozeBtnDisabled]}
            onPress={() => !maxSnoozed && onSnooze(item.id)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="alarm-snooze" size={14} color={maxSnoozed ? '#999' : '#E67E22'} />
            <Text style={[styles.snoozeBtnText, maxSnoozed && { color: '#999' }]}>
              {maxSnoozed ? 'Max snoozes' : getSnoozeLabel(item.snoozeCount)}
            </Text>
          </TouchableOpacity>
        )}

        {item.action === 'view' && (
          <TouchableOpacity style={styles.viewBtn} activeOpacity={0.8}>
            <MaterialCommunityIcons name="eye-outline" size={14} color="#1565C0" />
            <Text style={styles.viewBtnText}>View details</Text>
          </TouchableOpacity>
        )}
      </View>

      {item.snoozeCount === MAX_SNOOZES - 1 && item.snoozeable && (
        <Text style={styles.snoozeWarning}>⚠ Last snooze available for this reminder.</Text>
      )}
      {maxSnoozed && item.snoozeable && (
        <Text style={styles.snoozeEscalated}>
          Snoozed {MAX_SNOOZES}x — this will be flagged in your health brief.
        </Text>
      )}
    </View>
  )
}

const UpcomingAppointmentCard = ({ appointment }) => {
  if (!appointment) return null
  const apptDate  = new Date(appointment.date)
  const daysUntil = Math.ceil((apptDate - Date.now()) / 86400000)
  return (
    <View style={styles.upcomingCard}>
      <View style={styles.upcomingHeader}>
        <Text style={styles.upcomingTime}>
          {apptDate.toDateString()} — {daysUntil} day{daysUntil !== 1 ? 's' : ''} away
        </Text>
        <View style={styles.confirmedBadge}>
          <Text style={styles.confirmedText}>Confirmed</Text>
        </View>
      </View>
      <Text style={styles.upcomingDoctor}>{appointment.clinician_name}</Text>
      <Text style={styles.upcomingHospital}>{appointment.clinic}</Text>
      {appointment.booking_reason && (
        <Text style={styles.upcomingReason}>Reason: {appointment.booking_reason}</Text>
      )}
      <TouchableOpacity style={styles.outlineBtn} activeOpacity={0.8}>
        <Text style={styles.outlineBtnText}>View pre-consultation health brief</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.outlineBtn} activeOpacity={0.8}>
        <Text style={styles.outlineBtnText}>Reschedule booking</Text>
      </TouchableOpacity>
    </View>
  )
}

const AddLogModal = ({ visible, onClose, onSubmit }) => {
  const [logCat,  setLogCat]  = useState('Meal')
  const [logNote, setLogNote] = useState('')
  const [saving,  setSaving]  = useState(false)

  const submit = async () => {
    if (!logNote.trim()) {
      Alert.alert('Nothing to log', 'Please enter a note.')
      return
    }
    setSaving(true)
    await onSubmit({ category: logCat, note: logNote.trim() })
    setSaving(false)
    setLogNote('')
    setLogCat('Meal')
    onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Add Log Entry</Text>
          <Text style={styles.modalSubtitle}>What would you like to record?</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {LOG_CATS.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.logCatPill, logCat === cat && styles.logCatPillActive]}
                  onPress={() => setLogCat(cat)}
                >
                  <Text style={[styles.logCatText, logCat === cat && styles.logCatTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <TextInput
            style={styles.logInput}
            placeholder={`Describe your ${logCat.toLowerCase()}…`}
            placeholderTextColor="#AAAAAA"
            value={logNote}
            onChangeText={setLogNote}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Text style={styles.logTimestamp}>
            Logged at: {new Date().toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })}
          </Text>

          <View style={styles.modalBtnRow}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalSubmitBtn} onPress={submit} disabled={saving} activeOpacity={0.8}>
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.modalSubmitText}>Save Log</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────

export default function RemindersScreen({ onNavigate }) {
  const { data, loading, error, refetch } = usePatientData()

  useEffect(() => {
  if (data) {
    console.log('=== PATIENT DATA DEBUG ===')
    console.log('glucose readings:', data.glucose?.length)
    console.log('doseLogs today:', data.doseLogs?.length, data.doseLogs)
    console.log('doseLogsWeek:', data.doseLogsWeek?.length)
    console.log('mealLogs:', data.mealLogs?.length, data.mealLogs)
    console.log('calendar:', data.calendar?.length, data.calendar)
    console.log('exercise:', data.exercise)
    console.log('medications:', data.medications?.length, data.medications)
    console.log('appointments:', data.appointments)
    console.log('=========================')
  }
}, [data])

  const [activeCategory, setActiveCategory] = useState('General')
  const [reminders,      setReminders]      = useState({})
  const [addLogVisible,  setAddLogVisible]  = useState(false)
  const [userLogs,       setUserLogs]       = useState([])

  // Rebuild reminders whenever Supabase data changes
  useEffect(() => {
    if (data) setReminders(buildAllReminders(data))
  }, [data])

  // ── Snooze ──────────────────────────────────────────────────────────────────
  const handleSnooze = useCallback((reminderId) => {
    setReminders((prev) => {
      const next = { ...prev }
      for (const cat of Object.keys(next)) {
        next[cat] = next[cat].map((r) => {
          if (r.id !== reminderId) return r
          const newCount   = r.snoozeCount + 1
          const mins       = SNOOZE_DURATIONS_MINS[Math.min(r.snoozeCount, SNOOZE_DURATIONS_MINS.length - 1)]
          const snoozedUntil = new Date(Date.now() + mins * 60000).toISOString()
          return { ...r, snoozeCount: newCount, snoozedUntil }
        })
      }
      return next
    })
  }, [])

  // ── Complete — removes card + writes to Supabase agent_actions ──────────────
  const handleComplete = useCallback(async (reminderId) => {
    let completed = null
    setReminders((prev) => {
      const next = { ...prev }
      for (const cat of Object.keys(next)) {
        const found = next[cat].find((r) => r.id === reminderId)
        if (found) completed = found
        next[cat] = next[cat].filter((r) => r.id !== reminderId)
      }
      return next
    })

    // Write completion to Supabase so AI teammate can read it in audit trail
    if (completed) {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('agent_actions').insert({
        patient_id:     user?.id,
        action_type: 'reminder_completed',
        category:    completed.category,
        detail:      completed.title,
        outcome:     'completed_by_patient',
        timestamp:   new Date().toISOString(),
      })
    }

    Alert.alert('✅ Done!', 'Marked as completed and saved to your health trend.')
  }, [])

  // ── Book appointment slot ───────────────────────────────────────────────────
  const handleBook = useCallback((slot) => {
    Alert.alert(
      'Book appointment?',
      `${slot.date} at ${slot.time} — ${slot.clinic}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            // Write to appointments table — your DB teammate's schema
            const { data: { user } } = await supabase.auth.getUser()
            const { error: insertErr } = await supabase.from('appointments').insert({
              patient_id:        user?.id,
              date:           slot.date,
              clinic:    slot.clinic,
              status:         'confirmed',
              auto_booked:    true,
              booking_reason: 'Booked via patient app',
            })
            if (insertErr) {
              Alert.alert('Booking failed', insertErr.message)
            } else {
              Alert.alert('Booked! 🎉', `Appointment at ${slot.clinic} on ${slot.date} at ${slot.time} confirmed.`)
              refetch() // refresh data so new appointment appears
            }
          },
        },
      ]
    )
  }, [refetch])

  // ── Add log — writes to meal_logs or a general patient_logs table ───────────
  const handleAddLog = useCallback(async ({ category, note }) => {
    const { data: { user } } = await supabase.auth.getUser()

    // Try to write to a general patient_logs table.
    // Your DB teammate can create this table, or route to the specific table.
    const { error: logErr } = await supabase.from('patient_logs').insert({
      patient_id:   user?.id,
      category,
      note,
      timestamp: new Date().toISOString(),
    })

    if (logErr) {
      // Fallback: store locally if table doesn't exist yet
      console.warn('[AddLog] Supabase write failed, storing locally:', logErr.message)
    }

    setUserLogs((prev) => [...prev, { category, note, timestamp: new Date().toISOString() }])
    Alert.alert('Logged! 📝', `Your ${category.toLowerCase()} entry has been saved.`)
  }, [])

  // ── Filter snoozed reminders ────────────────────────────────────────────────
  const activeReminders = (reminders[activeCategory] || []).filter((r) => {
    if (!r.snoozedUntil) return true
    return new Date(r.snoozedUntil) <= new Date()
  })

  const countFor = (cat) =>
    (reminders[cat] || []).filter((r) => !r.snoozedUntil || new Date(r.snoozedUntil) <= new Date()).length

  const confirmedApt = data?.appointments?.find((a) => a.status === 'confirmed')

  const mascotMessages = {
    General:      "Here's everything on your plate today!",
    Medications:  'Your meds are waiting for you 💊',
    Appointments: 'Tick tock, tick tock…',
    Meals:        "Don't forget to eat! 🍱",
    Exercise:     'Time to get moving! 🚶',
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Loading / error states
  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#5BAD8F" />
        <Text style={{ marginTop: 12, color: '#888', fontSize: 14 }}>Loading your reminders…</Text>
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
        <MaterialCommunityIcons name="wifi-off" size={48} color="#ccc" />
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#555', marginTop: 12 }}>Could not load data</Text>
        <Text style={{ fontSize: 13, color: '#999', textAlign: 'center', marginTop: 6 }}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
          <Text style={styles.retryBtnText}>Try again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Main render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor="#5BAD8F" />}
      >
        {/* Title + Add Log */}
        <View style={styles.titleRow}>
          <Text style={styles.pageTitle}>Reminders</Text>
          <TouchableOpacity style={styles.addLogBtn} onPress={() => setAddLogVisible(true)} activeOpacity={0.8}>
            <MaterialCommunityIcons name="plus-circle-outline" size={17} color="#5BAD8F" />
            <Text style={styles.addLogBtnText}>Add Log</Text>
          </TouchableOpacity>
        </View>

        {/* Category pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow} contentContainerStyle={styles.pillRowContent}>
          {CATEGORIES.map((cat) => (
            <CategoryPill
              key={cat}
              label={cat}
              active={activeCategory === cat}
              count={countFor(cat)}
              onPress={() => setActiveCategory(cat)}
            />
          ))}
        </ScrollView>

        {/* Upcoming appointment (Appointments tab) */}
        {activeCategory === 'Appointments' && confirmedApt && (
          <>
            <Text style={styles.sectionLabel}>UPCOMING APPOINTMENT</Text>
            <UpcomingAppointmentCard appointment={confirmedApt} />
            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>APPOINTMENT ALERTS</Text>
          </>
        )}

        {/* Reminder cards */}
        {activeReminders.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="check-all" size={48} color="#5BAD8F" />
            <Text style={styles.emptyTitle}>All clear!</Text>
            <Text style={styles.emptySubtitle}>No active reminders in this category.</Text>
          </View>
        ) : (
          <View style={styles.reminderList}>
            {activeReminders.map((item) => (
              <ReminderCard
                key={item.id}
                item={item}
                onComplete={handleComplete}
                onSnooze={handleSnooze}
                onBook={handleBook}
              />
            ))}
          </View>
        )}

        {/* Recent user logs */}
        {userLogs.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <Text style={styles.sectionLabel}>YOUR RECENT LOGS</Text>
            {userLogs.slice(-5).reverse().map((log, i) => (
              <View key={i} style={styles.userLogRow}>
                <MaterialCommunityIcons name="pencil-circle-outline" size={16} color="#5BAD8F" />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.userLogCat}>{log.category}</Text>
                  <Text style={styles.userLogNote}>{log.note}</Text>
                  <Text style={styles.userLogTime}>
                    {new Date(log.timestamp).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Mascot */}
        <View style={styles.mascotRow}>
          <View style={styles.speechBubble}>
            <Text style={styles.speechText}>{mascotMessages[activeCategory]}</Text>
          </View>
          <Image source={require('../assets/mascot.png')} style={styles.mascotImage} resizeMode="contain" />
        </View>
      </ScrollView>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => onNavigate('summaries')}>
          <MaterialCommunityIcons name="file-document" size={24} color="#555555" />
          <Text style={styles.tabLabel}>Summaries</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => onNavigate('chat')}>
          <MaterialCommunityIcons name="chat-outline" size={24} color="#555555" />
          <Text style={styles.tabLabel}>Chats</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <MaterialCommunityIcons name="clock-outline" size={24} color="#5BAD8F" />
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>Reminders</Text>
        </TouchableOpacity>
      </View>

      {/* Add Log modal */}
      <AddLogModal visible={addLogVisible} onClose={() => setAddLogVisible(false)} onSubmit={handleAddLog} />
    </SafeAreaView>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const ACCENT     = '#5BAD8F'
const LIGHT_BG   = '#D8EFE3'
const PAGE_BG    = '#F4F4F4'
const CARD_BG    = '#FFFFFF'
const TEXT_DARK  = '#1A1A1A'
const TEXT_MID   = '#555555'
const TEXT_LIGHT = '#999999'

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: PAGE_BG },
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },

  titleRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  pageTitle:    { fontSize: 28, fontWeight: '700', color: TEXT_DARK, letterSpacing: -0.5 },
  addLogBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#E8F5EE', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14, borderWidth: 1.5, borderColor: ACCENT },
  addLogBtnText:{ fontSize: 13, fontWeight: '700', color: ACCENT },

  pillRow:        { marginBottom: 16 },
  pillRowContent: { gap: 8, paddingRight: 8 },
  pill:           { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#E5E5E5' },
  pillActive:     { backgroundColor: LIGHT_BG, borderWidth: 1.5, borderColor: ACCENT },
  pillText:       { fontSize: 13, color: TEXT_MID, fontWeight: '500' },
  pillTextActive: { color: ACCENT, fontWeight: '700' },
  pillBadge:      { backgroundColor: '#bbb', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  pillBadgeActive:{ backgroundColor: ACCENT },
  pillBadgeText:  { fontSize: 10, fontWeight: '700', color: '#fff' },

  sectionLabel: { fontSize: 11, fontWeight: '700', color: TEXT_LIGHT, letterSpacing: 1.2, marginBottom: 10, marginTop: 4 },

  reminderList: { gap: 12 },
  reminderCard: {
    backgroundColor: CARD_BG, borderRadius: 16, padding: 14, borderLeftWidth: 4,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  reminderHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  reminderHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  reminderTime:       { fontSize: 12, color: TEXT_LIGHT },
  reminderTitle:      { fontSize: 15, fontWeight: '700', color: TEXT_DARK, lineHeight: 21, marginBottom: 4 },
  reminderDetail:     { fontSize: 13, color: TEXT_MID, lineHeight: 18, marginBottom: 10 },

  tagBadge: { borderRadius: 12, paddingVertical: 3, paddingHorizontal: 10 },
  tagText:  { fontSize: 11, fontWeight: '600' },

  slotList:    { marginBottom: 10, gap: 6 },
  slotHeader:  { fontSize: 12, fontWeight: '600', color: TEXT_MID, marginBottom: 4 },
  slotBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#E3F2FD', borderRadius: 10, padding: 10 },
  slotBtnText: { fontSize: 13, color: '#1565C0', fontWeight: '500' },

  actionRow:       { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  completeBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E8F5E9', borderRadius: 10, paddingVertical: 7, paddingHorizontal: 12 },
  completeBtnText: { fontSize: 12, color: '#2E7D32', fontWeight: '600' },
  snoozeBtn:       { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF3E0', borderRadius: 10, paddingVertical: 7, paddingHorizontal: 12 },
  snoozeBtnDisabled: { backgroundColor: '#F5F5F5' },
  snoozeBtnText:   { fontSize: 12, color: '#E67E22', fontWeight: '600' },
  viewBtn:         { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E3F2FD', borderRadius: 10, paddingVertical: 7, paddingHorizontal: 12 },
  viewBtnText:     { fontSize: 12, color: '#1565C0', fontWeight: '600' },

  snoozeWarning:   { fontSize: 11, color: '#E67E22', marginTop: 8, fontStyle: 'italic' },
  snoozeEscalated: { fontSize: 11, color: '#E53935', marginTop: 8, fontStyle: 'italic' },

  upcomingCard: { backgroundColor: CARD_BG, borderRadius: 16, padding: 16, gap: 8, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  upcomingHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  upcomingTime:     { fontSize: 13, fontWeight: '700', color: '#E53935' },
  confirmedBadge:   { backgroundColor: '#C8E6C9', borderRadius: 10, paddingVertical: 3, paddingHorizontal: 10 },
  confirmedText:    { fontSize: 11, fontWeight: '600', color: '#2E7D32' },
  upcomingDoctor:   { fontSize: 14, color: TEXT_DARK, fontWeight: '600' },
  upcomingHospital: { fontSize: 13, color: TEXT_MID },
  upcomingReason:   { fontSize: 12, color: TEXT_LIGHT, fontStyle: 'italic' },
  outlineBtn:       { backgroundColor: '#F0F0F0', borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
  outlineBtnText:   { fontSize: 13, fontWeight: '600', color: TEXT_DARK },

  emptyState:    { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyTitle:    { fontSize: 18, fontWeight: '700', color: ACCENT },
  emptySubtitle: { fontSize: 14, color: TEXT_LIGHT },

  userLogRow:  { flexDirection: 'row', backgroundColor: CARD_BG, borderRadius: 12, padding: 12, marginBottom: 8, alignItems: 'flex-start' },
  userLogCat:  { fontSize: 12, fontWeight: '700', color: ACCENT },
  userLogNote: { fontSize: 13, color: TEXT_DARK, marginTop: 2 },
  userLogTime: { fontSize: 11, color: TEXT_LIGHT, marginTop: 4 },

  mascotRow:    { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'flex-end', marginTop: 36, gap: 10 },
  speechBubble: { backgroundColor: ACCENT, borderRadius: 24, paddingVertical: 12, paddingHorizontal: 20, maxWidth: '60%' },
  speechText:   { color: '#fff', fontSize: 14, fontWeight: '600' },
  mascotImage:  { width: 64, height: 64 },

  tabBar:         { flexDirection: 'row', backgroundColor: LIGHT_BG, paddingVertical: 10, paddingBottom: 16, justifyContent: 'space-around' },
  tabItem:        { alignItems: 'center', gap: 4 },
  tabLabel:       { fontSize: 12, color: TEXT_MID, fontWeight: '500' },
  tabLabelActive: { color: ACCENT, fontWeight: '700' },

  retryBtn:     { marginTop: 20, backgroundColor: ACCENT, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 32 },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet:   { backgroundColor: CARD_BG, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  modalHandle:  { width: 40, height: 4, backgroundColor: '#DDD', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle:   { fontSize: 20, fontWeight: '700', color: TEXT_DARK, marginBottom: 4 },
  modalSubtitle:{ fontSize: 13, color: TEXT_LIGHT, marginBottom: 16 },
  logCatPill:       { paddingVertical: 7, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#EFEFEF' },
  logCatPillActive: { backgroundColor: LIGHT_BG, borderWidth: 1.5, borderColor: ACCENT },
  logCatText:       { fontSize: 13, color: TEXT_MID, fontWeight: '500' },
  logCatTextActive: { color: ACCENT, fontWeight: '700' },
  logInput:     { backgroundColor: '#F5F5F5', borderRadius: 14, padding: 14, fontSize: 14, color: TEXT_DARK, minHeight: 100, marginBottom: 8 },
  logTimestamp: { fontSize: 11, color: TEXT_LIGHT, marginBottom: 20 },
  modalBtnRow:     { flexDirection: 'row', gap: 12 },
  modalCancelBtn:  { flex: 1, backgroundColor: '#EFEFEF', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: TEXT_MID },
  modalSubmitBtn:  { flex: 1, backgroundColor: ACCENT, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  modalSubmitText: { fontSize: 15, fontWeight: '700', color: '#fff' },
})