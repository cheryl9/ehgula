import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Image, SafeAreaView, ActivityIndicator, Alert,
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { supabase } from '../supabase'

export default function LoginScreen({ onNavigate }) {
  // FIX: renamed from 'username' to 'email' — Supabase auth uses email
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)

  const handleLogin = async () => {
    // FIX: validation now checks email & password with correct variable names
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter your email and password.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    })
    setLoading(false)
    if (error) {
      // FIX: give a friendlier hint if the email isn't confirmed yet
      if (error.message.toLowerCase().includes('email not confirmed')) {
        Alert.alert(
          'Email not confirmed',
          'Please check your inbox and click the confirmation link before logging in.'
        )
      } else {
        Alert.alert('Login failed', error.message)
      }
    }
    // onNavigate('landing') is NOT needed here —
    // App.js's onAuthStateChange listener handles navigation on successful sign-in
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.inner}>
        {/* Logo */}
        <Image source={require('../assets/logo.png')} style={s.logo} resizeMode="contain" />

        {/* Card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Welcome back!</Text>

          {/* FIX: placeholder and keyboardType now consistently say "Email" */}
          <View style={s.inputRow}>
            <MaterialCommunityIcons name="email-outline" size={20} color="#555555" />
            <TextInput
              style={s.input}
              placeholder="Email"
              placeholderTextColor="#AAAAAA"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
            />
          </View>

          <View style={s.inputRow}>
            <MaterialCommunityIcons name="lock-outline" size={20} color="#555555" />
            <TextInput
              style={s.input}
              placeholder="Password"
              placeholderTextColor="#AAAAAA"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="password"
            />
          </View>

          <Text style={s.registerNote}>
            Don't have an account?{' '}
            <Text style={s.registerLink} onPress={() => onNavigate('register')}>
              Register here.
            </Text>
          </Text>

          <TouchableOpacity
            style={[s.enterBtn, loading && s.enterBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.enterBtnText}>Login</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

const BG = '#D8F0E0'
const s = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: BG },
  inner: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },

  logo: { width: 180, height: 140, marginBottom: 24 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A', textAlign: 'center', marginBottom: 20 },

  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F2F2F2', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12, gap: 10,
  },
  input:      { flex: 1, fontSize: 14, color: '#1A1A1A' },

  registerNote: { fontSize: 12, color: '#999', textAlign: 'center', marginBottom: 20 },
  registerLink: { color: '#5BAD8F', fontWeight: '600', textDecorationLine: 'underline' },

  enterBtn:         { backgroundColor: '#F4A69E', borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  enterBtnDisabled: { opacity: 0.6 },
  enterBtnText:     { color: '#fff', fontWeight: '700', fontSize: 15 },
})