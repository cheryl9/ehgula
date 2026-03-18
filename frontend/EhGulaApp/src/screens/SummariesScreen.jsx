// ─────────────────────────────────────────────────────────────────────────────
// src/screens/SummariesScreen.jsx
// All data comes from Supabase via usePatientData hook.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, Platform, Dimensions, ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { usePatientData } from '../hooks/usePatientData'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

// ─────────────────────────────────────────────────────────────────────────────
// Data derivation helpers — turn raw Supabase rows into display values
// ─────────────────────────────────────────────────────────────────────────────

function deriveGlucose(glucose = [], glucoseLastWeek = []) {
  if (!glucose.length) return null

  const values      = glucose.map((r) => r.value_mmol)
  const avg         = +(values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)
  const TARGET_MIN  = 4.0
  const TARGET_MAX  = 7.8
  const inRange     = glucose.filter((r) => r.value_mmol >= TARGET_MIN && r.value_mmol <= TARGET_MAX)
  const timeInRange = Math.round((inRange.length / glucose.length) * 100)
  const lowEvents   = glucose.filter((r) => r.value_mmol < TARGET_MIN).length
  const highEvents  = glucose.filter((r) => r.value_mmol > TARGET_MAX)

  const status = timeInRange >= 70 ? 'Stable' : timeInRange >= 50 ? 'Moderate' : 'Unstable'

  // Sparkline: normalise to 0–100 for rendering
  const sparklinePoints = glucose.map((r) => {
    return Math.round(((r.value_mmol - 3) / (12 - 3)) * 100)
  })

  // Trend labels — use day-of-week from timestamp
  const days = ['S','M','T','W','T','F','S']
  const sparklineLabels = glucose.map((r) => days[new Date(r.timestamp).getDay()])

  // Alerts — readings outside range
  const alerts = highEvents.slice(0, 2).map((r) => {
    const d = new Date(r.timestamp)
    return `Spike ${days[d.getDay()]} ${d.getHours()}:00`
  })
  glucose.filter((r) => r.value_mmol < TARGET_MIN).slice(0, 2).forEach((r) => {
    const d = new Date(r.timestamp)
    alerts.push(`Hypo ${days[d.getDay()]} ${d.getHours()}:00`)
  })

  // vs last week
  const lwValues = glucoseLastWeek.map((r) => r.value_mmol)
  const lwAvg    = lwValues.length ? +(lwValues.reduce((a,b) => a+b,0) / lwValues.length).toFixed(1) : avg
  const lwInRange = glucoseLastWeek.length
    ? Math.round((glucoseLastWeek.filter((r) => r.value_mmol >= TARGET_MIN && r.value_mmol <= TARGET_MAX).length / glucoseLastWeek.length) * 100)
    : timeInRange
  const tirDelta = timeInRange - lwInRange

  return { avg, timeInRange, lowEvents, status, sparklinePoints, sparklineLabels, alerts, tirDelta }
}

function deriveMedications(medications = [], doseLogsWeek = [], doseLogsLastWeek = []) {
  if (!doseLogsWeek.length) return null

  const taken  = doseLogsWeek.filter((d) => d.status === 'taken').length
  const total  = doseLogsWeek.length
  const adherencePct = total > 0 ? Math.round((taken / total) * 100) : 0

  const lwTaken  = doseLogsLastWeek.filter((d) => d.status === 'taken').length
  const lwTotal  = doseLogsLastWeek.length
  const lwPct    = lwTotal > 0 ? Math.round((lwTaken / lwTotal) * 100) : adherencePct
  const adherenceDelta = adherencePct - lwPct

  // Per-medication breakdown
  const items = medications.map((med) => {
    const medLogs  = doseLogsWeek.filter((d) => d.medication_name === med.name || d.medication_id === med.id)
    const medTaken = medLogs.filter((d) => d.status === 'taken').length
    return { name: med.name, taken: medTaken, total: medLogs.length || 7, color: '#5BAD8F' }
  })

  // Daily log for first med (7-day M–S)
  const days     = ['M','T','W','T','F','S','S']
  const dayFlags = days.map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dateStr = d.toISOString().split('T')[0]
    return doseLogsWeek.some((l) => l.date === dateStr && l.status === 'taken')
  })

  return { adherencePct, adherenceDelta, items, dailyLog: { days, taken: dayFlags } }
}

function deriveMeals(mealLogs = []) {
  const today = new Date().toISOString().split('T')[0]
  const todayLog = mealLogs.find((m) => m.date === today)

  const items = [
    { label: 'Breakfast', icon: '🍳', delta: todayLog?.breakfast_glucose_delta != null ? `+${todayLog.breakfast_glucose_delta}` : '—' },
    { label: 'Lunch',     icon: '🍽️', delta: todayLog?.lunch_glucose_delta     != null ? `+${todayLog.lunch_glucose_delta}`     : todayLog?.lunch_skipped ? 'Skipped' : '—' },
    { label: 'Dinner',    icon: '🥘', delta: todayLog?.dinner_glucose_delta    != null ? `+${todayLog.dinner_glucose_delta}`    : '—' },
    { label: 'Snack',     icon: '🥐', delta: todayLog?.snack_glucose_delta     != null ? `+${todayLog.snack_glucose_delta}`     : '—' },
  ]

  const allDeltas = [
    todayLog?.breakfast_glucose_delta,
    todayLog?.lunch_glucose_delta,
    todayLog?.dinner_glucose_delta,
  ].filter((d) => d != null)

  const maxDelta = allDeltas.length ? Math.max(...allDeltas) : 0
  const impact      = maxDelta > 2 ? 'High Impact' : maxDelta > 1 ? 'Moderate Impact' : 'Low Impact'
  const impactColor = maxDelta > 2 ? '#FDECEA'    : maxDelta > 1 ? '#FFF3E0'          : '#C8E6C9'
  const impactTextColor = maxDelta > 2 ? '#E53935' : maxDelta > 1 ? '#E65100'         : '#2E7D32'

  return { items, impact, impactColor, impactTextColor }
}

function deriveVsLastWeek(tirDelta = 0, adherenceDelta = 0, glucose = [], glucoseLastWeek = []) {
  const hypoThis = glucose.filter((r) => r.value_mmol < 4.0).length
  const hypoLast = glucoseLastWeek.filter((r) => r.value_mmol < 4.0).length
  const hypoDelta = hypoThis - hypoLast

  return [
    {
      icon:     tirDelta >= 0 ? '↑' : '↓',
      value:    `${Math.abs(tirDelta)}%`,
      label:    'Time in\nrange',
      positive: tirDelta >= 0,
    },
    {
      icon:     adherenceDelta >= 0 ? '↑' : '↓',
      value:    `${Math.abs(adherenceDelta)}%`,
      label:    'Medication\ntaken',
      positive: adherenceDelta >= 0,
    },
    {
      icon:     hypoDelta <= 0 ? '↓' : '+',
      value:    `${Math.abs(hypoDelta)}`,
      label:    'Hypo events',
      positive: hypoDelta <= 0,
    },
  ]
}

// ─────────────────────────────────────────────────────────────────────────────
// Sparkline (pure View-based, same as original)
// ─────────────────────────────────────────────────────────────────────────────

const Sparkline = ({ points, width, height }) => {
  if (!points.length) return null
  const max   = Math.max(...points)
  const min   = Math.min(...points)
  const range = max - min || 1
  const step  = width / Math.max(points.length - 1, 1)

  const dots = points.map((p, i) => ({
    x: i * step,
    y: height - ((p - min) / range) * (height - 16) - 4,
  }))

  return (
    <View style={{ width, height, position: 'relative' }}>
      {dots.slice(0, -1).map((d, i) => {
        const next  = dots[i + 1]
        const dx    = next.x - d.x
        const dy    = next.y - d.y
        const len   = Math.sqrt(dx * dx + dy * dy)
        const angle = Math.atan2(dy, dx) * (180 / Math.PI)
        const isHigh = points[i] > 75 || points[i + 1] > 75
        return (
          <View
            key={i}
            style={{
              position: 'absolute', left: d.x, top: d.y,
              width: len, height: 2,
              backgroundColor: isHigh ? '#E57373' : '#5BAD8F',
              transform: [{ rotate: `${angle}deg` }],
              transformOrigin: 'left center',
            }}
          />
        )
      })}
      {dots.map((d, i) => (
        <View
          key={`dot-${i}`}
          style={{
            position: 'absolute', left: d.x - 4, top: d.y - 4,
            width: 8, height: 8, borderRadius: 4,
            backgroundColor: points[i] > 75 ? '#E57373' : '#5BAD8F',
            borderWidth: 1.5, borderColor: '#fff',
          }}
        />
      ))}
    </View>
  )
}

const AdherenceBar = ({ taken, total, color }) => {
  const pct = total > 0 ? (taken / total) * 100 : 0
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

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────

export default function SummariesScreen({ onNavigate }) {
  const { data, loading, error, refetch } = usePatientData()
  const [timePeriod, setTimePeriod] = useState('This week')
  const periods = ['This week', 'Last week', 'Month']

  // Derive all display data from raw Supabase rows
  const glucose  = useMemo(() => deriveGlucose(data?.glucose, data?.glucoseLastWeek),   [data])
  const meds     = useMemo(() => deriveMedications(data?.medications, data?.doseLogsWeek, data?.doseLogsLastWeek), [data])
  const meals    = useMemo(() => deriveMeals(data?.mealLogs), [data])
  const vsLast   = useMemo(() => deriveVsLastWeek(glucose?.tirDelta ?? 0, meds?.adherenceDelta ?? 0, data?.glucose ?? [], data?.glucoseLastWeek ?? []), [glucose, meds, data])

  const doctorName = data?.appointments?.find((a) => a.status === 'confirmed')?.clinician_name ?? 'your doctor'
  const daysSinceVisit = (() => {
    const completed = (data?.appointments ?? []).filter((a) => a.status === 'completed')
    if (!completed.length) return '—'
    const last = new Date(completed[completed.length - 1].date)
    return `${Math.floor((Date.now() - last.getTime()) / 86400000)} days`
  })()

  const weeklyReport = [
    { label: 'Time in range',         value: glucose ? `${glucose.timeInRange}%` : '—', color: '#5BAD8F', dotColor: '#5BAD8F' },
    { label: 'Medication adherence',  value: meds    ? `${meds.adherencePct}%`   : '—', color: '#E57373', dotColor: '#E57373' },
    { label: 'Meals logged',          value: data    ? `${data.mealLogs.length}`  : '—', color: '#E8A87C', dotColor: '#E8A87C' },
    { label: 'Days since last visit', value: daysSinceVisit,                             color: '#90A4AE', dotColor: '#90A4AE' },
  ]

  const sparkWidth = SCREEN_WIDTH - 80

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={[s.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#5BAD8F" />
        <Text style={{ marginTop: 12, color: '#888', fontSize: 14 }}>Loading your summary…</Text>
      </SafeAreaView>
    )
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <SafeAreaView style={[s.safe, { justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
        <MaterialCommunityIcons name="wifi-off" size={48} color="#ccc" />
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#555', marginTop: 12 }}>Could not load summary</Text>
        <Text style={{ fontSize: 13, color: '#999', textAlign: 'center', marginTop: 6 }}>{error}</Text>
        <TouchableOpacity style={s.retryBtn} onPress={refetch}>
          <Text style={s.retryBtnText}>Try again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor="#5BAD8F" />}
      >
        {/* Title row */}
        <View style={s.titleRow}>
          <Text style={s.pageTitle}>Summary</Text>
          <TouchableOpacity style={s.addLogBtn} onPress={() => onNavigate('reminders')}>
            <Text style={s.addLogText}>Add log</Text>
          </TouchableOpacity>
        </View>

        {/* Period pills */}
        <View style={s.periodRow}>
          {periods.map((p) => (
            <TouchableOpacity
              key={p}
              style={[s.periodPill, timePeriod === p && s.periodPillActive]}
              onPress={() => setTimePeriod(p)}
            >
              <Text style={[s.periodText, timePeriod === p && s.periodTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── GLUCOSE ── */}
        <Text style={s.sectionLabel}>GLUCOSE</Text>
        {glucose ? (
          <View style={s.card}>
            <View style={s.cardTitleRow}>
              <View>
                <Text style={s.cardTitle}>Blood glucose trends</Text>
                <Text style={s.cardSubtitle}>Target: 4.0 – 7.8 mmol/L</Text>
              </View>
              <View style={[s.statusBadge, { backgroundColor: glucose.status === 'Stable' ? '#C8E6C9' : '#FDECEA' }]}>
                <Text style={[s.statusText, { color: glucose.status === 'Stable' ? '#2E7D32' : '#E53935' }]}>
                  {glucose.status}
                </Text>
              </View>
            </View>

            <View style={s.sparkWrap}>
              <Sparkline points={glucose.sparklinePoints} width={sparkWidth} height={80} />
            </View>
            <View style={s.sparkLabels}>
              {glucose.sparklineLabels.slice(0, 14).map((l, i) => (
                <Text key={i} style={s.sparkLabel}>{l}</Text>
              ))}
            </View>

            <View style={s.statsRow}>
              <View style={s.statBox}>
                <Text style={s.statValue}>{glucose.avg}</Text>
                <Text style={s.statLabel}>mmol/L{'\n'}Avg this week</Text>
              </View>
              <View style={[s.statBox, { backgroundColor: '#E8F5E9' }]}>
                <Text style={[s.statValue, { color: '#2E7D32' }]}>{glucose.timeInRange}%</Text>
                <Text style={s.statLabel}>Time in{'\n'}range</Text>
              </View>
              <View style={s.statBox}>
                <Text style={s.statValue}>{glucose.lowEvents}</Text>
                <Text style={s.statLabel}>Low events</Text>
              </View>
            </View>

            {glucose.alerts.length > 0 && (
              <View style={s.alertRow}>
                {glucose.alerts.map((a, i) => (
                  <View key={i} style={s.alertTag}>
                    <View style={[s.alertDot, { backgroundColor: a.startsWith('Hypo') ? '#E57373' : '#E8A87C' }]} />
                    <Text style={s.alertText}>{a}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={s.emptyCard}>
            <Text style={s.emptyCardText}>No glucose readings this week.</Text>
          </View>
        )}

        {/* ── MEDICATIONS ── */}
        <Text style={s.sectionLabel}>MEDICATIONS</Text>
        {meds ? (
          <View style={s.card}>
            <View style={s.cardTitleRow}>
              <Text style={s.cardTitle}>Adherence this week</Text>
              <Text style={[s.statValue, { color: meds.adherencePct >= 80 ? '#5BAD8F' : '#E57373', fontSize: 16 }]}>
                {meds.adherencePct}%
              </Text>
            </View>

            {meds.items.map((med, i) => (
              <View key={i} style={s.medRow}>
                <Text style={s.medName}>{med.name}</Text>
                <AdherenceBar taken={med.taken} total={med.total} color={med.color} />
                <Text style={s.medCount}>{med.taken}/{med.total}</Text>
              </View>
            ))}

            {meds.items[0] && (
              <>
                <Text style={s.medFooter}>{meds.items[0].name} daily log</Text>
                <View style={s.dailyLogRow}>
                  {meds.dailyLog.days.map((day, i) => (
                    <View key={i} style={s.dayCol}>
                      <Text style={s.dayLabel}>{day}</Text>
                      <Text style={meds.dailyLog.taken[i] ? s.checkMark : s.crossMark}>
                        {meds.dailyLog.taken[i] ? '✓' : '✗'}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        ) : (
          <View style={s.emptyCard}>
            <Text style={s.emptyCardText}>No medication data this week.</Text>
          </View>
        )}

        {/* ── MEALS ── */}
        <Text style={s.sectionLabel}>MEALS</Text>
        {meals ? (
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
                    { color: meal.delta === '—' || meal.delta === 'Skipped' ? '#999'
                            : parseFloat(meal.delta) > 1.5 ? '#E8A87C' : '#5BAD8F' }
                  ]}>
                    {meal.delta}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={s.emptyCard}>
            <Text style={s.emptyCardText}>No meal data logged today.</Text>
          </View>
        )}

        {/* ── WEEKLY REPORT ── */}
        <Text style={s.sectionLabel}>WEEKLY REPORT</Text>
        <View style={s.card}>
          <Text style={s.cardTitle}>Overall this week</Text>
          {weeklyReport.map((row, i) => (
            <View key={i} style={s.reportRow}>
              <View style={[s.reportDot, { backgroundColor: row.dotColor }]} />
              <Text style={s.reportLabel}>{row.label}</Text>
              <Text style={[s.reportValue, { color: row.color }]}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* ── VS LAST WEEK ── */}
        <Text style={s.sectionLabel}>VS LAST WEEK</Text>
        <View style={s.vsRow}>
          {vsLast.map((item, i) => (
            <View key={i} style={[s.vsCard, { backgroundColor: item.positive ? '#E8F5E9' : '#FDECEA' }]}>
              <Text style={[s.vsArrow, { color: item.positive ? '#2E7D32' : '#E53935' }]}>
                {item.icon} {item.value}
              </Text>
              <Text style={s.vsLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* ── SHARE WITH DOCTOR ── */}
        <View style={s.shareCard}>
          <View style={s.shareLeft}>
            <Text style={s.shareTitle}>Share with {doctorName}</Text>
            <Text style={s.shareSubtitle}>Send this week's report before your appointment.</Text>
          </View>
          <TouchableOpacity style={s.sendBtn}>
            <Text style={s.sendBtnText}>Send →</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>

      {/* Bottom tab bar */}
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

// ─────────────────────────────────────────────────────────────────────────────
// Styles — identical structure to original
// ─────────────────────────────────────────────────────────────────────────────

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

  titleRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  pageTitle:  { fontSize: 28, fontWeight: '700', color: TEXT_DARK, letterSpacing: -0.5 },
  addLogBtn:  { backgroundColor: '#FDECEA', borderRadius: 12, paddingVertical: 6, paddingHorizontal: 14 },
  addLogText: { fontSize: 13, color: '#E53935', fontWeight: '600' },

  periodRow:        { flexDirection: 'row', gap: 8, marginBottom: 20 },
  periodPill:       { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#E5E5E5' },
  periodPillActive: { backgroundColor: GREEN },
  periodText:       { fontSize: 13, color: TEXT_MID, fontWeight: '500' },
  periodTextActive: { color: '#fff', fontWeight: '700' },

  sectionLabel: { fontSize: 11, fontWeight: '700', color: TEXT_LIGHT, letterSpacing: 1.2, marginBottom: 8, marginTop: 4 },

  card:         { backgroundColor: CARD_BG, borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardTitle:    { fontSize: 15, fontWeight: '700', color: TEXT_DARK },
  cardSubtitle: { fontSize: 12, color: TEXT_LIGHT, marginTop: 2 },

  emptyCard:     { backgroundColor: CARD_BG, borderRadius: 16, padding: 24, marginBottom: 16, alignItems: 'center' },
  emptyCardText: { fontSize: 14, color: TEXT_LIGHT },

  statusBadge: { borderRadius: 10, paddingVertical: 3, paddingHorizontal: 10 },
  statusText:  { fontSize: 11, fontWeight: '600' },

  sparkWrap:   { marginVertical: 8, overflow: 'hidden' },
  sparkLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, marginBottom: 8 },
  sparkLabel:  { fontSize: 10, color: TEXT_LIGHT, flex: 1, textAlign: 'center' },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statBox:  { flex: 1, backgroundColor: '#F7F7F7', borderRadius: 12, padding: 10, alignItems: 'center' },
  statValue:{ fontSize: 20, fontWeight: '800', color: TEXT_DARK },
  statLabel:{ fontSize: 11, color: TEXT_MID, textAlign: 'center', marginTop: 2, lineHeight: 15 },

  alertRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  alertTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  alertDot: { width: 8, height: 8, borderRadius: 4 },
  alertText:{ fontSize: 12, color: TEXT_MID },

  medRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  medName:     { fontSize: 13, color: TEXT_DARK, width: 90 },
  medCount:    { fontSize: 13, color: TEXT_MID, width: 30, textAlign: 'right' },
  medFooter:   { fontSize: 11, color: TEXT_LIGHT, marginTop: 8, marginBottom: 4 },
  dailyLogRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  dayCol:      { alignItems: 'center', flex: 1 },
  dayLabel:    { fontSize: 11, color: TEXT_LIGHT, marginBottom: 3 },
  checkMark:   { fontSize: 14, color: GREEN, fontWeight: '700' },
  crossMark:   { fontSize: 14, color: '#E57373', fontWeight: '700' },

  mealsRow:    { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 },
  mealItem:    { alignItems: 'center', flex: 1 },
  mealIconWrap:{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  mealIcon:    { fontSize: 22 },
  mealLabel:   { fontSize: 11, color: TEXT_MID, marginBottom: 2 },
  mealDelta:   { fontSize: 13, fontWeight: '700' },

  reportRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  reportDot:   { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  reportLabel: { flex: 1, fontSize: 13, color: TEXT_DARK },
  reportValue: { fontSize: 13, fontWeight: '700' },

  vsRow:  { flexDirection: 'row', gap: 10, marginBottom: 16 },
  vsCard: { flex: 1, borderRadius: 14, padding: 12, alignItems: 'center' },
  vsArrow:{ fontSize: 15, fontWeight: '800', marginBottom: 4 },
  vsLabel:{ fontSize: 11, color: TEXT_MID, textAlign: 'center', lineHeight: 15 },

  shareCard:    { backgroundColor: CARD_BG, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  shareLeft:    { flex: 1, paddingRight: 12 },
  shareTitle:   { fontSize: 14, fontWeight: '700', color: TEXT_DARK, marginBottom: 3 },
  shareSubtitle:{ fontSize: 12, color: TEXT_MID, lineHeight: 17 },
  sendBtn:      { backgroundColor: GREEN, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16 },
  sendBtnText:  { color: '#fff', fontWeight: '700', fontSize: 13 },

  tabBar:         { flexDirection: 'row', backgroundColor: LIGHT_GREEN, paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 24 : 12, justifyContent: 'space-around' },
  tabItem:        { alignItems: 'center', gap: 3 },
  tabLabel:       { fontSize: 12, color: TEXT_MID, fontWeight: '500' },
  tabLabelActive: { color: GREEN, fontWeight: '700' },

  retryBtn:     { marginTop: 20, backgroundColor: GREEN, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 32 },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
})