import { useState } from 'react'
import { AlertCircle, AlertTriangle, Info, X } from 'lucide-react'
import clsx from 'clsx'
import { useNavigate } from 'react-router-dom'
import { useClinicianStore } from '../../store/clinicianStore'

/**
 * AlertBanner - Display clinical alerts and flags for patient
 * Can be dismissed (but data remains in DB)
 */
export default function AlertBanner({ alerts = [] }) {
  const navigate = useNavigate()
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set())
  const selectedPatient = useClinicianStore((state) => state.getSelectedPatient?.())

  const placeholderAlerts = [
    {
      id: 'placeholder-glucose-unstable',
      severity: 'danger',
      title: 'Glucose Unstable',
      description: '5 consecutive readings >9 mmol/L detected',
      action: selectedPatient
        ? { label: 'View Glucose', onClick: () => navigate(`/clinician/patients/${selectedPatient.patient_id}/glucose`) }
        : null,
    },
    {
      id: 'placeholder-adherence',
      severity: 'warning',
      title: 'Adherence Declining',
      description: 'Medication adherence trend needs review',
      action: selectedPatient
        ? { label: 'View Medication', onClick: () => navigate(`/clinician/patients/${selectedPatient.patient_id}/medication`) }
        : null,
    },
    {
      id: 'placeholder-meal-skip',
      severity: 'warning',
      title: 'Meal Skip Pattern',
      description: 'Irregular meal timing detected across recent logs',
      action: selectedPatient
        ? { label: 'View Nutrition', onClick: () => navigate(`/clinician/patients/${selectedPatient.patient_id}/nutrition`) }
        : null,
    },
  ]

  // Generate default alerts if none provided
  const defaultAlerts = []
  if (selectedPatient) {
    const glucose = Number(selectedPatient.last_glucose ?? 0)
    const adherence = Number(selectedPatient.adherence_pct ?? 0)

    if (glucose > 8) {
      defaultAlerts.push({
        id: 'glucose-unstable',
        severity: 'danger',
        title: 'Glucose Unstable',
        description: `Latest glucose ${glucose.toFixed(1)} mmol/L exceeds target range`,
        action: { label: 'View Glucose', onClick: () => navigate(`/clinician/patients/${selectedPatient.patient_id}/glucose`) },
      })
    }

    if (adherence < 80) {
      defaultAlerts.push({
        id: 'adherence-dropped',
        severity: adherence < 60 ? 'danger' : 'warning',
        title: 'Medication Adherence Declining',
        description: `Current adherence is ${Math.round(adherence)}%`,
        action: { label: 'View Medication', onClick: () => navigate(`/clinician/patients/${selectedPatient.patient_id}/medication`) },
      })
    }

    if (defaultAlerts.length === 0) {
      defaultAlerts.push({
        id: 'stable',
        severity: 'info',
        title: 'No Active Clinical Alerts',
        description: 'Latest available metrics are within expected range.',
      })
    }
  }

  const displayAlerts = alerts.length > 0
    ? alerts
    : defaultAlerts.length > 0
      ? defaultAlerts
      : placeholderAlerts
  const visibleAlerts = displayAlerts.filter((alert) => !dismissedAlerts.has(alert.id))

  const handleDismiss = (alertId) => {
    setDismissedAlerts((prev) => new Set([...prev, alertId]))
  }

  if (visibleAlerts.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      {visibleAlerts.map((alert) => {
        const Icon =
          alert.severity === 'danger'
            ? AlertTriangle
            : alert.severity === 'warning'
              ? AlertCircle
              : Info

        const bgColor =
          alert.severity === 'danger'
            ? 'bg-danger-red-50 border-danger-red-200'
            : alert.severity === 'warning'
              ? 'bg-warning-orange-50 border-warning-orange-200'
              : 'bg-info-blue-50 border-info-blue-200'

        const iconColor =
          alert.severity === 'danger'
            ? 'text-danger-red-600'
            : alert.severity === 'warning'
              ? 'text-warning-orange-600'
              : 'text-info-blue-600'

        const titleColor =
          alert.severity === 'danger'
            ? 'text-danger-red-900'
            : alert.severity === 'warning'
              ? 'text-warning-orange-900'
              : 'text-info-blue-900'

        return (
          <div
            key={alert.id}
            className={clsx(
              'rounded-lg border p-4 flex items-start gap-3',
              bgColor
            )}
          >
            {/* Icon */}
            <Icon className={clsx('flex-shrink-0 mt-0.5', iconColor)} size={20} />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className={clsx('font-semibold text-sm', titleColor)}>
                {alert.title}
              </h4>
              <p
                className={clsx(
                  'text-sm mt-1',
                  alert.severity === 'danger'
                    ? 'text-danger-red-700'
                    : alert.severity === 'warning'
                      ? 'text-warning-orange-700'
                      : 'text-info-blue-700'
                )}
              >
                {alert.description}
              </p>

              {/* Action Button */}
              {alert.action && (
                <button
                  onClick={alert.action.onClick}
                  className={clsx(
                    'text-xs font-medium mt-2 px-2 py-1 rounded transition-colors',
                    alert.severity === 'danger'
                      ? 'text-danger-red-700 hover:bg-danger-red-100'
                      : alert.severity === 'warning'
                        ? 'text-warning-orange-700 hover:bg-warning-orange-100'
                        : 'text-info-blue-700 hover:bg-info-blue-100'
                  )}
                >
                  {alert.action.label} →
                </button>
              )}
            </div>

            {/* Dismiss Button */}
            <button
              onClick={() => handleDismiss(alert.id)}
              className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors p-1"
              title="Dismiss alert"
            >
              <X size={16} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
