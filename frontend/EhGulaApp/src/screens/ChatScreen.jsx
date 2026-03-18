import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  SafeAreaView,
} from 'react-native'
import ChatBubble from '../components/ChatBubble'
import AgentThinking from '../components/AgentThinking'
import {
  predefinedQuestions,
  agentSteps,
  mockResponses,
} from '../mockData'

const TABS = ['General', 'Medications', 'Appointments', 'Meals', 'Exercise']
const TAB_KEYS = ['general', 'medications', 'appointments', 'meals', 'exercise']

// These tabs always show the thinking animation
const THINKING_TABS = ['appointments', 'medications', 'meals', 'exercise']

export default function ChatScreen() {
  const [activeTab, setActiveTab] = useState(0)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [thinkingSteps, setThinkingSteps] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(true)
  const scrollRef = useRef(null)
  const lastQuestion = useRef('')

  const tabKey = TAB_KEYS[activeTab]

  // Auto scroll to bottom when messages update
  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true })
    }, 100)
  }, [messages, isThinking])

  // Reset chat when switching tabs
  const handleTabChange = (index) => {
    setActiveTab(index)
    setMessages([])
    setInput('')
    setIsThinking(false)
    setShowSuggestions(true)
    lastQuestion.current = ''
  }

  const getNow = () => {
    const d = new Date()
    let h = d.getHours()
    const m = d.getMinutes()
    const ampm = h >= 12 ? 'PM' : 'AM'
    h = h % 12 || 12
    return `${h}:${m.toString().padStart(2, '0')} ${ampm}`
  }

  const addAgentResponse = (question) => {
    // TODO: Replace with real API call when backend is ready:
    // try {
    //   const res = await fetch('http://your-backend/api/chat', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ message: question, tab: tabKey })
    //   })
    //   const data = await res.json()
    //   responseText = data.reply
    // } catch (e) { console.error(e) }

    const responseText =
      mockResponses[question] ||
      "I've noted your question. Once the AI is connected, I'll give you a detailed answer based on your health data. 🤖"

    setMessages(prev => [
      ...prev,
      {
        id: Date.now() + 1,
        sender: 'agent',
        message: responseText,
        time: getNow(),
      },
    ])
  }

  const handleSend = (text) => {
    const question = (text || input).trim()
    if (!question) return

    lastQuestion.current = question
    setInput('')
    setShowSuggestions(false)

    // Add patient message to chat
    setMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        sender: 'patient',
        message: question,
        time: getNow(),
      },
    ])

    // Show thinking animation for certain tabs, direct response for general
    if (THINKING_TABS.includes(tabKey)) {
      setThinkingSteps(agentSteps[tabKey] || agentSteps.general)
      setIsThinking(true)
    } else {
      setTimeout(() => addAgentResponse(question), 700)
    }
  }

  const suggestions = predefinedQuestions[tabKey] || []

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >

        {/* ── Header ── */}
        <View style={styles.header}>
          <Image
            source={require('../assets/logo1.png')}
            style={styles.logo1}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>Chat</Text>
        </View>

        {/* ── Tabs ── */}
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
              <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Messages ── */}
        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Greeting — always shown at top */}
          <ChatBubble sender="agent" message="Hello there!" />
          <ChatBubble
            sender="agent"
            message="Ask me a question, or select any of the options below to start:"
          />

          {/* Conversation messages */}
          {messages.map(msg => (
            <ChatBubble
              key={msg.id}
              sender={msg.sender}
              message={msg.message}
              time={msg.time}
            />
          ))}

          {/* Animated thinking checklist */}
          {isThinking && (
            <AgentThinking
              steps={thinkingSteps}
              onComplete={() => {
                setIsThinking(false)
                addAgentResponse(lastQuestion.current)
              }}
            />
          )}

          {/* Suggestion chips — only shown before first message */}
          {showSuggestions && suggestions.map((q, i) => (
            <TouchableOpacity
              key={i}
              style={styles.suggestion}
              onPress={() => handleSend(q)}
              activeOpacity={0.7}
            >
              <Text style={styles.suggestionText}>{q}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Input area ── */}
        <View style={styles.inputArea}>
          <Image
            source={require('../assets/mascot.png')}
            style={styles.mascot}
            resizeMode="contain"
          />

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
              <TouchableOpacity style={styles.actionBtn}>
                <Text style={styles.actionIcon}>⊞</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <Text style={styles.actionIcon}>{'</>'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <Text style={styles.actionIcon}>🎙</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sendBtn, input.trim() ? styles.sendBtnActive : null]}
                onPress={() => handleSend()}
                disabled={!input.trim()}
              >
                <Text style={styles.sendIcon}>↑</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 10,
  },
  logo1: {
    width: 32,
    height: 32,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },

  // Tabs
  tabsScroll: {
    maxHeight: 48,
    marginBottom: 4,
  },
  tabsContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  tabActive: {
    backgroundColor: '#F4A69E',
  },
  tabText: {
    fontSize: 13,
    color: '#888888',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Messages
  messages: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    paddingTop: 16,
    paddingBottom: 16,
  },

  // Suggestion chips
  suggestion: {
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  suggestionText: {
    fontSize: 14,
    color: '#1A1A1A',
    textAlign: 'center',
  },

  // Input area
  inputArea: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  mascot: {
    width: 56,
    height: 56,
  },
  inputBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    minHeight: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    fontSize: 14,
    color: '#1A1A1A',
    minHeight: 36,
    maxHeight: 100,
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  actionBtn: {
    padding: 4,
    marginRight: 8,
  },
  actionIcon: {
    fontSize: 16,
    color: '#555555',
  },
  sendBtn: {
    marginLeft: 'auto',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#CCCCCC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnActive: {
    backgroundColor: '#5B9E8F',
  },
  sendIcon: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
})