import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { supabase } from '../supabase'

const ACCENT     = '#5BAD8F'
const LIGHT_BG   = '#D8EFE3'
const CARD_BG    = '#FFFFFF'
const TEXT_DARK  = '#1A1A1A'
const TEXT_MID   = '#666666'
const TEXT_LIGHT = '#999999'

// ─────────────────────────────────────────────────────────────────────────────
// Helper — get patient.id from logged-in auth user
// ─────────────────────────────────────────────────────────────────────────────

const getPatientId = async () => {
  const { data: { user }, error: userErr } = await supabase.auth.getUser()
  if (userErr || !user) throw new Error('Not authenticated')

  const { data: patient, error: patientErr } = await supabase
    .from('patients')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (patientErr) throw new Error(`Could not load patient: ${patientErr.message}`)
  return patient.id
}

// ─────────────────────────────────────────────────────────────────────────────
// Add Log Modal
// ─────────────────────────────────────────────────────────────────────────────

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
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHandle} />

          <Text style={styles.modalTitle}>Log Activity</Text>
          <Text style={styles.modalSubtitle}>What did you do?</Text>

          {/* Category selector — Meal and Exercise only */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {['Meal', 'Exercise'].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.logCatPill, logCat === cat && styles.logCatPillActive]}
                  onPress={() => setLogCat(cat)}
                >
                  <Text style={[styles.logCatText, logCat === cat && styles.logCatTextActive]}>
                    {cat}
                  </Text>
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
            <TouchableOpacity
              style={[styles.modalSubmitBtn, saving && { opacity: 0.6 }]}
              onPress={submit}
              disabled={saving}
              activeOpacity={0.8}
            >
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
// Log Item Component
// ─────────────────────────────────────────────────────────────────────────────

const LogItem = ({ log }) => {
  // FIX: column is logged_at, not created_at
  const date    = new Date(log.logged_at)
  const timeStr = date.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })
  const dateStr = date.toLocaleDateString('en-SG', { month: 'short', day: 'numeric' })

  const iconName = log.category === 'Meal' ? 'silverware-fork-knife' : 'run'
  const bgColor  = log.category === 'Meal' ? '#FFF3E0' : '#E8F5E9'

  return (
    <View style={styles.logCard}>
      <View style={[styles.logIcon, { backgroundColor: bgColor }]}>
        <MaterialCommunityIcons name={iconName} size={20} color={ACCENT} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.logCategory}>{log.category}</Text>
        <Text style={styles.logNote}>{log.note}</Text>
        <Text style={styles.logTime}>{dateStr} at {timeStr}</Text>
      </View>
    </View>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────

export default function LogsScreen({ onNavigate }) {
  const [logs,          setLogs]          = useState([])
  const [loading,       setLoading]       = useState(true)
  const [refreshing,    setRefreshing]    = useState(false)
  const [error,         setError]         = useState(null)
  const [addLogVisible, setAddLogVisible] = useState(false)

  // ── Fetch logs ──────────────────────────────────────────────────────────────
  const fetchLogs = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true)
      setError(null)

      // FIX: get patient.id first, then query with patient_id
      const patientId = await getPatientId()

      const { data, error: fetchErr } = await supabase
        .from('patient_logs')
        .select('*')
        .eq('patient_id', patientId)        // FIX: patient_id not user.id
        .order('logged_at', { ascending: false })  // FIX: logged_at not timestamp

      if (fetchErr) throw fetchErr
      setLogs(data || [])
    } catch (err) {
      console.error('Error fetching logs:', err.message)
      setError(err.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  // ── Add log ─────────────────────────────────────────────────────────────────
  const handleAddLog = useCallback(async ({ category, note }) => {
    try {
      // FIX: get patient.id, not user.id
      const patientId = await getPatientId()

      const { error: insertErr } = await supabase.from('patient_logs').insert({
        patient_id: patientId,                        // FIX: correct foreign key
        category,
        note,
        logged_at: new Date().toISOString(),          // matches column name
        date:      new Date().toISOString().split('T')[0],
      })

      if (insertErr) throw insertErr

      Alert.alert('Logged! 📝', `${category} entry saved.`)
      await fetchLogs()
    } catch (err) {
      console.error('Error adding log:', err.message)
      Alert.alert('Error', 'Failed to save log. Please try again.')
    }
  }, [fetchLogs])

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.wrapper}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.pageTitle}>Logs</Text>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setAddLogVisible(true)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="plus" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {error ? (
            <View style={styles.errorState}>
              <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#E57373" />
              <Text style={styles.errorTitle}>Error loading logs</Text>
              <Text style={styles.errorSubtitle}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => fetchLogs()} activeOpacity={0.8}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : loading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={ACCENT} />
              <Text style={{ color: TEXT_LIGHT, marginTop: 12, fontSize: 14 }}>Loading logs…</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => fetchLogs(true)}
                  tintColor={ACCENT}
                />
              }
            >
              {logs.length > 0 ? (
                logs.map((log) => <LogItem key={log.id} log={log} />)
              ) : (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons name="notebook-outline" size={48} color={TEXT_LIGHT} />
                  <Text style={styles.emptyTitle}>No logs yet</Text>
                  <Text style={styles.emptySubtitle}>Tap + to start tracking your meals and exercise!</Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </SafeAreaView>

      {/* Tab bar — outside SafeAreaView to extend to screen edge */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => onNavigate('summaries')}>
          <MaterialCommunityIcons name="file-document" size={24} color="#555555" />
          <Text style={styles.tabLabel}>Summaries</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => onNavigate('chat')}>
          <MaterialCommunityIcons name="chat-outline" size={24} color="#555555" />
          <Text style={styles.tabLabel}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => onNavigate('reminders')}>
          <MaterialCommunityIcons name="clock-outline" size={24} color="#555555" />
          <Text style={styles.tabLabel}>Reminders</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <MaterialCommunityIcons name="notebook-outline" size={24} color={ACCENT} />
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>Logs</Text>
        </TouchableOpacity>
      </View>

      {/* Add Log modal */}
      <AddLogModal
        visible={addLogVisible}
        onClose={() => setAddLogVisible(false)}
        onSubmit={handleAddLog}
      />
    </View>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper:   { flex: 1, backgroundColor: '#FFFFFF' },
  safe:      { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
  },
  pageTitle: { fontSize: 28, fontWeight: '700', color: TEXT_DARK, letterSpacing: -0.5 },
  addBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: ACCENT, justifyContent: 'center', alignItems: 'center',
  },

  scroll:        { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },

  logCard: {
    flexDirection: 'row', backgroundColor: CARD_BG,
    borderRadius: 12, padding: 14, marginBottom: 12,
    alignItems: 'flex-start', gap: 12,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  logIcon:     { width: 44, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  logCategory: { fontSize: 13, fontWeight: '700', color: ACCENT, marginBottom: 2 },
  logNote:     { fontSize: 14, color: TEXT_DARK, marginBottom: 4 },
  logTime:     { fontSize: 11, color: TEXT_LIGHT },

  emptyState:   { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyTitle:   { fontSize: 18, fontWeight: '700', color: ACCENT },
  emptySubtitle:{ fontSize: 14, color: TEXT_LIGHT, textAlign: 'center' },

  errorState:   { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, gap: 12 },
  errorTitle:   { fontSize: 18, fontWeight: '700', color: '#E57373' },
  errorSubtitle:{ fontSize: 14, color: TEXT_LIGHT, textAlign: 'center' },
  retryBtn:     { backgroundColor: ACCENT, borderRadius: 8, paddingHorizontal: 24, paddingVertical: 10, marginTop: 12 },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  tabBar:         { flexDirection: 'row', backgroundColor: LIGHT_BG, paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 24 : 12, justifyContent: 'space-around' },
  tabItem:        { alignItems: 'center', gap: 4 },
  tabLabel:       { fontSize: 12, color: TEXT_MID, fontWeight: '500' },
  tabLabelActive: { color: ACCENT, fontWeight: '700' },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: { backgroundColor: CARD_BG, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
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