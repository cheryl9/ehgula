import apiClient from './client'
import { MOCK_PATIENTS, MOCK_GLUCOSE, MOCK_MEDICATIONS } from './mocks'

// Use the same feature flag as dataProvider for consistency
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA !== 'false'

/**
 * Get all assigned patients
 */
export const getAssignedPatients = async (skip = 0, limit = 20) => {
  try {
    if (USE_MOCK_DATA) return { total: MOCK_PATIENTS.length, patients: MOCK_PATIENTS }
    const response = await apiClient.get('/clinician/patients', {
      params: { skip, limit }
    })
    return response.data
  } catch (error) {
    console.error('Failed to get patients:', error)
    throw error
  }
}

/**
 * Get single patient details
 */
export const getPatientDetail = async (patientId) => {
  try {
    if (USE_MOCK_DATA) return MOCK_PATIENTS.find(p => p.patient_id === patientId)
    const response = await apiClient.get(`/clinician/patients/${patientId}`)
    return response.data
  } catch (error) {
    console.error('Failed to get patient detail:', error)
    throw error
  }
}

/**
 * Get glucose trends
 */
export const getGlucoseTrend = async (patientId, days = 30) => {
  try {
    if (USE_MOCK_DATA) return { patient_id: patientId, period_days: days, ...MOCK_GLUCOSE }
    const response = await apiClient.get(`/clinician/patients/${patientId}/glucose`, {
      params: { days }
    })
    return response.data
  } catch (error) {
    console.error('Failed to get glucose trends:', error)
    throw error
  }
}

/**
 * Get medication adherence
 */
export const getMedicationData = async (patientId, days = 30) => {
  try {
    if (USE_MOCK_DATA) return { patient_id: patientId, period_days: days, ...MOCK_MEDICATIONS }
    const response = await apiClient.get(`/clinician/patients/${patientId}/medication`, {
      params: { days }
    })
    return response.data
  } catch (error) {
    console.error('Failed to get medication data:', error)
    throw error
  }
}

/**
 * Get meal logs
 */
export const getMealData = async (patientId, days = 30) => {
  try {
    if (USE_MOCK_DATA) {
      return {
        patient_id: patientId,
        period_days: days,
        rows: [],
      }
    }

    const response = await apiClient.get(`/clinician/patients/${patientId}/meals`, {
      params: { days }
    })
    return response.data
  } catch (error) {
    console.error('Failed to get meal data:', error)
    throw error
  }
}

/**
 * Get exercise data
 */
export const getExerciseData = async (patientId, days = 30) => {
  try {
    if (USE_MOCK_DATA) {
      return {
        patient_id: patientId,
        period_days: days,
        steps: [],
        sitting: [],
        heartRate: [],
      }
    }

    const response = await apiClient.get(`/clinician/patients/${patientId}/exercise`, {
      params: { days }
    })
    return response.data
  } catch (error) {
    console.error('Failed to get exercise data:', error)
    throw error
  }
}

/**
 * Get appointments
 */
export const getAppointments = async (patientId, status = 'all') => {
  try {
    if (USE_MOCK_DATA) return []

    const response = await apiClient.get(`/clinician/patients/${patientId}/appointments`, {
      params: { status }
    })
    return response.data
  } catch (error) {
    console.error('Failed to get appointments:', error)
    throw error
  }
}

/**
 * Get pre-appointment brief
 */
export const getDoctorBrief = async (patientId, appointmentId) => {
  try {
    const response = await apiClient.get(`/clinician/patients/${patientId}/brief`, {
      params: appointmentId ? { appointment_id: appointmentId } : {}
    })
    return response.data
  } catch (error) {
    console.warn('Doctor brief unavailable, using fallback summary:', error)
    return {
      brief: 'Doctor brief is temporarily unavailable. Please review the latest glucose, medication, and meal trends directly.',
      alert_level: 'normal',
      generated_at: new Date().toISOString(),
    }
  }
}

/**
 * Get population analytics
 */
export const getPopulationAnalytics = async (days = 30) => {
  try {
    const response = await apiClient.get('/clinician/analytics', {
      params: { days }
    })
    return response.data
  } catch (error) {
    console.error('Failed to get analytics:', error)
    throw error
  }
}

/**
 * Reschedule appointment
 */
export const rescheduleAppointment = async (patientId, appointmentId, newDate, newTime, reason) => {
  try {
    const response = await apiClient.patch(
      `/clinician/patients/${patientId}/appointments/${appointmentId}`,
      {
        action: 'reschedule',
        new_date: newDate,
        new_time: newTime,
        reason
      }
    )
    return response.data
  } catch (error) {
    console.error('Failed to reschedule appointment:', error)
    throw error
  }
}

/**
 * Cancel appointment
 */
export const cancelAppointment = async (patientId, appointmentId, reason) => {
  try {
    const response = await apiClient.delete(
      `/clinician/patients/${patientId}/appointments/${appointmentId}`,
      { data: { reason } }
    )
    return response.data
  } catch (error) {
    console.error('Failed to cancel appointment:', error)
    throw error
  }
}
