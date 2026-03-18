import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  Dimensions,
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

// ─── Mock Data (replace with real API/Supabase data later) ───────────────────

const MOCK = {
  glucose: {
    status: 'Unstable',
    target: '4.0 – 7.8 mmol/L',
    avg: 6.2,
    avgLabel: 'mmol/L\nAvg this week',
    timeInRange: 71,
    lowEvents: 2,
    alerts: ['Hypo Wed 2pm', 'Hypo Fri 8am', 'Spike Tue 1pm'],
    // Sparkline points (0–100 scale, 14 days M–S M–S)
    trend: [55, 60, 72, 80, 95, 70, 58, 62, 65, 55, 68, 78, 85, 60],
    trendLabels: ['M','T','W','T','F','S','S','M','T','W','T','F','S','S'],
  },
  medications: {
    adherencePercent: 57,
    items: [
      { name: 'Metformin',  taken: 4, total: 7, color: '#5BAD8F' },
      { name: 'Sitagliptin', taken: 6, total: 7, color: '#E8A87C' },
    ],
    dailyLog: {
      days: ['M','T','W','T','F','S','S'],
      taken: [true, true, false, true, false, false, true],
    },
    footerNote: 'Metformin daily log',
  },
  meals: {
    impact: 'Low Impact',
    impactColor: '#C8E6C9',
    impactTextColor: '#2E7D32',
    items: [
      { label: 'Breakfast', icon: '�', delta: '+0.4' },
      { label: 'Lunch',     icon: '🍽️', delta: '+1.8' },
      { label: 'Dinner',    icon: '🥘', delta: '+0.6' },
      { label: 'Snack',     icon: '🥐', delta: '—'   },
    ],
  },
  weeklyReport: [
    { label: 'Time in range',        value: '71%', color: '#5BAD8F', dotColor: '#5BAD8F' },
    { label: 'Medication adherence', value: '57%', color: '#E57373', dotColor: '#E57373' },
    { label: 'Meal glucose impact',  value: 'Mod', color: '#E8A87C', dotColor: '#E8A87C' },
    { label: 'Days since last visit',value: '47 days', color: '#90A4AE', dotColor: '#90A4AE' },
  ],
  vsLastWeek: [
    { icon: '↑', value: '6%',  label: 'Time in\nrange',     positive: true  },
    { icon: '↓', value: '14%', label: 'Medication\ntaken',  positive: false },
    { icon: '+', value: '1',   label: 'Hypo event',         positive: false },
  ],
  doctor: 'Dr. Tan',
}

// ─── Sparkline (pure SVG-ish via Views) ──────────────────────────────────────

const Sparkline = ({ points, width, height }) => {
  const max = Math.max(...points)
  const min = Math.min(...points)
  const range = max - min || 1
  const step = width / (points.length - 1)

  // Build polyline as a series of connected View segments
  const dots = points.map((p, i) => ({
    x: i * step,
    y: height - ((p - min) / range) * (height - 16) - 4,
  }))

  return (
    <View style={{ width, height, position: 'relative' }}>
      {/* Lines between dots */}
      {dots.slice(0, -1).map((d, i) => {
        const next = dots[i + 1]
        const dx = next.x - d.x
        const dy = next.y - d.y
        const len = Math.sqrt(dx * dx + dy * dy)
        const angle = Math.atan2(dy, dx) * (180 / Math.PI)
        const isHigh = points[i] > 80 || points[i + 1] > 80
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: d.x,
              top: d.y,
              width: len,
              height: 2,
              backgroundColor: isHigh ? '#E57373' : '#5BAD8F',
              transform: [{ rotate: `${angle}deg` }],
              transformOrigin: 'left center',
            }}
          />
        )
      })}
      {/* Dots */}
      {dots.map((d, i) => {
        const isHigh = points[i] > 80
        return (
          <View
            key={`dot-${i}`}
            style={{
              position: 'absolute',
              left: d.x - 4,
              top: d.y - 4,
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: isHigh ? '#E57373' : '#5BAD8F',
              borderWidth: 1.5,
              borderColor: '#fff',
            }}
          />
        )
      })}
    </View>
  )
}

// ─── Bar component ────────────────────────────────────────────────────────────

const AdherenceBar = ({ taken, total, color }) => {
  const pct = (taken / total) * 100
  return (
    <View style={barStyles.track}>
      <View style={[barStyles.fill, { width: `${pct}%`, backgroundColor: color }]} />
    </View>
  )
}
const barStyles = StyleSheet.create({
  track: { flex: 1, height: 8, backgroundColor: '#E5E5E5', borderRadius: 4, marginHorizontal: 8 },
  fill:  { height: 8, borderRadius: 4 },
})

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SummariesScreen({ onNavigate }) {
  const [timePeriod, setTimePeriod] = useState('This week')
  const periods = ['This week', 'Last week', 'Month']

  const g = MOCK.glucose
  const m = MOCK.medications
  const meals = MOCK.meals
  const sparkWidth = SCREEN_WIDTH - 80

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* ── Title row ── */}
        <View style={s.titleRow}>
          <Text style={s.pageTitle}>Summary</Text>
          <TouchableOpacity style={s.addLogBtn}>
            <Text style={s.addLogText}>Add log</Text>
          </TouchableOpacity>
        </View>

        {/* ── Period pills ── */}
        <View style={s.periodRow}>
          {periods.map(p => (
            <TouchableOpacity
              key={p}
              style={[s.periodPill, timePeriod === p && s.periodPillActive]}
              onPress={() => setTimePeriod(p)}
            >
              <Text style={[s.periodText, timePeriod === p && s.periodTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ════════════════════════════════════════
            SECTION 1 — GLUCOSE
        ════════════════════════════════════════ */}
        <Text style={s.sectionLabel}>GLUCOSE</Text>
        <View style={s.card}>
          <View style={s.cardTitleRow}>
            <View>
              <Text style={s.cardTitle}>Blood glucose trends</Text>
              <Text style={s.cardSubtitle}>Target: {g.target}</Text>
            </View>
            <View style={[s.statusBadge, { backgroundColor: '#FDECEA' }]}>
              <Text style={[s.statusText, { color: '#E53935' }]}>{g.status}</Text>
            </View>
          </View>

          {/* Sparkline */}
          <View style={s.sparkWrap}>
            <Sparkline points={g.trend} width={sparkWidth} height={80} />
          </View>
          <View style={s.sparkLabels}>
            {g.trendLabels.map((l, i) => (
              <Text key={i} style={s.sparkLabel}>{l}</Text>
            ))}
          </View>

          {/* Stats row */}
          <View style={s.statsRow}>
            <View style={s.statBox}>
              <Text style={s.statValue}>{g.avg}</Text>
              <Text style={s.statLabel}>mmol/L{'\n'}Avg this week</Text>
            </View>
            <View style={[s.statBox, { backgroundColor: '#E8F5E9' }]}>
              <Text style={[s.statValue, { color: '#2E7D32' }]}>{g.timeInRange}%</Text>
              <Text style={s.statLabel}>Time in{'\n'}range</Text>
            </View>
            <View style={s.statBox}>
              <Text style={s.statValue}>{g.lowEvents}</Text>
              <Text style={s.statLabel}>Low events</Text>
            </View>
          </View>

          {/* Alert tags */}
          <View style={s.alertRow}>
            {g.alerts.map((a, i) => (
              <View key={i} style={s.alertTag}>
                <View style={[s.alertDot, { backgroundColor: i === 2 ? '#E8A87C' : '#E57373' }]} />
                <Text style={s.alertText}>{a}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ════════════════════════════════════════
            SECTION 2 — MEDICATIONS
        ════════════════════════════════════════ */}
        <Text style={s.sectionLabel}>MEDICATIONS</Text>
        <View style={s.card}>
          <View style={s.cardTitleRow}>
            <Text style={s.cardTitle}>Adherence this week</Text>
            <Text style={[s.statValue, { color: '#E57373', fontSize: 16 }]}>{m.adherencePercent}%</Text>
          </View>

          {m.items.map((med, i) => (
            <View key={i} style={s.medRow}>
              <Text style={s.medName}>{med.name}</Text>
              <AdherenceBar taken={med.taken} total={med.total} color={med.color} />
              <Text style={s.medCount}>{med.taken}/{med.total}</Text>
            </View>
          ))}

          <Text style={s.medFooter}>{m.footerNote}</Text>
          <View style={s.dailyLogRow}>
            {m.dailyLog.days.map((day, i) => (
              <View key={i} style={s.dayCol}>
                <Text style={s.dayLabel}>{day}</Text>
                <Text style={m.dailyLog.taken[i] ? s.checkMark : s.crossMark}>
                  {m.dailyLog.taken[i] ? '✓' : '✗'}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ════════════════════════════════════════
            SECTION 3 — MEALS
        ════════════════════════════════════════ */}
        <Text style={s.sectionLabel}>MEALS</Text>
        <View style={s.card}>
          <View style={s.cardTitleRow}>
            <Text style={s.cardTitle}>Today's meals</Text>
            <View style={[s.statusBadge, { backgroundColor: meals.impactColor }]}>
              <Text style={[s.statusText, { color: meals.impactTextColor }]}>{meals.impact}</Text>
            </View>
          </View>
          <View style={s.mealsRow}>
            {meals.items.map((meal, i) => (
              <View key={i} style={s.mealItem}>
                <View style={s.mealIconWrap}>
                  <Text style={s.mealIcon}>{meal.icon}</Text>
                </View>
                <Text style={s.mealLabel}>{meal.label}</Text>
                <Text style={[
                  s.mealDelta,
                  { color: meal.delta === '—' ? '#999' : parseFloat(meal.delta) > 1.5 ? '#E8A87C' : '#5BAD8F' }
                ]}>{meal.delta}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ════════════════════════════════════════
            SECTION 4 — WEEKLY REPORT
        ════════════════════════════════════════ */}
        <Text style={s.sectionLabel}>WEEKLY REPORT</Text>
        <View style={s.card}>
          <Text style={s.cardTitle}>Overall this week</Text>
          {MOCK.weeklyReport.map((row, i) => (
            <View key={i} style={s.reportRow}>
              <View style={[s.reportDot, { backgroundColor: row.dotColor }]} />
              <Text style={s.reportLabel}>{row.label}</Text>
              <Text style={[s.reportValue, { color: row.color }]}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* ════════════════════════════════════════
            VS LAST WEEK
        ════════════════════════════════════════ */}
        <Text style={s.sectionLabel}>VS LAST WEEK</Text>
        <View style={s.vsRow}>
          {MOCK.vsLastWeek.map((item, i) => (
            <View key={i} style={[s.vsCard, { backgroundColor: item.positive ? '#E8F5E9' : '#FDECEA' }]}>
              <Text style={[s.vsArrow, { color: item.positive ? '#2E7D32' : '#E53935' }]}>
                {item.icon} {item.value}
              </Text>
              <Text style={s.vsLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* ════════════════════════════════════════
            SHARE WITH DOCTOR
        ════════════════════════════════════════ */}
        <View style={s.shareCard}>
          <View style={s.shareLeft}>
            <Text style={s.shareTitle}>Share with {MOCK.doctor}</Text>
            <Text style={s.shareSubtitle}>Send this week's report before your appointment.</Text>
          </View>
          <TouchableOpacity style={s.sendBtn}>
            <Text style={s.sendBtnText}>Send →</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>

      {/* ── Bottom Tab Bar ── */}
      <View style={s.tabBar}>
        <TouchableOpacity style={s.tabItem} onPress={() => onNavigate?.('summaries')}>
          <MaterialCommunityIcons name="file-document" size={24} color="#5BAD8F" />
          <Text style={[s.tabLabel, s.tabLabelActive]}>Summaries</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.tabItem} onPress={() => onNavigate?.('chat')}>
          <MaterialCommunityIcons name="chat-outline" size={24} color="#555555" />
          <Text style={s.tabLabel}>Chats</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.tabItem} onPress={() => onNavigate?.('reminders')}>
          <MaterialCommunityIcons name="clock-outline" size={24} color="#555555" />
          <Text style={s.tabLabel}>Reminders</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const GREEN       = '#5BAD8F'
const LIGHT_GREEN = '#D8EFE3'
const PAGE_BG     = '#F4F4F4'
const CARD_BG     = '#FFFFFF'
const TEXT_DARK   = '#1A1A1A'
const TEXT_MID    = '#555555'
const TEXT_LIGHT  = '#999999'

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: PAGE_BG },
  scroll:  { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },

  // Title
  titleRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  pageTitle:   { fontSize: 28, fontWeight: '700', color: TEXT_DARK, letterSpacing: -0.5 },
  addLogBtn:   { backgroundColor: '#FDECEA', borderRadius: 12, paddingVertical: 6, paddingHorizontal: 14 },
  addLogText:  { fontSize: 13, color: '#E53935', fontWeight: '600' },

  // Period pills
  periodRow:        { flexDirection: 'row', gap: 8, marginBottom: 20 },
  periodPill:       { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#E5E5E5' },
  periodPillActive: { backgroundColor: GREEN },
  periodText:       { fontSize: 13, color: TEXT_MID, fontWeight: '500' },
  periodTextActive: { color: '#fff', fontWeight: '700' },

  // Section label
  sectionLabel: { fontSize: 11, fontWeight: '700', color: TEXT_LIGHT, letterSpacing: 1.2, marginBottom: 8, marginTop: 4 },

  // Card
  card:         { backgroundColor: CARD_BG, borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardTitle:    { fontSize: 15, fontWeight: '700', color: TEXT_DARK },
  cardSubtitle: { fontSize: 12, color: TEXT_LIGHT, marginTop: 2 },

  // Status badge
  statusBadge: { borderRadius: 10, paddingVertical: 3, paddingHorizontal: 10 },
  statusText:  { fontSize: 11, fontWeight: '600' },

  // Sparkline
  sparkWrap:   { marginVertical: 8, overflow: 'hidden' },
  sparkLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, marginBottom: 8 },
  sparkLabel:  { fontSize: 10, color: TEXT_LIGHT, flex: 1, textAlign: 'center' },

  // Stats row
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statBox:  { flex: 1, backgroundColor: '#F7F7F7', borderRadius: 12, padding: 10, alignItems: 'center' },
  statValue:{ fontSize: 20, fontWeight: '800', color: TEXT_DARK },
  statLabel:{ fontSize: 11, color: TEXT_MID, textAlign: 'center', marginTop: 2, lineHeight: 15 },

  // Alerts
  alertRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  alertTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  alertDot: { width: 8, height: 8, borderRadius: 4 },
  alertText:{ fontSize: 12, color: TEXT_MID },

  // Medication
  medRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  medName:  { fontSize: 13, color: TEXT_DARK, width: 90 },
  medCount: { fontSize: 13, color: TEXT_MID, width: 30, textAlign: 'right' },
  medFooter:{ fontSize: 11, color: TEXT_LIGHT, marginTop: 8, marginBottom: 4 },
  dailyLogRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  dayCol:   { alignItems: 'center', flex: 1 },
  dayLabel: { fontSize: 11, color: TEXT_LIGHT, marginBottom: 3 },
  checkMark:{ fontSize: 14, color: GREEN, fontWeight: '700' },
  crossMark:{ fontSize: 14, color: '#E57373', fontWeight: '700' },

  // Meals
  mealsRow:    { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 },
  mealItem:    { alignItems: 'center', flex: 1 },
  mealIconWrap:{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  mealIcon:    { fontSize: 22 },
  mealLabel:   { fontSize: 11, color: TEXT_MID, marginBottom: 2 },
  mealDelta:   { fontSize: 13, fontWeight: '700' },

  // Weekly report
  reportRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  reportDot:   { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  reportLabel: { flex: 1, fontSize: 13, color: TEXT_DARK },
  reportValue: { fontSize: 13, fontWeight: '700' },

  // VS last week
  vsRow:  { flexDirection: 'row', gap: 10, marginBottom: 16 },
  vsCard: { flex: 1, borderRadius: 14, padding: 12, alignItems: 'center' },
  vsArrow:{ fontSize: 15, fontWeight: '800', marginBottom: 4 },
  vsLabel:{ fontSize: 11, color: TEXT_MID, textAlign: 'center', lineHeight: 15 },

  // Share card
  shareCard:    { backgroundColor: CARD_BG, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  shareLeft:    { flex: 1, paddingRight: 12 },
  shareTitle:   { fontSize: 14, fontWeight: '700', color: TEXT_DARK, marginBottom: 3 },
  shareSubtitle:{ fontSize: 12, color: TEXT_MID, lineHeight: 17 },
  sendBtn:      { backgroundColor: GREEN, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16 },
  sendBtnText:  { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Bottom tab bar
  tabBar:         { flexDirection: 'row', backgroundColor: LIGHT_GREEN, paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 24 : 12, justifyContent: 'space-around' },
  tabItem:        { alignItems: 'center', gap: 3 },
  tabIcon:        { fontSize: 18 },
  tabLabel:       { fontSize: 12, color: TEXT_MID, fontWeight: '500' },
  tabLabelActive: { color: GREEN, fontWeight: '700' },
})