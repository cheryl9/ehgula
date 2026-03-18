import React from 'react'
import clsx from 'clsx'

/**
 * Badge - Small label with status indicator
 * @param {string} label - Text to display
 * @param {string} variant - 'success', 'warning', 'danger', 'info', 'neutral'
 * @param {boolean} small - Smaller badge
 */
export function Badge({ 
  label, 
  variant = 'neutral',
  small = false
}) {
  const variantStyles = {
    success: 'bg-medical-green-100 text-medical-green-800 border border-medical-green-300',
    warning: 'bg-warning-orange-100 text-warning-orange-800 border border-warning-orange-300',
    danger: 'bg-danger-red-100 text-danger-red-800 border border-danger-red-300',
    info: 'bg-info-blue-100 text-info-blue-800 border border-info-blue-300',
    neutral: 'bg-slate-100 text-slate-700 border border-slate-300',
  }

  return (
    <span className={clsx(
      'inline-block rounded-full font-medium',
      small ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm',
      variantStyles[variant]
    )}>
      {label}
    </span>
  )
}

export default Badge
