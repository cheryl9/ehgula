// ─────────────────────────────────────────────────────────────────────────────
// src/screens/ChatScreen.jsx
// Mock data imports removed. Suggestion chips and agent context now come
// from live Supabase data via usePatientData.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useRef, useEffect, useMemo } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, Image,
  SafeAreaView, Alert, ActivityIndicator,
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { supabase }        from '../supabase'
import { usePatientData }  from '../hooks/usePatientData'
import ChatBubble          from '../components/ChatBubble'
import AgentThinking       from '../components/AgentThinking'

// ─────────────────────────────────────────────────────────────────────────────
// Tab config
// ─────────────────────────────────────────────────────────────────────────────

const TABS     = ['General', 'Medications', 'Appointments', 'Meals', 'Exercise']
const TAB_KEYS = ['general', 'medications', 'appointments', 'meals', 'exercise']

// Tabs that show the agentic thinking animation before responding
const THINKING_TABS = ['appointments', 'medications', 'meals', 'exercise']

// ─────────────────────────────────────────────────────────────────────────────
// Thinking steps — shown in AgentThinking animation per tab
// (These describe what the AI agent is doing — no patient data needed)
// ─────────────────────────────────────────────────────────────────────────────

const AGENT_STEPS = {
  general: [
    'Reading your health profile…',
    'Checking recent activity…',
    'Preparing response…',
  ],
  medications: [
    'Reading your medication schedule…',
    'Checking today\'s dose log…',
    'Checking for missed doses…',
    'Checking meal log for food-dependent meds…',
    'Preparing medication advice…',
  ],
  appointments: [
    'Analysing glucose trends (last 5 days)…',
    'Counting missed medications this week…',
    'Checking days since last clinic visit…',
    'Calculating appointment urgency score…',
    'Cross-referencing available clinic slots…',
    'Preparing appointment recommendation…',
  ],
  meals: [
    'Checking today\'s meal log…',
    'Reading glucose readings around meal times…',
    'Checking calendar for blocked lunch slots…',
    'Calculating glucose impact per meal…',
    'Preparing food advice…',
  ],
  exercise: [
    'Reading today\'s step count…',
    'Checking sitting episodes…',
    'Reviewing heart rate data…',
    'Calculating steps remaining to goal…',
    'Preparing exercise suggestion…',
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// Suggestion chips — generated from live patient data
// ─────────────────────────────────────────────────────────────────────────────

function buildSuggestions(tabKey, data) {
  // Fallback static suggestions if data isn't loaded yet
  const static_ = {
    general: [
      'How am I doing overall this week?',
      'What should I focus on today?',
      'Give me a summary of my health.',
    ],
    medications: [
      'Which medications have I missed?',
      'Can I take Metformin without food?',
      'What happens if I miss a dose?',
    ],
    appointments: [
      'Do I need to see a doctor soon?',
      'Book me the next available slot.',
      'When was my last clinic visit?',
    ],
    meals: [
      'What should I eat for lunch?',
      'Did skipping lunch affect my glucose?',
      'Suggest a diabetic-friendly dinner near me.',
    ],
    exercise: [
      'How many steps have I done today?',
      'I\'ve been sitting for 3 hours, what should I do?',
      'What\'s a good exercise routine for me?',
    ],
  }

  if (!data) return static_[tabKey] || []

  // Build dynamic, context-aware chips from real data
  const chips = []

  if (tabKey === 'medications') {
    const missed = (data.doseLogs || []).filter((d) => d.status === 'missed')
    if (missed.length > 0) chips.push(`I missed ${missed.length} dose${missed.length > 1 ? 's' : ''} today — what should I do?`)
    const food = (data.medications || []).filter((m) => m.requires_food)
    if (food.length) chips.push(`I haven't eaten yet — can I still take ${food[0].name}?`)
    chips.push('What are my medications for today?')
  }

  if (tabKey === 'appointments') {
    const confirmed = (data.appointments || []).find((a) => a.status === 'confirmed')
    if (confirmed) chips.push(`When is my next appointment with ${confirmed.clinician_name || 'my doctor'}?`)
    const completed = (data.appointments || []).filter((a) => a.status === 'completed')
    if (completed.length) {
      const last     = new Date(completed[completed.length - 1].date)
      const daysSince = Math.floor((Date.now() - last.getTime()) / 86400000)
      chips.push(`It's been ${daysSince} days since my last visit. Should I go again?`)
    }
    chips.push('Book me the next available clinic slot.')
  }

  if (tabKey === 'meals') {
    const today  = new Date().toISOString().split('T')[0]
    const todayLog = (data.mealLogs || []).find((m) => m.date === today)
    if (todayLog?.lunch_skipped) chips.push('I skipped lunch again — how does that affect my glucose?')
    chips.push('Suggest a diabetic-friendly meal near me.')
    chips.push('What foods should I avoid with my medications?')
  }

  if (tabKey === 'exercise') {
    const steps = data.exercise?.steps ?? 0
    const goal  = data.exercise?.step_goal ?? 10000
    if (steps < goal) chips.push(`I've done ${steps.toLocaleString()} steps. How do I hit ${goal.toLocaleString()}?`)
    const sitting = (data.exercise?.sitting_episodes || []).find((s) => s.flagged)
    if (sitting) chips.push(`I've been sitting since ${sitting.start_time}. What should I do?`)
    chips.push('What exercise is safe for my glucose level today?')
  }

  if (tabKey === 'general') {
    const avgGlucose = data.glucose?.length
      ? (data.glucose.reduce((a, r) => a + r.value_mmol, 0) / data.glucose.length).toFixed(1)
      : null
    if (avgGlucose) chips.push(`My average glucose this week is ${avgGlucose} mmol/L. Is that good?`)
    chips.push('What should I focus on today?')
    chips.push('Give me a summary of my week.')
  }

  // Fill up to 3 chips
  const fallback = static_[tabKey] || []
  while (chips.length < 3 && fallback.length > chips.length) {
    const fb = fallback[chips.length]
    if (fb && !chips.includes(fb)) chips.push(fb)
  }

  return chips.slice(0, 3)
}

// ─────────────────────────────────────────────────────────────────────────────
// Build patient context string to send to AI backend
// ─────────────────────────────────────────────────────────────────────────────

function buildPatientContext(tabKey, data) {
  if (!data) return ''
  const lines = []

  if (data.patient) {
    lines.push(`Patient: ${data.patient.name || 'Unknown'}, Age ${data.patient.age || '—'}, ${data.patient.condition || 'Diabetes'}`)
  }

  if (tabKey === 'medications' || tabKey === 'general') {
    const missed = (data.doseLogs || []).filter((d) => d.status === 'missed').map((d) => d.medication_name)
    if (missed.length) lines.push(`Missed doses today: ${missed.join(', ')}`)
    const adherence = data.doseLogsWeek?.length
      ? Math.round((data.doseLogsWeek.filter((d) => d.status === 'taken').length / data.doseLogsWeek.length) * 100)
      : null
    if (adherence != null) lines.push(`Weekly medication adherence: ${adherence}%`)
  }

  if (tabKey === 'appointments' || tabKey === 'general') {
    const unstable = (data.glucose || []).filter((r) => r.value_mmol > 9 || r.value_mmol < 4).length
    if (unstable) lines.push(`Unstable glucose readings this week: ${unstable}`)
    const completed = (data.appointments || []).filter((a) => a.status === 'completed')
    if (completed.length) {
      const daysSince = Math.floor((Date.now() - new Date(completed[completed.length - 1].date).getTime()) / 86400000)
      lines.push(`Days since last clinic visit: ${daysSince}`)
    }
  }

  if (tabKey === 'meals' || tabKey === 'general') {
    const today    = new Date().toISOString().split('T')[0]
    const todayLog = (data.mealLogs || []).find((m) => m.date === today)
    if (todayLog?.lunch_skipped) lines.push('Lunch was skipped today.')
    const skipCount = (data.mealLogs || []).filter((m) => m.lunch_skipped).length
    if (skipCount > 1) lines.push(`Lunch skipped ${skipCount} times this week.`)
  }

  if (tabKey === 'exercise' || tabKey === 'general') {
    if (data.exercise) {
      lines.push(`Steps today: ${data.exercise.steps ?? 0} / ${data.exercise.step_goal ?? 10000}`)
      const sitting = (data.exercise.sitting_episodes || []).filter((s) => s.flagged)
      if (sitting.length) lines.push(`Prolonged sitting episodes: ${sitting.length}`)
    }
  }

  return lines.join('\n')
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────

export default function ChatScreen({ onNavigate }) {
  const { data, loading: dataLoading } = usePatientData()

  const [activeTab,       setActiveTab]       = useState(0)
  const [messages,        setMessages]        = useState([])
  const [input,           setInput]           = useState('')
  const [isThinking,      setIsThinking]      = useState(false)
  const [thinkingSteps,   setThinkingSteps]   = useState([])
  const [showSuggestions, setShowSuggestions] = useState(true)
  const scrollRef     = useRef(null)
  const lastQuestion  = useRef('')

  const tabKey = TAB_KEYS[activeTab]

  // Dynamic suggestions from live data
  const suggestions = useMemo(() => buildSuggestions(tabKey, data), [tabKey, data])

  // Auto-scroll on new messages
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
  }, [messages, isThinking])

  const handleTabChange = (index) => {
    setActiveTab(index)
    setMessages([])
    setInput('')
    setIsThinking(false)
    setShowSuggestions(true)
    lastQuestion.current = ''
  }

  const getNow = () => {
    const d    = new Date()
    let h      = d.getHours()
    const m    = d.getMinutes()
    const ampm = h >= 12 ? 'PM' : 'AM'
    h = h % 12 || 12
    return `${h}:${m.toString().padStart(2, '0')} ${ampm}`
  }

  // ── Agent response — calls your AI backend ──────────────────────────────────
  // Wired up for your teammate's SEA-LION backend.
  // Replace the URL below when the backend endpoint is ready.
  const addAgentResponse = async (question) => {
    const patientContext = buildPatientContext(tabKey, data)

    let responseText = ''

    try {
      // ── TODO: swap this URL for your teammate's actual backend endpoint ──
      const res = await fetch('https://YOUR_BACKEND_URL/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message:        question,
          tab:            tabKey,
          patientContext, // patient health data injected as context
        }),
      })

      if (!res.ok) throw new Error(`Backend returned ${res.status}`)
      const responseData = await res.json()
      responseText = responseData.reply || responseData.message || ''
    } catch (e) {
      // Fallback while backend is not yet connected
      console.warn('[ChatScreen] Backend not connected:', e.message)
      responseText = `I've noted your question about "${question}". Once the AI backend is connected, I'll give you a detailed answer based on your health data.`

      if (patientContext) {
        responseText += `\n\nHere's the context I'd use:\n${patientContext}`
      }
    }

    setMessages((prev) => [
      ...prev,
      { id: Date.now() + 1, sender: 'agent', message: responseText, time: getNow() },
    ])
  }

  // ── Send message ────────────────────────────────────────────────────────────
  const handleSend = (text) => {
    const question = (text || input).trim()
    if (!question) return

    lastQuestion.current = question
    setInput('')
    setShowSuggestions(false)

    setMessages((prev) => [
      ...prev,
      { id: Date.now(), sender: 'patient', message: question, time: getNow() },
    ])

    if (THINKING_TABS.includes(tabKey)) {
      setThinkingSteps(AGENT_STEPS[tabKey] || AGENT_STEPS.general)
      setIsThinking(true)
    } else {
      setTimeout(() => addAgentResponse(question), 700)
    }
  }

  // ── Sign out ────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert(
      'Sign out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: async () => { await supabase.auth.signOut() },
        },
      ]
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.wrapper}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Chat</Text>
            {dataLoading && <ActivityIndicator size="small" color="#5BAD8F" style={{ marginRight: 8 }} />}
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <MaterialCommunityIcons name="logout" size={20} color="#E53935" />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContent}
            style={styles.tabsScroll}
          >
            {TABS.map((tab, i) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === i && styles.tabActive]}
                onPress={() => handleTabChange(i)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Messages */}
          <ScrollView
            ref={scrollRef}
            style={styles.messages}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <ChatBubble sender="agent" message="Hello there!" />
            <ChatBubble sender="agent" message="Ask me a question, or select any of the options below to start:" />

            {messages.map((msg) => (
              <ChatBubble key={msg.id} sender={msg.sender} message={msg.message} time={msg.time} />
            ))}

            {isThinking && (
              <AgentThinking
                steps={thinkingSteps}
                onComplete={() => {
                  setIsThinking(false)
                  addAgentResponse(lastQuestion.current)
                }}
              />
            )}

            {/* Suggestion chips — show while no messages sent yet */}
            {showSuggestions && (
              dataLoading ? (
                <View style={styles.suggestionLoading}>
                  <ActivityIndicator size="small" color="#5BAD8F" />
                  <Text style={styles.suggestionLoadingText}>Loading your health data…</Text>
                </View>
              ) : (
                suggestions.map((q, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.suggestion}
                    onPress={() => handleSend(q)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.suggestionText}>{q}</Text>
                  </TouchableOpacity>
                ))
              )
            )}
          </ScrollView>

          {/* Input area */}
          <View style={styles.inputArea}>
            <Image source={require('../assets/mascot.png')} style={styles.mascot} resizeMode="contain" />
            <View style={styles.inputBox}>
              <TextInput
                style={styles.input}
                placeholder="What would you like to know?"
                placeholderTextColor="#AAAAAA"
                value={input}
                onChangeText={setInput}
                multiline
                returnKeyType="send"
                blurOnSubmit
                onSubmitEditing={() => handleSend()}
              />
              <View style={styles.inputActions}>
                <TouchableOpacity
                  style={[styles.sendBtn, input.trim() && styles.sendBtnActive]}
                  onPress={() => handleSend()}
                  disabled={!input.trim()}
                >
                  <MaterialCommunityIcons name="arrow-up" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Bottom tab bar — outside SafeAreaView to extend to screen edge */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity style={styles.bottomTabItem} onPress={() => onNavigate?.('summaries')}>
          <MaterialCommunityIcons name="file-document" size={24} color="#555555" />
          <Text style={styles.bottomTabLabel}>Summaries</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomTabItem} onPress={() => onNavigate?.('chat')}>
          <MaterialCommunityIcons name="chat-outline" size={24} color="#5BAD8F" />
          <Text style={[styles.bottomTabLabel, styles.bottomTabLabelActive]}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomTabItem} onPress={() => onNavigate?.('reminders')}>
          <MaterialCommunityIcons name="clock-outline" size={24} color="#555555" />
          <Text style={styles.bottomTabLabel}>Reminders</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomTabItem} onPress={() => onNavigate?.('logs')}>
          <MaterialCommunityIcons name="notebook-outline" size={24} color="#555555" />
          <Text style={styles.bottomTabLabel}>Logs</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles — identical structure to original
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#FFFFFF' },
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },

  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, gap: 10 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#1A1A1A', letterSpacing: -0.5, flex: 1 },
  logoutBtn:   { padding: 8 },

  tabsScroll:   { maxHeight: 48, marginBottom: 4 },
  tabsContent:  { paddingHorizontal: 16, alignItems: 'center', gap: 8 },
  tab:          { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F0F0F0' },
  tabActive:    { backgroundColor: '#F4A69E' },
  tabText:      { fontSize: 13, color: '#888888', fontWeight: '500' },
  tabTextActive:{ color: '#FFFFFF', fontWeight: '600' },

  messages:        { flex: 1, paddingHorizontal: 16 },
  messagesContent: { paddingTop: 16, paddingBottom: 16 },

  suggestion:        { backgroundColor: '#F0F0F0', borderRadius: 12, padding: 14, marginBottom: 10 },
  suggestionText:    { fontSize: 14, color: '#1A1A1A', textAlign: 'center' },
  suggestionLoading: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14 },
  suggestionLoadingText: { fontSize: 13, color: '#888' },

  inputArea:   { backgroundColor: '#E8F5E9', paddingHorizontal: 16, paddingTop: 12, flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  mascot:      { width: 90, height: 90 },
  inputBox:    { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8, minHeight: 80, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  input:       { fontSize: 14, color: '#1A1A1A', minHeight: 36, maxHeight: 100 },
  inputActions:{ flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  actionBtn:   { padding: 4, marginRight: 8 },
  sendBtn:     { marginLeft: 'auto', width: 32, height: 32, borderRadius: 16, backgroundColor: '#CCCCCC', alignItems: 'center', justifyContent: 'center' },
  sendBtnActive:{ backgroundColor: '#5B9E8F' },

  bottomTabBar:       { flexDirection: 'row', backgroundColor: '#D8EFE3', paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 24 : 12, justifyContent: 'space-around' },
  bottomTabItem:      { alignItems: 'center', gap: 6 },
  bottomTabLabel:     { fontSize: 12, color: '#555', fontWeight: '500' },
  bottomTabLabelActive:{ color: '#5BAD8F', fontWeight: '700' },
})