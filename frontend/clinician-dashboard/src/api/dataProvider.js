/**
 * Data Provider Layer - Feature Flag Abstraction
 */

const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA !== 'false'

import apiClient from './client'
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

const apiFirst = async (requestFn, fallbackFn, context) => {
  try {
    const response = await requestFn()
    return response.data
  } catch (apiError) {
    console.warn(`[${context}] API call failed, using Supabase fallback`, apiError)
    if (!fallbackFn) {
      throw apiError
    }
    return fallbackFn()
  }
}

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
  patientName: row.patients?.name || row.patient_name || null,
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

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const deriveDigestRiskScore = (adherence, glucose, mealsSkipped) => {
  // Directly derived from digest metrics without patient-specific hardcoding.
  const adherencePenalty = Math.max(0, 100 - toNumber(adherence, 0))
  const glucosePenalty = Math.max(0, toNumber(glucose, 0) - 6.5) * 12
  const mealSkipPenalty = Math.max(0, toNumber(mealsSkipped, 0)) * 3
  return Math.max(0, Math.min(100, Math.round(adherencePenalty + glucosePenalty + mealSkipPenalty)))
}

const deriveDigestRiskLevel = (riskScore) => {
  if (riskScore >= 85) return 'CRITICAL'
  if (riskScore >= 65) return 'HIGH'
  if (riskScore >= 45) return 'MEDIUM'
  return 'LOW'
}

const mapDigestToAtRiskPatient = (digest, rank, latestActionDetailByPatientId = new Map()) => {
  const adherence = toNumber(digest.medicationAdherencePct ?? digest.adherence ?? digest.adherence_pct, 0)
  const glucose = toNumber(digest.avgFastingGlucose ?? digest.glucose ?? digest.last_glucose, 0)
  const mealsSkipped = toNumber(digest.mealsSkipped ?? digest.meals_skipped, 0)

  const concernFromDigest = (digest.highlights?.concern || '').toString().trim()
  const normalizedConcern = concernFromDigest.toLowerCase()
  const riskScore = deriveDigestRiskScore(adherence, glucose, mealsSkipped)
  const riskLevel = deriveDigestRiskLevel(riskScore)

  const primaryConcern = concernFromDigest || 'Needs review'

  let alerts = []
  if (normalizedConcern && normalizedConcern !== 'no major concerns') {
    alerts.push(primaryConcern)
  }

  const latestAction = latestActionDetailByPatientId.get(digest.patientId || digest.patient_id) || null

  const action = latestAction

  return {
    ...digest,
    rank,
    patientId: digest.patientId || digest.patient_id,
    name: digest.name || digest.patientName || 'Unknown Patient',
    riskScore,
    riskLevel,
    primaryConcern,
    adherence,
    glucose,
    mealsSkipped,
    alerts,
    action,
  }
}

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

  return apiFirst(
    () => apiClient.get(`/clinician/patients/${patientId}/appointments`),
    async () => {
      const assignedPatientIds = await getAssignedPatientIdsForCurrentClinician()
      if (!assignedPatientIds.includes(patientId)) {
        return []
      }

      const { data, error } = await supabase
        .from('appointments')
        .select('*, patients(name)')
        .eq('patient_id', patientId)
        .order('date', { ascending: true })

      handleError(error, 'getPatientAppointments')
      return data.map(mapAppointmentRow)
    },
    'getPatientAppointments'
  ).then(normalizeAppointmentsPayload)
}

export const getAllAppointments = async () => {
  if (USE_MOCK_DATA) {
    return MOCK_ALL_APPOINTMENTS
  }

  return apiFirst(
    () => apiClient.get('/clinician/appointments'),
    async () => {
      const assignedPatientIds = await getAssignedPatientIdsForCurrentClinician()
      if (!assignedPatientIds.length) {
        return []
      }

      const { data, error } = await supabase
        .from('appointments')
        .select('*, patients(name)')
        .in('patient_id', assignedPatientIds)
        .order('date', { ascending: true })

      handleError(error, 'getAllAppointments')
      return data.map(mapAppointmentRow)
    },
    'getAllAppointments'
  ).then(normalizeAppointmentsPayload)
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

  const payload = await apiFirst(
    () => apiClient.get(`/clinician/patients/${patientId}/exercise`, { params: { days: 30 } }),
    async () => {
      const { data, error } = await supabase
        .from('exercise_logs')
        .select('*')
        .eq('patient_id', patientId)
        .order('date', { ascending: true })

      handleError(error, 'getStepsData')
      return data
    },
    'getStepsData'
  )

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

  const payload = await apiFirst(
    () => apiClient.get(`/clinician/patients/${patientId}/exercise`, { params: { days: 30 } }),
    async () => {
      const { data, error } = await supabase
        .from('exercise_logs')
        .select('*')
        .eq('patient_id', patientId)
        .order('date', { ascending: true })

      handleError(error, 'getSittingData')
      return data
    },
    'getSittingData'
  )

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

  const payload = await apiFirst(
    () => apiClient.get(`/clinician/patients/${patientId}/exercise`, { params: { days: 30 } }),
    async () => {
      const { data, error } = await supabase
        .from('exercise_logs')
        .select('*')
        .eq('patient_id', patientId)
        .order('date', { ascending: true })

      handleError(error, 'getHeartRateData')
      return data
    },
    'getHeartRateData'
  )

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

  const payload = await apiFirst(
    () => apiClient.get(`/clinician/patients/${patientId}/meals`, { params: { days: 30 } }),
    async () => {
      const { data, error } = await supabase
        .from('meal_logs')
        .select('*')
        .eq('patient_id', patientId)
        .order('date', { ascending: false })

      handleError(error, 'getMealData')
      return data
    },
    'getMealData'
  )

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

  const payload = await apiFirst(
    () => apiClient.get(`/clinician/patients/${patientId}/weekly-digests`),
    async () => {
      const { data, error } = await supabase
        .from('weekly_health_digests')
        .select('*')
        .eq('patient_id', patientId)
        .order('week_start', { ascending: false })

      handleError(error, 'getWeeklyDigestsByPatientId')
      return data
    },
    'getWeeklyDigestsByPatientId'
  )

  const rows = Array.isArray(payload)
    ? payload
    : (Array.isArray(payload?.digests) ? payload.digests : [])

  return rows.map(mapWeeklyDigestRow)
}

export const getAllWeeklyDigests = async () => {
  if (USE_MOCK_DATA) {
    return mockGetAllWeeklyDigests()
  }

  const payload = await apiFirst(
    () => apiClient.get('/clinician/weekly-digests'),
    async () => {
      const { data, error } = await supabase
        .from('weekly_health_digests')
        .select('*')
        .order('week_start', { ascending: false })

      handleError(error, 'getAllWeeklyDigests')
      return data
    },
    'getAllWeeklyDigests'
  )

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

  return apiFirst(
    () => apiClient.get('/clinician/analytics/at-risk'),
    async () => {
      // Use latest digest per assigned patient and include patient name relation.
      const { data, error } = await supabase
        .from('weekly_health_digests')
        .select('*, patients(name,condition)')
        .order('week_start', { ascending: false })

      handleError(error, 'getAtRiskPatients')

      const latestByPatient = []
      const seenPatientIds = new Set()

      for (const row of data || []) {
        if (seenPatientIds.has(row.patient_id)) {
          continue
        }
        seenPatientIds.add(row.patient_id)
        latestByPatient.push(row)
      }

      const patientIds = latestByPatient.map((row) => row.patient_id)
      const latestActionDetailByPatientId = new Map()

      if (patientIds.length) {
        const { data: actionRows, error: actionError } = await supabase
          .from('agent_actions')
          .select('patient_id,detail,timestamp')
          .in('patient_id', patientIds)
          .order('timestamp', { ascending: false })

        handleError(actionError, 'getAtRiskPatients.agent_actions')

        for (const row of actionRows || []) {
          if (!latestActionDetailByPatientId.has(row.patient_id)) {
            latestActionDetailByPatientId.set(row.patient_id, row.detail)
          }
        }
      }

      const mapped = latestByPatient
        .map((row) => mapDigestToAtRiskPatient(mapWeeklyDigestRow(row), 0, latestActionDetailByPatientId))
        .sort((a, b) => b.riskScore - a.riskScore)

      return mapped.map((row, idx) => ({
        ...row,
        rank: idx + 1,
      }))
    },
    'getAtRiskPatients'
  )
}

export const getCohortOverview = async () => {
  if (USE_MOCK_DATA) {
    return mockGetCohortOverview()
  }

  return apiFirst(
    () => apiClient.get('/clinician/analytics/cohort-overview'),
    async () => {
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
    },
    'getCohortOverview'
  )
}

export const getTrends = async () => {
  if (USE_MOCK_DATA) {
    return mockGetTrends()
  }

  const payload = await apiFirst(
    () => apiClient.get('/clinician/analytics/trends'),
    async () => {
      const { data, error } = await supabase
        .from('weekly_health_digests')
        .select('*')
        .order('week_start', { ascending: true })

      handleError(error, 'getTrends')
      return data
    },
    'getTrends'
  )

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