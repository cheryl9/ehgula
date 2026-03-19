/**
 * Data Provider Layer - Feature Flag Abstraction
 */

const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA !== 'false'

import apiClient from './client'

// Mock imports
import {
  getAllBriefs as mockGetAllBriefs,
  getBriefById as mockGetBriefById,
  getBriefsByPatientId as mockGetBriefsByPatientId,
  getLatestBriefByPatientId as mockGetLatestBriefByPatientId,
  MOCK_BRIEFS
} from './mock/mockBriefs'

import {
  MOCK_PATIENT_APPOINTMENTS,
  MOCK_ALL_APPOINTMENTS
} from './mock/mockAppointments'

import {
  MOCK_STEPS,
  MOCK_SITTING,
  MOCK_HEART_RATE,
  HR_ZONES
} from './mock/mockExercise'

import {
  MOCK_MEAL_DATA,
  calculateMealAdherence as mockCalculateMealAdherence,
  MEAL_PATTERNS
} from './mock/mockMeals'

import {
  getWeeklyDigestsByPatientId as mockGetWeeklyDigestsByPatientId,
  getAllWeeklyDigests as mockGetAllWeeklyDigests,
  getStatusColor,
  MOCK_WEEKLY_DIGESTS
} from './mock/mockWeeklyDigests'

import {
  getAtRiskPatients as mockGetAtRiskPatients,
  getCohortOverview as mockGetCohortOverview,
  getTrends as mockGetTrends,
  MOCK_POPULATION_STATS
} from './mock/mockPopulationStats'

/**
 * Helpers
 */

const normalizeAppointmentsPayload = (payload) => {
  const rows = Array.isArray(payload) ? payload : (Array.isArray(payload?.appointments) ? payload.appointments : [])
  return rows.map((row) => ({
    id: row.id,
    patientId: row.patientId || row.patient_id,
    patientName: row.patientName || row.patient_name || row.patients?.name || null,
    date: row.date,
    time: row.time,
    clinic: row.clinic,
    clinicianName: row.clinicianName || row.clinician_name,
    type: row.type,
    autoBooked: row.autoBooked ?? row.auto_booked,
    bookingReason: row.bookingReason || row.booking_reason,
    urgencyScore: row.urgencyScore ?? row.urgency_score,
    status: row.status,
  }))
}

const mapWeeklyDigestRow = (row) => ({
  id: row.id,
  patientId: row.patient_id,
  patientName: row.patients?.name || row.patient_name || null,
  patientCondition: row.patients?.condition || null,
  weekStart: row.week_start,
  weekEnd: row.week_end,
  avgFastingGlucose: row.avg_fasting_glucose,
  avgPostMealGlucose: row.avg_post_meal_glucose,
  medicationAdherencePct: row.medication_adherence_pct,
  mealsSkipped: row.meals_skipped,
  skipPattern: row.skip_pattern,
  avgSteps: row.avg_steps,
  stepGoalMetDays: row.step_goal_met_days,
  sittingEpisodesFlagged: row.sitting_episodes_flagged,
  agentActionsTaken: row.agent_actions_taken,
  agentActionsSilent: row.agent_actions_silent,
  worstDay: row.worst_day,
  highlights: row.highlights,
  createdAt: row.created_at,
})

const mapMealRow = (row) => ({
  id: row.id,
  patientId: row.patient_id,
  date: row.date,
  mealType: row.meal_type,
  time: row.time,
  logged: row.logged,
  skipped: row.skipped,
  skipReason: row.skip_reason,
  description: row.description,
})

/**
 * ====================================
 * DOCTOR BRIEFS
 * ====================================
 * Keep mock for now unless/until you have a real doctor_briefs table or backend endpoint
 */

export const getAllBriefs = async () => {
  if (USE_MOCK_DATA) {
    return mockGetAllBriefs()
  }

  // Keep mock fallback for now
  return mockGetAllBriefs()
}

export const getBriefById = async (briefId) => {
  if (USE_MOCK_DATA) {
    return mockGetBriefById(briefId)
  }

  return mockGetBriefById(briefId)
}

export const getBriefsByPatientId = async (patientId) => {
  if (USE_MOCK_DATA) {
    return mockGetBriefsByPatientId(patientId)
  }

  return mockGetBriefsByPatientId(patientId)
}

export const getLatestBriefByPatientId = async (patientId) => {
  if (USE_MOCK_DATA) {
    return mockGetLatestBriefByPatientId(patientId)
  }

  return mockGetLatestBriefByPatientId(patientId)
}

/**
 * ====================================
 * APPOINTMENTS
 * ====================================
 */

export const getPatientAppointments = async (patientId) => {
  if (USE_MOCK_DATA) {
    return MOCK_PATIENT_APPOINTMENTS
  }

  const response = await apiClient.get(`/clinician/patients/${patientId}/appointments`)
  return normalizeAppointmentsPayload(response.data)
}

export const getAllAppointments = async () => {
  if (USE_MOCK_DATA) {
    return MOCK_ALL_APPOINTMENTS
  }

  const response = await apiClient.get('/clinician/appointments')
  return normalizeAppointmentsPayload(response.data)
}

/**
 * ====================================
 * EXERCISE & ACTIVITY
 * ====================================
 */

export const getStepsData = async (patientId) => {
  if (USE_MOCK_DATA) {
    return MOCK_STEPS
  }

  const response = await apiClient.get(`/clinician/patients/${patientId}/exercise`, { params: { days: 30 } })
  const payload = response.data

  const rows = Array.isArray(payload)
    ? payload
    : (Array.isArray(payload?.steps) ? payload.steps : [])

  return rows.map((row) => ({
    date: row.date,
    steps: row.steps,
    target: row.target ?? row.goal ?? row.step_goal,
  }))
}

export const getSittingData = async (patientId) => {
  if (USE_MOCK_DATA) {
    return MOCK_SITTING
  }

  const response = await apiClient.get(`/clinician/patients/${patientId}/exercise`, { params: { days: 30 } })
  const payload = response.data

  if (Array.isArray(payload?.sitting)) {
    return payload.sitting.map((ep) => ({
      date: ep.date,
      start: ep.start ?? ep.startTime,
      end: ep.end ?? ep.endTime,
      durationMins: ep.durationMins ?? ep.duration,
      flagged: ep.flagged ?? ep.exceedsLimit,
    }))
  }

  const rows = Array.isArray(payload) ? payload : []
  return rows.flatMap((row) =>
    (row.sitting_episodes || []).map((ep) => ({
      date: row.date,
      start: ep.start,
      end: ep.end,
      durationMins: ep.duration_mins,
      flagged: ep.flagged,
    }))
  )
}

export const getHeartRateData = async (patientId) => {
  if (USE_MOCK_DATA) {
    return MOCK_HEART_RATE
  }

  const response = await apiClient.get(`/clinician/patients/${patientId}/exercise`, { params: { days: 30 } })
  const payload = response.data

  if (Array.isArray(payload?.heartRate) || Array.isArray(payload?.heart_rate)) {
    const readings = Array.isArray(payload?.heartRate) ? payload.heartRate : payload.heart_rate
    return readings.map((hr) => ({
      date: hr.date,
      time: hr.time,
      bpm: hr.bpm ?? hr.hr,
      zone: hr.zone,
    }))
  }

  const rows = Array.isArray(payload) ? payload : []
  return rows.flatMap((row) =>
    (row.heart_rate || []).map((hr) => ({
      date: row.date,
      time: hr.time,
      bpm: hr.bpm,
      zone: hr.zone,
    }))
  )
}

export const getHRZones = async () => {
  return HR_ZONES
}

/**
 * ====================================
 * MEALS & NUTRITION
 * ====================================
 */

export const getMealData = async (patientId) => {
  if (USE_MOCK_DATA) {
    return MOCK_MEAL_DATA
  }

  const response = await apiClient.get(`/clinician/patients/${patientId}/meals`, { params: { days: 30 } })
  const payload = response.data

  const rows = Array.isArray(payload)
    ? payload
    : (Array.isArray(payload?.rows) ? payload.rows : [])

  return rows.map(mapMealRow)
}

export const calculateMealAdherence = async (patientId) => {
  if (USE_MOCK_DATA) {
    return mockCalculateMealAdherence()
  }

  const rows = await getMealData(patientId)

  const total = rows.length
  const logged = rows.filter(r => r.logged).length
  const skipped = rows.filter(r => r.skipped).length

  return {
    totalMeals: total,
    loggedMeals: logged,
    skippedMeals: skipped,
    adherencePct: total > 0 ? Math.round((logged / total) * 100) : 0,
  }
}

export const getMealPatterns = async (patientId) => {
  if (USE_MOCK_DATA) {
    return MEAL_PATTERNS
  }

  const rows = await getMealData(patientId)

  const grouped = {
    breakfast: rows.filter(r => r.mealType === 'breakfast'),
    lunch: rows.filter(r => r.mealType === 'lunch'),
    dinner: rows.filter(r => r.mealType === 'dinner'),
  }

  return grouped
}

/**
 * ====================================
 * WEEKLY DIGESTS
 * ====================================
 */

export const getWeeklyDigestsByPatientId = async (patientId) => {
  if (USE_MOCK_DATA) {
    return mockGetWeeklyDigestsByPatientId(patientId)
  }

  const response = await apiClient.get(`/clinician/patients/${patientId}/weekly-digests`)
  const payload = response.data

  const rows = Array.isArray(payload)
    ? payload
    : (Array.isArray(payload?.digests) ? payload.digests : [])

  return rows.map(mapWeeklyDigestRow)
}

export const getAllWeeklyDigests = async () => {
  if (USE_MOCK_DATA) {
    return mockGetAllWeeklyDigests()
  }

  const response = await apiClient.get('/clinician/weekly-digests')
  const payload = response.data

  const rows = Array.isArray(payload)
    ? payload
    : (Array.isArray(payload?.digests) ? payload.digests : [])

  return rows.map(mapWeeklyDigestRow)
}

export const getWeeklyDigestStatusColor = (status) => {
  return getStatusColor(status)
}

/**
 * ====================================
 * POPULATION ANALYTICS
 * ====================================
 */

export const getAtRiskPatients = async () => {
  if (USE_MOCK_DATA) {
    return mockGetAtRiskPatients()
  }

  const response = await apiClient.get('/clinician/analytics/at-risk')
  return response.data
}

export const getCohortOverview = async () => {
  if (USE_MOCK_DATA) {
    return mockGetCohortOverview()
  }

  const response = await apiClient.get('/clinician/analytics/cohort-overview')
  return response.data
}

export const getTrends = async () => {
  if (USE_MOCK_DATA) {
    return mockGetTrends()
  }

  const response = await apiClient.get('/clinician/analytics/trends')
  const payload = response.data

  const rows = Array.isArray(payload)
    ? payload
    : (Array.isArray(payload?.trends) ? payload.trends : [])

  return rows.map(mapWeeklyDigestRow)
}

/**
 * ====================================
 * MOCK DATA EXPORTS
 * ====================================
 */

export {
  MOCK_BRIEFS,
  MOCK_PATIENT_APPOINTMENTS,
  MOCK_ALL_APPOINTMENTS,
  MOCK_STEPS,
  MOCK_SITTING,
  MOCK_HEART_RATE,
  HR_ZONES,
  MOCK_MEAL_DATA,
  MEAL_PATTERNS,
  MOCK_WEEKLY_DIGESTS,
  MOCK_POPULATION_STATS
}

export { USE_MOCK_DATA }