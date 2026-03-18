import React, { useState, useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { supabase } from './src/supabase'

import LoginScreen     from './src/screens/LoginScreen'
import RegisterScreen  from './src/screens/RegisterScreen'
import LandingScreen   from './src/screens/LandingScreen'
import ChatScreen      from './src/screens/ChatScreen'
import RemindersScreen from './src/screens/RemindersScreen'
import SummariesScreen from './src/screens/SummariesScreen'

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('login')
  const [authChecked, setAuthChecked]     = useState(false)

  useEffect(() => {
    // Check existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setCurrentScreen('landing')
      setAuthChecked(true)
    })

    // FIX: Handle both sign-in AND sign-out events
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setCurrentScreen('landing')
      } else {
        setCurrentScreen('login')
      }
    })

    return () => listener?.subscription?.unsubscribe()
  }, [])

  // FIX: Show a spinner instead of a blank screen while checking auth
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
      case 'chat':      return <ChatScreen       onNavigate={setCurrentScreen} />
      case 'summaries': return <SummariesScreen  onNavigate={setCurrentScreen} />
      case 'reminders': return <RemindersScreen  onNavigate={setCurrentScreen} />
      default:          return <LoginScreen      onNavigate={setCurrentScreen} />
    }
  }

  return (
    <SafeAreaProvider>
      {renderScreen()}
    </SafeAreaProvider>
  )
}