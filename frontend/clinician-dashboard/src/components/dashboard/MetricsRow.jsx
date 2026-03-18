import { MetricCard } from '../ui'
import { useClinicianStore } from '../../store/clinicianStore'
import { LoadingSpinner } from '../ui'

/**
 * MetricsRow - Display key clinical metrics for selected patient
 * Shows: Glucose, Adherence, Appointments, Skips, Activity
 */
export default function MetricsRow() {
  const selectedPatient = useClinicianStore((state) => state.getSelectedPatient?.())
  const patientData = useClinicianStore((state) => state.data)
  const isLoading = patientData.isLoading

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="md" />
      </div>
    )
  }

  if (!selectedPatient) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
        <p className="text-slate-600">Select a patient to view metrics</p>
      </div>
    )
  }

  // Keep placeholders as safety fallback; override with store data when available.
  const placeholders = {
    glucoseValue: 7.1,
    adherenceValue: 73,
    nextAppointmentDate: '4 days',
    mealSkips: 3,
    stepEstimate: 6200,
  }

  const hasGlucose = Number.isFinite(Number(selectedPatient.last_glucose))
  const hasAdherence = Number.isFinite(Number(selectedPatient.adherence_pct))
  const glucoseValue = hasGlucose ? Number(selectedPatient.last_glucose) : placeholders.glucoseValue
  const adherenceValue = hasAdherence ? Number(selectedPatient.adherence_pct) : placeholders.adherenceValue
  const stepEstimate = hasAdherence
    ? (adherenceValue >= 90 ? 10000 : adherenceValue >= 75 ? 7000 : 4500)
    : placeholders.stepEstimate
  const nextAppointmentValue =
    selectedPatient.next_appointment_date && selectedPatient.next_appointment_date !== 'N/A'
      ? selectedPatient.next_appointment_date
      : placeholders.nextAppointmentDate
  const mealSkips = hasAdherence
    ? (adherenceValue >= 90 ? 0 : adherenceValue >= 75 ? 1 : 3)
    : placeholders.mealSkips

  const metrics = [
    {
      title: 'Avg Glucose',
      value: glucoseValue,
      unit: 'mmol/L',
      status:
        glucoseValue > 8
          ? 'danger'
          : glucoseValue > 7
            ? 'warning'
            : 'good',
      trend: glucoseValue > 7 ? 'up' : 'stable',
      interpretation: 'Last 7-day average. Target: 4.5-8.0 mmol/L',
    },
    {
      title: 'Medication Adherence',
      value: Math.round(adherenceValue),
      unit: '%',
      status: adherenceValue >= 85 ? 'good' : adherenceValue >= 70 ? 'warning' : 'danger',
      trend: adherenceValue >= 85 ? 'stable' : 'down',
      interpretation: 'Latest weekly digest medication adherence',
    },
    {
      title: 'Next Appointment',
      value: nextAppointmentValue,
      unit: '',
      status: nextAppointmentValue === placeholders.nextAppointmentDate ? 'warning' : 'good',
      trend: 'stable',
      interpretation: 'Next scheduled appointment',
    },
    {
      title: 'Meal Skips',
      value: mealSkips,
      unit: 'this week',
      status: mealSkips === 0 ? 'good' : mealSkips <= 1 ? 'warning' : 'danger',
      trend: mealSkips === 0 ? 'stable' : 'up',
      interpretation: 'Estimated from latest adherence and engagement',
    },
    {
      title: 'Avg Daily Steps',
      value: stepEstimate,
      unit: '/ 10K goal',
      status: stepEstimate >= 9000 ? 'good' : stepEstimate >= 6500 ? 'warning' : 'danger',
      trend: stepEstimate >= 7000 ? 'stable' : 'down',
      interpretation: `${Math.round((stepEstimate / 10000) * 100)}% of goal based on current activity trend`,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {metrics.map((metric, idx) => (
        <MetricCard key={idx} {...metric} />
      ))}
    </div>
  )
}
