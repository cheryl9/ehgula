/**
 * Data Provider Layer - Feature Flag Abstraction
 * 
 * This layer provides a single interface for all data queries.
 * It automatically switches between mock data (for development/testing)
 * and real Supabase queries (for production) based on the VITE_USE_MOCK_DATA flag.
 * 
 * Usage:
 *   import { getAllBriefs, getWeeklyDigestsByPatientId, ... } from '../api/dataProvider'
 * 
 * Toggle between mock and real:
 *   Set VITE_USE_MOCK_DATA=true (mock) or VITE_USE_MOCK_DATA=false (real) in .env
 */

// Feature flag: Toggle between mock and real data
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA !== 'false'

// Import mock data functions
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
 * ====================================
 * DOCTOR BRIEFS
 * ====================================
 */

export const getAllBriefs = () => {
  if (USE_MOCK_DATA) {
    return mockGetAllBriefs()
  }
  
  // TODO: Real implementation - Query Supabase doctor_briefs table
  // return supabaseClient
  //   .from('doctor_briefs')
  //   .select('*')
  //   .order('created_at', { ascending: false })
}

export const getBriefById = (briefId) => {
  if (USE_MOCK_DATA) {
    return mockGetBriefById(briefId)
  }
  
  // TODO: Real implementation
  // return supabaseClient
  //   .from('doctor_briefs')
  //   .select('*')
  //   .eq('id', briefId)
  //   .single()
}

export const getBriefsByPatientId = (patientId) => {
  if (USE_MOCK_DATA) {
    return mockGetBriefsByPatientId(patientId)
  }
  
  // TODO: Real implementation
  // return supabaseClient
  //   .from('doctor_briefs')
  //   .select('*')
  //   .eq('patient_id', patientId)
  //   .order('created_at', { ascending: false })
}

export const getLatestBriefByPatientId = (patientId) => {
  if (USE_MOCK_DATA) {
    return mockGetLatestBriefByPatientId(patientId)
  }
  
  // TODO: Real implementation
  // return supabaseClient
  //   .from('doctor_briefs')
  //   .select('*')
  //   .eq('patient_id', patientId)
  //   .order('created_at', { ascending: false })
  //   .limit(1)
  //   .single()
}

/**
 * ====================================
 * APPOINTMENTS
 * ====================================
 */

export const getPatientAppointments = () => {
  if (USE_MOCK_DATA) {
    return MOCK_PATIENT_APPOINTMENTS
  }
  
  // TODO: Real implementation
  // const { data, error } = await supabaseClient
  //   .from('appointments')
  //   .select('*')
  //   .eq('patient_id', currentPatientId)
  // if (error) throw error
  // return data
}

export const getAllAppointments = () => {
  if (USE_MOCK_DATA) {
    return MOCK_ALL_APPOINTMENTS
  }
  
  // TODO: Real implementation
  // const { data, error } = await supabaseClient
  //   .from('appointments')
  //   .select('*')
  // if (error) throw error
  // return data
}

/**
 * ====================================
 * EXERCISE & ACTIVITY
 * ====================================
 */

export const getStepsData = () => {
  if (USE_MOCK_DATA) {
    return MOCK_STEPS
  }
  
  // TODO: Real implementation - Query health data from Supabase
  // const { data, error } = await supabaseClient
  //   .from('activity_data')
  //   .select('date, steps')
  //   .order('date', { ascending: false })
  //   .limit(7)
  // if (error) throw error
  // return data
}

export const getSittingData = () => {
  if (USE_MOCK_DATA) {
    return MOCK_SITTING
  }
  
  // TODO: Real implementation
  // const { data, error } = await supabaseClient
  //   .from('activity_data')
  //   .select('start_time, duration, ...')
  // if (error) throw error
  // return data
}

export const getHeartRateData = () => {
  if (USE_MOCK_DATA) {
    return MOCK_HEART_RATE
  }
  
  // TODO: Real implementation
  // const { data, error } = await supabaseClient
  //   .from('vitals')
  //   .select('timestamp, heart_rate, zone')
  // if (error) throw error
  // return data
}

export const getHRZones = () => {
  if (USE_MOCK_DATA) {
    return HR_ZONES
  }
  
  // TODO: Real implementation - could be static or from config table
  // return HR_ZONES // or fetch from supabase if patient-specific
}

/**
 * ====================================
 * MEALS & NUTRITION
 * ====================================
 */

export const getMealData = () => {
  if (USE_MOCK_DATA) {
    return MOCK_MEAL_DATA
  }
  
  // TODO: Real implementation
  // const { data, error } = await supabaseClient
  //   .from('meal_logs')
  //   .select('*')
  //   .order('date', { ascending: false })
  //   .limit(30)
  // if (error) throw error
  // return data
}

export const calculateMealAdherence = () => {
  if (USE_MOCK_DATA) {
    return mockCalculateMealAdherence()
  }
  
  // TODO: Real implementation
  // Fetch actual meal data and calculate adherence from database
}

export const getMealPatterns = () => {
  if (USE_MOCK_DATA) {
    return MEAL_PATTERNS
  }
  
  // TODO: Real implementation
  // Analytics query to get meal pattern analysis
}

/**
 * ====================================
 * WEEKLY DIGESTS
 * ====================================
 */

export const getWeeklyDigestsByPatientId = (patientId) => {
  if (USE_MOCK_DATA) {
    return mockGetWeeklyDigestsByPatientId(patientId)
  }
  
  // TODO: Real implementation
  // const { data, error } = await supabaseClient
  //   .from('weekly_digests')
  //   .select('*')
  //   .eq('patient_id', patientId)
  //   .order('week_start', { ascending: false })
  // if (error) throw error
  // return data
}

export const getAllWeeklyDigests = () => {
  if (USE_MOCK_DATA) {
    return mockGetAllWeeklyDigests()
  }
  
  // TODO: Real implementation
  // const { data, error } = await supabaseClient
  //   .from('weekly_digests')
  //   .select('*')
  //   .order('week_start', { ascending: false })
  // if (error) throw error
  // return data
}

export const getWeeklyDigestStatusColor = (status) => {
  // This is a utility function - works the same for mock and real
  return getStatusColor(status)
}

/**
 * ====================================
 * POPULATION ANALYTICS
 * ====================================
 */

export const getAtRiskPatients = () => {
  if (USE_MOCK_DATA) {
    return mockGetAtRiskPatients()
  }
  
  // TODO: Real implementation
  // SELECT * from patient risk analytics table
  // Order by risk_score DESC
  // const { data, error } = await supabaseClient
  //   .from('patient_risk_scores')
  //   .select('*')
  //   .order('risk_score', { ascending: false })
  // if (error) throw error
  // return data
}

export const getCohortOverview = () => {
  if (USE_MOCK_DATA) {
    return mockGetCohortOverview()
  }
  
  // TODO: Real implementation
  // Aggregate query for cohort statistics
  // SELECT 
  //   COUNT(*) as total_patients,
  //   AVG(adherence) as overall_adherence,
  //   AVG(glucose) as avg_glucose,
  //   COUNT(CASE WHEN met_goals THEN 1 END) as patients_met_goals
  // FROM patients
}

export const getTrends = () => {
  if (USE_MOCK_DATA) {
    return mockGetTrends()
  }
  
  // TODO: Real implementation
  // Time-series queries for trend data
  // SELECT date, AVG(adherence), AVG(glucose), SUM(steps) FROM daily_metrics
}

/**
 * ====================================
 * MOCK DATA EXPORTS (for direct access if needed)
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

// Feature flag export for debugging/testing
export { USE_MOCK_DATA }
