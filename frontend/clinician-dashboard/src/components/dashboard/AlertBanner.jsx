import { useState } from 'react'
import { AlertCircle, AlertTriangle, Info, X } from 'lucide-react'
import clsx from 'clsx'
import { useNavigate } from 'react-router-dom'

/**
 * AlertBanner - Display clinical alerts and flags for patient
 * Can be dismissed (but data remains in DB)
 */
export default function AlertBanner({ alerts = [] }) {
  const navigate = useNavigate()
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set())

  // Generate default alerts if none provided
  const defaultAlerts = [
    {
      id: 'glucose-unstable',
      severity: 'danger',
      title: 'Glucose Unstable',
      description: '5 consecutive readings >9 mmol/L detected',
      action: { label: 'View Glucose', onClick: () => navigate('/glucose') },
    },
    {
      id: 'adherence-dropped',
      severity: 'warning',
      title: 'Adherence Declining',
      description: 'Metformin missed 3 times this week',
      action: { label: 'View Medication', onClick: () => navigate('/medication') },
    },
    {
      id: 'meal-pattern',
      severity: 'warning',
      title: 'Meal Skip Pattern',
      description: 'Lunch skipped on Tue/Thu for 3 weeks — fasting risk',
      action: { label: 'View Nutrition', onClick: () => navigate('/nutrition') },
    },
  ]

  const displayAlerts = alerts.length > 0 ? alerts : defaultAlerts
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
