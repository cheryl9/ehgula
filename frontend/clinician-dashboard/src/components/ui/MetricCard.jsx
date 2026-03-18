import React from 'react'
import clsx from 'clsx'

/**
 * MetricCard - Displays a key clinical metric with value, trend, and interpretation
 * @param {string} title - Metric title (e.g., "Avg Glucose")
 * @param {string|number} value - Main value to display
 * @param {string} unit - Unit of measurement (e.g., "mmol/L")
 * @param {string} status - 'good', 'warning', 'danger'
 * @param {string} trend - 'up', 'down', 'stable'
 * @param {string} interpretation - Description of what this means
 */
export function MetricCard({ 
  title, 
  value, 
  unit, 
  status = 'good', 
  trend = 'stable', 
  interpretation 
}) {
  const statusColors = {
    good: 'border-medical-green-500 bg-medical-green-50',
    warning: 'border-warning-orange-500 bg-warning-orange-50',
    danger: 'border-danger-red-500 bg-danger-red-50',
  }

  const trendIcons = {
    up: '↑',
    down: '↓',
    stable: '→',
  }

  return (
    <div className={clsx('rounded-lg border-l-4 p-4', statusColors[status])}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{value}</span>
            <span className="text-sm text-slate-600">{unit}</span>
          </div>
        </div>
        <div className="text-2xl text-slate-400">{trendIcons[trend]}</div>
      </div>
      {interpretation && (
        <p className="mt-2 text-xs text-slate-600">{interpretation}</p>
      )}
    </div>
  )
}

export default MetricCard
