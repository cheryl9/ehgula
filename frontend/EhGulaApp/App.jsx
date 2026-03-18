import React, { useState, useEffect, createContext, useContext } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { supabase } from './src/supabase'

import LoginScreen     from './src/screens/LoginScreen'
import RegisterScreen  from './src/screens/RegisterScreen'
import LandingScreen   from './src/screens/LandingScreen'
import ChatScreen      from './src/screens/ChatScreen'
import RemindersScreen from './src/screens/RemindersScreen'
import SummariesScreen from './src/screens/SummariesScreen'

// ─────────────────────────────────────────────
// Auth Context — exported so any hook can call
// useAuth() to get user + patientId
// ─────────────────────────────────────────────
export const AuthContext = createContext(null)
export const useAuth    = () => useContext(AuthContext)

// ─────────────────────────────────────────────
// Fetches patient UUID once on login
// patients.user_id = auth.user.id (confirmed schema)
// ─────────────────────────────────────────────
async function fetchPatientId(userId) {
  try {
    const { data, error } = await supabase
      .from('patients')
      .select('id')
      .eq('user_id', userId)
      .single()
    if (error) throw error
    return data.id
  } catch (err) {
    console.error('[App] fetchPatientId failed:', err.message)
    return null
  }
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('login')
  const [authChecked,   setAuthChecked]   = useState(false)
  const [user,          setUser]          = useState(null)
  const [patientId,     setPatientId]     = useState(null)

  useEffect(() => {
    // Check existing session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        const pid = await fetchPatientId(session.user.id)
        setPatientId(pid)
        setCurrentScreen('landing')
      }
      setAuthChecked(true)
    })

    // Handle sign-in and sign-out events
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user)
        const pid = await fetchPatientId(session.user.id)
        setPatientId(pid)
        setCurrentScreen('landing')
      } else {
        setUser(null)
        setPatientId(null)
        setCurrentScreen('login')
      }
    })

    return () => listener?.subscription?.unsubscribe()
  }, [])

  // Show spinner while checking auth
  if (!authChecked) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#D8F0E0' }}>
          <ActivityIndicator size="large" color="#5BAD8F" />
        </View>
      </SafeAreaProvider>
    )
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'login':     return <LoginScreen     onNavigate={setCurrentScreen} />
      case 'register':  return <RegisterScreen  onNavigate={setCurrentScreen} />
      case 'landing':   return <LandingScreen   onNavigate={setCurrentScreen} />
      case 'chat':      return <ChatScreen      onNavigate={setCurrentScreen} />
      case 'summaries': return <SummariesScreen onNavigate={setCurrentScreen} />
      case 'reminders': return <RemindersScreen onNavigate={setCurrentScreen} />
      default:          return <LoginScreen     onNavigate={setCurrentScreen} />
    }
  }

  return (
    <AuthContext.Provider value={{ user, patientId }}>
      <SafeAreaProvider>
        {renderScreen()}
      </SafeAreaProvider>
    </AuthContext.Provider>
  )
}