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

  // Mock calculations from patient data (will be replaced with real API data)
  const metrics = [
    {
      title: 'Avg Glucose',
      value: selectedPatient.last_glucose || 7.2,
      unit: 'mmol/L',
      status:
        selectedPatient.last_glucose > 8
          ? 'danger'
          : selectedPatient.last_glucose > 7
            ? 'warning'
            : 'good',
      trend: 'up',
      interpretation: 'Last 7-day average. Target: 4.5-8.0 mmol/L',
    },
    {
      title: 'Medication Adherence',
      value: selectedPatient.adherence || 73,
      unit: '%',
      status: selectedPatient.adherence >= 80 ? 'good' : 'warning',
      trend: 'down',
      interpretation: 'Average across all medications. Concern: Declining trend',
    },
    {
      title: 'Next Appointment',
      value: '4',
      unit: 'days',
      status: 'good',
      trend: 'stable',
      interpretation: 'March 22, 2026 - 2:00 PM at Central Clinic',
    },
    {
      title: 'Meal Skips',
      value: '3',
      unit: 'this week',
      status: 'warning',
      trend: 'up',
      interpretation: 'Lunch skipped on Tue, Thu. Fasting risk increasing.',
    },
    {
      title: 'Avg Daily Steps',
      value: 6200,
      unit: '/ 10K goal',
      status: 'warning',
      trend: 'down',
      interpretation: '62% of goal. Activity level declining.',
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
