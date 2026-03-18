import apiClient from './client'
import { MOCK_PATIENTS, MOCK_GLUCOSE, MOCK_MEDICATIONS } from './mocks'
import { supabase } from '../lib/supabase'

// Use the same feature flag as dataProvider for consistency
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA !== 'false'

const toPatientRow = (patient, profile, lastGlucoseByPatientId, nextApptByPatientId, digestByPatientId) => {
  const digest = digestByPatientId.get(patient.id)
  const adherence = digest?.medication_adherence_pct ?? 0
  const digestGlucose = digest?.avg_fasting_glucose ?? null
  const riskLevel =
    adherence >= 80 ? 'low' :
    adherence >= 60 ? 'medium' :
    'high'

  return {
    patient_id: patient.id,
    patient_code: patient.patient_code,
    name: patient.name || profile?.full_name || patient.patient_code,
    age: patient.age,
    gender: patient.gender,
    ethnicity: patient.ethnicity,
    condition: patient.condition,
    diagnosis_date: patient.diagnosis_date,
    emergency_contact: patient.emergency_contact,
    language_preference: profile?.language_preference || null,
    // Source of truth for overview cards: latest weekly digest fasting average.
    last_glucose: digestGlucose ?? lastGlucoseByPatientId.get(patient.id) ?? null,
    adherence_pct: adherence,
    risk_level: riskLevel,
    meals_skipped: digest?.meals_skipped ?? null,
    skip_pattern: digest?.skip_pattern ?? null,
    avg_steps: digest?.avg_steps ?? null,
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
      .select('id,user_id,patient_code,name,age,gender,ethnicity,condition,diagnosis_date,emergency_contact')
      .in('id', assignedIds)
      .range(skip, skip + limit - 1)

    if (patientsError) throw patientsError
    if (!patients?.length) {
      return { total: 0, patients: [] }
    }

    const userIds = patients.map((p) => p.user_id)
    const patientIds = patients.map((p) => p.id)

    const [profilesRes, glucoseRes, apptRes, digestRes] = await Promise.all([
      supabase.from('profiles').select('id,full_name,language_preference').in('id', userIds),
      supabase.from('glucose_readings').select('patient_id,value_mmol,timestamp').in('patient_id', patientIds).order('timestamp', { ascending: false }),
      supabase.from('appointments').select('patient_id,date,status').in('patient_id', patientIds).eq('status', 'scheduled').order('date', { ascending: true }),
      supabase
        .from('weekly_health_digests')
        .select('patient_id,medication_adherence_pct,avg_fasting_glucose,meals_skipped,skip_pattern,avg_steps,week_start')
        .in('patient_id', patientIds)
        .order('week_start', { ascending: false }),
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
    try {
      const response = await apiClient.get(`/clinician/patients/${patientId}/glucose`, {
        params: { days }
      })
      return response.data
    } catch (apiError) {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - Math.max(1, Number(days)))

      const { data, error } = await supabase
        .from('glucose_readings')
        .select('timestamp,value_mmol,reading_type')
        .eq('patient_id', patientId)
        .gte('timestamp', cutoff.toISOString())
        .order('timestamp', { ascending: true })

      if (error) throw error

      const readings = (data || []).map((row) => ({
        timestamp: row.timestamp,
        value_mmol: row.value_mmol,
        type: row.reading_type,
      }))

      const values = readings
        .map((r) => Number(r.value_mmol))
        .filter((v) => Number.isFinite(v))

      const avg = values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : 0
      const min = values.length ? Math.min(...values) : 0
      const max = values.length ? Math.max(...values) : 0
      const std = values.length
        ? Math.sqrt(values.reduce((sq, n) => sq + Math.pow(n - avg, 2), 0) / values.length)
        : 0

      return {
        patient_id: patientId,
        period_days: days,
        avg_glucose: Number(avg.toFixed(1)),
        avg_glucose_7day: Number(avg.toFixed(1)),
        avg_glucose_30day: Number(avg.toFixed(1)),
        min_glucose: Number(min.toFixed(1)),
        max_glucose: Number(max.toFixed(1)),
        std_dev: Number(std.toFixed(1)),
        readings_below_3_8: values.filter((v) => v < 3.8).length,
        readings_above_9: values.filter((v) => v > 9).length,
        readings,
      }
    }
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
    try {
      const response = await apiClient.get(`/clinician/patients/${patientId}/medication`, {
        params: { days }
      })
      return response.data
    } catch (apiError) {
      // Fallback to direct Supabase reads when backend HTTP endpoints are unavailable.
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - Math.max(1, Number(days)))
      const cutoffIso = cutoff.toISOString().slice(0, 10)

      const [plansRes, doseRes, digestRes] = await Promise.all([
        supabase
          .from('medication_plans')
          .select('id,name,dose,frequency')
          .eq('patient_id', patientId),
        supabase
          .from('medication_dose_logs')
          .select('id,medication_plan_id,dose_date,scheduled_time,actual_time,status,held_reason,rescheduled_to,agent_action')
          .eq('patient_id', patientId)
          .gte('dose_date', cutoffIso)
          .order('dose_date', { ascending: false }),
        supabase
          .from('weekly_health_digests')
          .select('medication_adherence_pct,week_start')
          .eq('patient_id', patientId)
          .order('week_start', { ascending: false })
          .limit(1),
      ])

      if (plansRes.error) throw plansRes.error
      if (doseRes.error) throw doseRes.error
      if (digestRes.error) throw digestRes.error

      const plans = plansRes.data || []
      const logs = doseRes.data || []
      const latestDigest = (digestRes.data || [])[0] || null

      const byPlan = new Map()
      for (const plan of plans) {
        byPlan.set(plan.id, [])
      }
      for (const log of logs) {
        if (!byPlan.has(log.medication_plan_id)) {
          byPlan.set(log.medication_plan_id, [])
        }
        byPlan.get(log.medication_plan_id).push(log)
      }

      const medications = plans.map((plan) => {
        const medLogs = byPlan.get(plan.id) || []
        const totalDoses = medLogs.length
        const dosesTaken = medLogs.filter((l) => l.status === 'taken').length
        const dosesMissed = medLogs.filter((l) => l.status === 'missed').length
        const dosesHeldByAgent = medLogs.filter((l) => !!l.agent_action || !!l.held_reason).length

        const halfway = Math.floor(medLogs.length / 2)
        const recent = medLogs.slice(0, Math.max(1, halfway))
        const previous = medLogs.slice(Math.max(1, halfway))
        const recentPct = recent.length
          ? recent.filter((l) => l.status === 'taken').length / recent.length
          : null
        const previousPct = previous.length
          ? previous.filter((l) => l.status === 'taken').length / previous.length
          : null

        let trend = 'stable'
        if (recentPct !== null && previousPct !== null) {
          if (recentPct - previousPct > 0.1) trend = 'up'
          else if (previousPct - recentPct > 0.1) trend = 'down'
        }

        const lastTakenRow = medLogs.find((l) => l.status === 'taken')
        const lastTaken = lastTakenRow
          ? `${lastTakenRow.dose_date} ${lastTakenRow.actual_time || lastTakenRow.scheduled_time || ''}`.trim()
          : 'N/A'

        return {
          medication_id: plan.id,
          name: plan.name,
          dose: plan.dose,
          frequency: plan.frequency,
          adherence_pct: totalDoses > 0 ? Math.round((dosesTaken / totalDoses) * 100) : 0,
          trend,
          total_doses: totalDoses,
          doses_taken: dosesTaken,
          doses_missed: dosesMissed,
          doses_held_by_agent: dosesHeldByAgent,
          last_taken: lastTaken,
          next_due: 'N/A',
        }
      })

      const overallFromMeds = medications.length
        ? Math.round(medications.reduce((sum, m) => sum + m.adherence_pct, 0) / medications.length)
        : 0

      const doseLogs = logs.map((log) => {
        const plan = plans.find((p) => p.id === log.medication_plan_id)
        return {
          id: log.id,
          timestamp: `${log.dose_date}T${log.actual_time || log.scheduled_time || '00:00'}`,
          medication_name: plan?.name || 'Unknown',
          dose: plan?.dose || 'N/A',
          status: log.status,
          notes: log.held_reason || (log.rescheduled_to ? `Rescheduled to ${log.rescheduled_to}` : ''),
        }
      })

      return {
        patient_id: patientId,
        period_days: days,
        overall_adherence_pct: Number.isFinite(Number(latestDigest?.medication_adherence_pct))
          ? Number(latestDigest.medication_adherence_pct)
          : overallFromMeds,
        medications,
        dose_logs: doseLogs,
      }
    }
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
    if (!USE_MOCK_DATA) {
      try {
        const response = await apiClient.get(`/clinician/patients/${patientId}/meals`, {
          params: { days }
        })
        return response.data
      } catch {
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - Math.max(1, Number(days)))
        const cutoffIso = cutoff.toISOString().slice(0, 10)

        const { data, error } = await supabase
          .from('meal_logs')
          .select('id,date,meal_type,time,logged,skipped,skip_reason,description')
          .eq('patient_id', patientId)
          .gte('date', cutoffIso)
          .order('date', { ascending: false })

        if (error) throw error

        return {
          patient_id: patientId,
          period_days: days,
          rows: (data || []).map((row) => ({
            id: row.id,
            date: row.date,
            meal_type: row.meal_type,
            time: row.time,
            logged: row.logged,
            skipped: row.skipped,
            skip_reason: row.skip_reason,
            description: row.description,
          }))
        }
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
    if (!USE_MOCK_DATA) {
      try {
        const response = await apiClient.get(`/clinician/patients/${patientId}/exercise`, {
          params: { days }
        })
        return response.data
      } catch {
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - Math.max(1, Number(days)))
        const cutoffIso = cutoff.toISOString().slice(0, 10)

        const { data, error } = await supabase
          .from('exercise_logs')
          .select('id,date,steps,step_goal,sitting_episodes,heart_rate')
          .eq('patient_id', patientId)
          .gte('date', cutoffIso)
          .order('date', { ascending: true })

        if (error) throw error

        const rows = data || []
        const latest7 = rows.slice(-7)

        const steps = latest7.map((row) => ({
          date: new Date(row.date).toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' }),
          steps: Number(row.steps || 0),
          goal: Number(row.step_goal || 10000),
          achievement: Math.round((Number(row.steps || 0) / Math.max(1, Number(row.step_goal || 10000))) * 100),
        }))

        const sitting = latest7.flatMap((row, idx) => {
          const episodes = Array.isArray(row.sitting_episodes) ? row.sitting_episodes : []
          return episodes.map((episode, epIdx) => {
            const duration = Number(episode.duration_mins || episode.duration || 0)
            return {
              id: `${row.id || idx}-${epIdx}`,
              startTime: episode.start || 'N/A',
              endTime: episode.end || 'N/A',
              duration,
              location: episode.location || 'Daily routine',
              exceedsLimit: Boolean(episode.flagged) || duration > 60,
              date: row.date,
            }
          })
        })

        const heartRate = latest7.flatMap((row) => {
          const readings = Array.isArray(row.heart_rate) ? row.heart_rate : []
          return readings.map((item) => {
            const bpm = Number(item?.bpm || item?.hr || 0)
            const zone = (item?.zone || (bpm <= 60 ? 'Resting' : bpm <= 100 ? 'Light' : bpm <= 140 ? 'Moderate' : bpm <= 170 ? 'Vigorous' : 'Maximum'))
            return {
              time: item?.time || new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              hr: bpm,
              zone,
            }
          })
        }).filter((item) => Number.isFinite(item.hr) && item.hr > 0)

        return {
          patient_id: patientId,
          period_days: days,
          steps,
          sitting,
          heartRate,
        }
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
    if (!USE_MOCK_DATA) {
      try {
        const response = await apiClient.get(`/clinician/patients/${patientId}/appointments`, {
          params: { status }
        })
        return response.data
      } catch {
        let query = supabase
          .from('appointments')
          .select('id,patient_id,date,time,clinic,clinician_name,type,auto_booked,booking_reason,urgency_score,status')
          .eq('patient_id', patientId)
          .order('date', { ascending: true })

        if (status !== 'all') {
          query = query.eq('status', status)
        }

        const { data, error } = await query
        if (error) throw error
        return data || []
      }
    }

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
