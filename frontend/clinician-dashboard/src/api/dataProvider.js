/**
 * Data Provider Layer - Feature Flag Abstraction
 */

const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA !== 'false'

import { supabase } from '../lib/supabase.js'

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

const handleError = (error, context) => {
  if (error) {
    console.error(`[${context}]`, error)
    throw error
  }
}

const getAssignedPatientIdsForCurrentClinician = async () => {
  const { data: authData, error: authError } = await supabase.auth.getUser()
  handleError(authError, 'getAssignedPatientIdsForCurrentClinician.auth')

  const userId = authData?.user?.id
  if (!userId) {
    return []
  }

  const { data: clinicianRow, error: clinicianError } = await supabase
    .from('clinicians')
    .select('id')
    .eq('user_id', userId)
    .single()

  handleError(clinicianError, 'getAssignedPatientIdsForCurrentClinician.clinician')

  const { data: assignments, error: assignmentError } = await supabase
    .from('clinician_patient_assignments')
    .select('patient_id')
    .eq('clinician_id', clinicianRow.id)

  handleError(assignmentError, 'getAssignedPatientIdsForCurrentClinician.assignments')
  return (assignments || []).map(a => a.patient_id)
}

const mapAppointmentRow = (row) => ({
  id: row.id,
  patientId: row.patient_id,
  date: row.date,
  time: row.time,
  clinic: row.clinic,
  clinicianName: row.clinician_name,
  type: row.type,
  autoBooked: row.auto_booked,
  bookingReason: row.booking_reason,
  urgencyScore: row.urgency_score,
  status: row.status,
})

const mapWeeklyDigestRow = (row) => ({
  id: row.id,
  patientId: row.patient_id,
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

const mapExerciseRow = (row) => ({
  id: row.id,
  patientId: row.patient_id,
  date: row.date,
  steps: row.steps,
  stepGoal: row.step_goal,
  activeMinutes: row.active_minutes,
  sittingEpisodes: row.sitting_episodes,
  walkingSessions: row.walking_sessions,
  heartRate: row.heart_rate,
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

  const assignedPatientIds = await getAssignedPatientIdsForCurrentClinician()
  if (!assignedPatientIds.includes(patientId)) {
    return []
  }

  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('patient_id', patientId)
    .order('date', { ascending: true })

  handleError(error, 'getPatientAppointments')
  return data.map(mapAppointmentRow)
}

export const getAllAppointments = async () => {
  if (USE_MOCK_DATA) {
    return MOCK_ALL_APPOINTMENTS
  }

  const assignedPatientIds = await getAssignedPatientIdsForCurrentClinician()
  if (!assignedPatientIds.length) {
    return []
  }

  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .in('patient_id', assignedPatientIds)
    .order('date', { ascending: true })

  handleError(error, 'getAllAppointments')
  return data.map(mapAppointmentRow)
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

  const { data, error } = await supabase
    .from('exercise_logs')
    .select('*')
    .eq('patient_id', patientId)
    .order('date', { ascending: true })

  handleError(error, 'getStepsData')

  return data.map(row => ({
    date: row.date,
    steps: row.steps,
    target: row.step_goal,
  }))
}

export const getSittingData = async (patientId) => {
  if (USE_MOCK_DATA) {
    return MOCK_SITTING
  }

  const { data, error } = await supabase
    .from('exercise_logs')
    .select('*')
    .eq('patient_id', patientId)
    .order('date', { ascending: true })

  handleError(error, 'getSittingData')

  return data.flatMap(row =>
    (row.sitting_episodes || []).map(ep => ({
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

  const { data, error } = await supabase
    .from('exercise_logs')
    .select('*')
    .eq('patient_id', patientId)
    .order('date', { ascending: true })

  handleError(error, 'getHeartRateData')

  return data.flatMap(row =>
    (row.heart_rate || []).map(hr => ({
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

  const { data, error } = await supabase
    .from('meal_logs')
    .select('*')
    .eq('patient_id', patientId)
    .order('date', { ascending: false })

  handleError(error, 'getMealData')
  return data.map(mapMealRow)
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

  const { data, error } = await supabase
    .from('weekly_health_digests')
    .select('*')
    .eq('patient_id', patientId)
    .order('week_start', { ascending: false })

  handleError(error, 'getWeeklyDigestsByPatientId')
  return data.map(mapWeeklyDigestRow)
}

export const getAllWeeklyDigests = async () => {
  if (USE_MOCK_DATA) {
    return mockGetAllWeeklyDigests()
  }

  const { data, error } = await supabase
    .from('weekly_health_digests')
    .select('*')
    .order('week_start', { ascending: false })

  handleError(error, 'getAllWeeklyDigests')
  return data.map(mapWeeklyDigestRow)
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

  // Placeholder real implementation:
  const { data, error } = await supabase
    .from('weekly_health_digests')
    .select('*')
    .order('medication_adherence_pct', { ascending: true })

  handleError(error, 'getAtRiskPatients')
  return data.map(mapWeeklyDigestRow)
}

export const getCohortOverview = async () => {
  if (USE_MOCK_DATA) {
    return mockGetCohortOverview()
  }

  const { data, error } = await supabase
    .from('weekly_health_digests')
    .select('*')

  handleError(error, 'getCohortOverview')

  if (!data.length) {
    return {
      totalPatients: 0,
      avgAdherence: 0,
      avgGlucose: 0,
    }
  }

  const totalPatients = new Set(data.map(d => d.patient_id)).size
  const avgAdherence =
    data.reduce((sum, d) => sum + (d.medication_adherence_pct || 0), 0) / data.length
  const avgGlucose =
    data.reduce((sum, d) => sum + (d.avg_fasting_glucose || 0), 0) / data.length

  return {
    totalPatients,
    avgAdherence: Number(avgAdherence.toFixed(1)),
    avgGlucose: Number(avgGlucose.toFixed(1)),
  }
}

export const getTrends = async () => {
  if (USE_MOCK_DATA) {
    return mockGetTrends()
  }

  const { data, error } = await supabase
    .from('weekly_health_digests')
    .select('*')
    .order('week_start', { ascending: true })

  handleError(error, 'getTrends')
  return data.map(mapWeeklyDigestRow)
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