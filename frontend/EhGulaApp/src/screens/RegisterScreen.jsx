import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Image, SafeAreaView, ActivityIndicator, Alert,
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { supabase } from '../supabase'

export default function RegisterScreen({ onNavigate }) {
  // FIX: renamed 'username' → 'email' to match Supabase auth and avoid confusion
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [confirmPassword, setConfirm]   = useState('')
  const [loading, setLoading]           = useState(false)

  const handleRegister = async () => {
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Missing fields', 'Please fill in all fields.')
      return
    }
    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Invalid email', 'Please enter a valid email address.')
      return
    }
    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Passwords do not match.')
      return
    }
    // FIX: raised minimum to 8 characters for a healthcare app
    if (password.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password.trim(),
    })
    setLoading(false)
    if (error) {
      Alert.alert('Registration failed', error.message)
    } else {
      // FIX: clearer messaging — tells user they MUST confirm email before logging in
      Alert.alert(
        'Almost there!',
        'We sent a confirmation link to your email address. Please open it to activate your account, then come back to log in.',
        [{ text: 'Go to Login', onPress: () => onNavigate('login') }]
      )
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.inner}>
        {/* Logo */}
        <Image source={require('../assets/logo.png')} style={s.logo} resizeMode="contain" />

        {/* Card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Create Account</Text>

          {/* FIX: placeholder is "Email", icon is email, keyboard is email */}
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
              placeholder="Password (min. 8 characters)"
              placeholderTextColor="#AAAAAA"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="newPassword"
            />
          </View>

          <View style={s.inputRow}>
            <MaterialCommunityIcons name="lock-outline" size={20} color="#555555" />
            <TextInput
              style={s.input}
              placeholder="Confirm Password"
              placeholderTextColor="#AAAAAA"
              value={confirmPassword}
              onChangeText={setConfirm}
              secureTextEntry
              textContentType="newPassword"
            />
          </View>

          <View style={s.btnRow}>
            <TouchableOpacity
              style={s.backBtn}
              onPress={() => onNavigate('login')}
              activeOpacity={0.85}
            >
              <Text style={s.backBtnText}>← Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.enterBtn, loading && s.enterBtnDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.enterBtnText}>Register</Text>}
            </TouchableOpacity>
          </View>
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

  btnRow:           { flexDirection: 'row', gap: 12, marginTop: 8 },
  backBtn:          { flex: 1, backgroundColor: '#C8E6C9', borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  backBtnText:      { color: '#2E7D32', fontWeight: '700', fontSize: 15 },
  enterBtn:         { flex: 1, backgroundColor: '#F4A69E', borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  enterBtnDisabled: { opacity: 0.6 },
  enterBtnText:     { color: '#fff', fontWeight: '700', fontSize: 15 },
})