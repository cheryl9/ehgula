import { TrendingUp, TrendingDown, Activity, Pill, Utensils, Calendar, Clock } from 'lucide-react'
import clsx from 'clsx'
import { useClinicianStore } from '../../store/clinicianStore'

/**
 * RiskIndicators - Detailed breakdown of risk factors
 * Shows clinical indicators with traffic light coloring
 */
export default function RiskIndicators() {
  const selectedPatient = useClinicianStore((state) => state.getSelectedPatient?.())

  if (!selectedPatient) {
    return null
  }

  // Define risk indicators based on patient data
  const indicators = [
    {
      id: 'glucose-control',
      icon: TrendingUp,
      label: 'Glucose Control',
      status: selectedPatient.last_glucose > 8 ? 'high' : selectedPatient.last_glucose > 7 ? 'medium' : 'low',
      details: [
        { label: 'Latest Reading', value: `${selectedPatient.last_glucose || 7.2} mmol/L` },
        { label: 'Trend', value: 'Increasing over 7 days' },
        { label: 'Target Range', value: '4.5 - 8.0 mmol/L' },
      ],
    },
    {
      id: 'medication-adherence',
      icon: Pill,
      label: 'Medication Adherence',
      status:
        selectedPatient.adherence >= 90
          ? 'low'
          : selectedPatient.adherence >= 80
            ? 'medium'
            : 'high',
      details: [
        { label: 'Adherence Rate', value: `${selectedPatient.adherence || 73}%` },
        { label: 'Concern', value: 'Metformin missed 3x this week' },
        { label: 'Pattern', value: 'Declining (was 85% last week)' },
      ],
    },
    {
      id: 'meal-skips',
      icon: Utensils,
      label: 'Meal Patterns',
      status: 'medium',
      details: [
        { label: 'Skips This Week', value: '3 (Tue, Thu, Fri)' },
        { label: 'Recurring Pattern', value: 'Lunch, 12-1pm' },
        { label: 'Risk', value: 'Increased hypoglycemia risk' },
      ],
    },
    {
      id: 'appointment-adherence',
      icon: Calendar,
      label: 'Appointment Adherence',
      status: 'low',
      details: [
        { label: 'Next Appointment', value: 'March 22 (4 days)' },
        { label: 'Missed Appointments', value: '0 out of 12 (100%)' },
        { label: 'Status', value: 'On track' },
      ],
    },
    {
      id: 'activity-level',
      icon: Activity,
      label: 'Activity Level',
      status: 'medium',
      details: [
        { label: 'Avg Daily Steps', value: '6,200' },
        { label: 'Goal Attainment', value: '62% (below 80% threshold)' },
        { label: 'Trend', value: 'Declining (-500 steps/week)' },
      ],
    },
    {
      id: 'recent-engagement',
      icon: Clock,
      label: 'Patient Engagement',
      status: 'low',
      details: [
        { label: 'Last Data Entry', value: '2 hours ago' },
        { label: 'Logging Consistency', value: '8 of last 10 days' },
        { label: 'Status', value: 'Active participant' },
      ],
    },
  ]

  return (
    <div className="space-y-3">
      {indicators.map((indicator) => {
        const Icon = indicator.icon
        const statusColor =
          indicator.status === 'high'
            ? 'bg-danger-red-50 border-danger-red-200'
            : indicator.status === 'medium'
              ? 'bg-warning-orange-50 border-warning-orange-200'
              : 'bg-success-green-50 border-success-green-200'

        const statusBadgeColor =
          indicator.status === 'high'
            ? 'bg-danger-red-100 text-danger-red-700'
            : indicator.status === 'medium'
              ? 'bg-warning-orange-100 text-warning-orange-700'
              : 'bg-success-green-100 text-success-green-700'

        const statusLabel =
          indicator.status === 'high' ? 'At Risk' : indicator.status === 'medium' ? 'Monitor' : 'Healthy'

        return (
          <div key={indicator.id} className={clsx('rounded-lg border p-4', statusColor)}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Icon
                  size={20}
                  className={
                    indicator.status === 'high'
                      ? 'text-danger-red-600'
                      : indicator.status === 'medium'
                        ? 'text-warning-orange-600'
                        : 'text-success-green-600'
                  }
                />
                <h4 className="font-semibold text-sm text-slate-900">{indicator.label}</h4>
              </div>
              <span
                className={clsx('text-xs font-semibold px-2 py-1 rounded-full', statusBadgeColor)}
              >
                {statusLabel}
              </span>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {indicator.details.map((detail, idx) => (
                <div key={idx} className="flex justify-between text-xs">
                  <span className="text-slate-600">{detail.label}:</span>
                  <span className="font-medium text-slate-900">{detail.value}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
