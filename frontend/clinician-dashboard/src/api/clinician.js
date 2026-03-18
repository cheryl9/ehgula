import apiClient from './client'
import { MOCK_PATIENTS, MOCK_GLUCOSE, MOCK_MEDICATIONS } from './mocks'
import { supabase } from '../lib/supabase'

// Use the same feature flag as dataProvider for consistency
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA !== 'false'

const toPatientRow = (patient, profile, lastGlucoseByPatientId, nextApptByPatientId, digestByPatientId) => {
  const digest = digestByPatientId.get(patient.id)
  const adherence = digest?.medication_adherence_pct ?? 0
  const riskLevel =
    adherence >= 80 ? 'low' :
    adherence >= 60 ? 'medium' :
    'high'

  return {
    patient_id: patient.id,
    patient_code: patient.patient_code,
    name: patient.name || profile?.full_name || patient.patient_code,
    condition: patient.condition,
    last_glucose: lastGlucoseByPatientId.get(patient.id) ?? null,
    adherence_pct: adherence,
    risk_level: riskLevel,
    next_appointment_date: nextApptByPatientId.get(patient.id) || 'N/A',
  }
}

/**
 * Get all assigned patients
 */
export const getAssignedPatients = async (skip = 0, limit = 20) => {
  try {
    if (USE_MOCK_DATA) return { total: MOCK_PATIENTS.length, patients: MOCK_PATIENTS }

    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError) throw authError

    const userId = authData?.user?.id
    if (!userId) {
      throw new Error('No Supabase session found. Please sign out and log in with a valid Supabase clinician account.')
    }

    const { data: clinician, error: clinicianError } = await supabase
      .from('clinicians')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (clinicianError) throw clinicianError

    const { data: assignments, error: assignmentsError } = await supabase
      .from('clinician_patient_assignments')
      .select('patient_id')
      .eq('clinician_id', clinician.id)

    if (assignmentsError) throw assignmentsError

    const assignedIds = (assignments || []).map((a) => a.patient_id)
    if (!assignedIds.length) {
      return { total: 0, patients: [] }
    }

    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id,user_id,patient_code,name,condition')
      .in('id', assignedIds)
      .range(skip, skip + limit - 1)

    if (patientsError) throw patientsError
    if (!patients?.length) {
      return { total: 0, patients: [] }
    }

    const userIds = patients.map((p) => p.user_id)
    const patientIds = patients.map((p) => p.id)

    const [profilesRes, glucoseRes, apptRes, digestRes] = await Promise.all([
      supabase.from('profiles').select('id,full_name').in('id', userIds),
      supabase.from('glucose_readings').select('patient_id,value_mmol,timestamp').in('patient_id', patientIds).order('timestamp', { ascending: false }),
      supabase.from('appointments').select('patient_id,date,status').in('patient_id', patientIds).eq('status', 'scheduled').order('date', { ascending: true }),
      supabase.from('weekly_health_digests').select('patient_id,medication_adherence_pct,week_start').in('patient_id', patientIds).order('week_start', { ascending: false }),
    ])

    if (profilesRes.error) throw profilesRes.error
    if (glucoseRes.error) throw glucoseRes.error
    if (apptRes.error) throw apptRes.error
    if (digestRes.error) throw digestRes.error

    const profileByUserId = new Map((profilesRes.data || []).map((p) => [p.id, p]))

    const lastGlucoseByPatientId = new Map()
    for (const row of glucoseRes.data || []) {
      if (!lastGlucoseByPatientId.has(row.patient_id)) {
        lastGlucoseByPatientId.set(row.patient_id, row.value_mmol)
      }
    }

    const nextApptByPatientId = new Map()
    for (const row of apptRes.data || []) {
      if (!nextApptByPatientId.has(row.patient_id)) {
        nextApptByPatientId.set(row.patient_id, row.date)
      }
    }

    const digestByPatientId = new Map()
    for (const row of digestRes.data || []) {
      if (!digestByPatientId.has(row.patient_id)) {
        digestByPatientId.set(row.patient_id, row)
      }
    }

    const resultPatients = patients.map((patient) =>
      toPatientRow(
        patient,
        profileByUserId.get(patient.user_id),
        lastGlucoseByPatientId,
        nextApptByPatientId,
        digestByPatientId
      )
    )

    return { total: resultPatients.length, patients: resultPatients }
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
    console.error('Failed to get doctor brief:', error)
    throw error
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
