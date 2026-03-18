import React from 'react'
import {
  View, Text, TouchableOpacity,
  StyleSheet, Image, SafeAreaView, Alert,
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { supabase } from '../supabase'

const FEATURES = [
  {
    icon: 'file-document',
    iconBg: '#FDECEA',
    title: 'Summaries',
    desc: 'See all your past health-related records.',
    screen: 'summaries',
  },
  {
    icon: 'chat-outline',
    iconBg: '#E8F5E9',
    title: 'Chat',
    desc: 'Ask Dr. Gula a question related to diabetes.',
    screen: 'chat',
  },
  {
    icon: 'clock-outline',
    iconBg: '#FFF9C4',
    title: 'Reminders',
    desc: 'An overview of all actions to be taken.',
    screen: 'reminders',
  },
]

export default function LandingScreen({ onNavigate }) {

  // FIX: added sign-out — supabase.auth.signOut() triggers onAuthStateChange
  // in App.js which automatically redirects to login. No manual onNavigate needed.
  const handleSignOut = () => {
    Alert.alert(
      'Sign out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut()
          },
        },
      ]
    )
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.inner}>

        {/* Header row with sign-out button */}
        <View style={s.headerRow}>
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={s.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
            <Text style={s.signOutText}>Sign out</Text>
          </TouchableOpacity>
        </View>

        {/* Speech bubble */}
        <View style={s.bubble}>
          <Text style={s.bubbleText}>Hi! I'm Dr Gula. Here's what I can help you with:</Text>
        </View>

        {/* Feature list */}
        <View style={s.card}>
          {FEATURES.map((f, i) => (
            <TouchableOpacity
              key={f.screen}
              style={[s.featureRow, i < FEATURES.length - 1 && s.featureRowBorder]}
              onPress={() => onNavigate(f.screen)}
              activeOpacity={0.75}
            >
              <View style={[s.iconWrap, { backgroundColor: f.iconBg }]}>
                <MaterialCommunityIcons name={f.icon} size={24} color="#555555" />
              </View>
              <View style={s.featureText}>
                <Text style={s.featureTitle}>{f.title}</Text>
                <Text style={s.featureDesc}>{f.desc}</Text>
              </View>
              <Text style={s.chevron}>›</Text>
            </TouchableOpacity>
          ))}

          {/* FIX: "Let's start!" now goes to 'chat' as the primary action.
              Change the screen value below if you prefer a different default. */}
          <TouchableOpacity
            style={s.startBtn}
            onPress={() => onNavigate('chat')}
            activeOpacity={0.85}
          >
            <Text style={s.startBtnText}>Let's start!</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom bar (decorative) */}
        <View style={s.bottomBar}>
          <Text style={s.bottomBarIcon}>⊞</Text>
          <Text style={s.bottomBarIcon}>{'</>'}</Text>
          <Text style={s.bottomBarIcon}>🎙</Text>
          <TouchableOpacity style={s.bottomBarSend}>
            <Text style={s.bottomBarSendIcon}>↑</Text>
          </TouchableOpacity>
        </View>

        {/* Mascot */}
        <Image
          source={require('../assets/mascot.png')}
          style={s.mascot}
          resizeMode="contain"
        />
      </View>
    </SafeAreaView>
  )
}

const BG = '#D8F0E0'
const s = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: BG },
  inner: { flex: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16 },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  signOutBtn: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  signOutText: { fontSize: 13, color: '#E57373', fontWeight: '600' },

  // Speech bubble
  bubble: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  bubbleText: { fontSize: 14, color: '#1A1A1A', lineHeight: 20 },

  // Feature card
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  featureRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  iconWrap:     { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  featureText:  { flex: 1 },
  featureTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', marginBottom: 2 },
  featureDesc:  { fontSize: 12, color: '#888', lineHeight: 16 },
  chevron:      { fontSize: 22, color: '#CCC', fontWeight: '300' },

  startBtn:     { backgroundColor: '#F4A69E', borderRadius: 14, paddingVertical: 13, alignItems: 'center', marginTop: 8 },
  startBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Bottom bar
  bottomBar: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  bottomBarIcon:     { fontSize: 18, color: '#555' },
  bottomBarSend:     { marginLeft: 'auto', width: 32, height: 32, borderRadius: 16, backgroundColor: '#5BAD8F', alignItems: 'center', justifyContent: 'center' },
  bottomBarSendIcon: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Mascot
  mascot: { width: 100, height: 100, alignSelf: 'flex-end', marginTop: 'auto' },
})