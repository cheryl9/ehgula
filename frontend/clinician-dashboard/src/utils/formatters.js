/**
 * Format utilities for displaying data
 */

export const formatGlucose = (value) => {
  return `${value.toFixed(1)} mmol/L`
}

export const formatPercentage = (value) => {
  return `${Math.round(value)}%`
}

export const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-SG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export const formatTime = (timeString) => {
  const date = new Date(timeString)
  return date.toLocaleTimeString('en-SG', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const formatDatetime = (datetimeString) => {
  const date = new Date(datetimeString)
  return date.toLocaleString('en-SG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const getDaysSince = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

export const getRiskColor = (riskLevel) => {
  switch (riskLevel?.toUpperCase()) {
    case 'HIGH':
      return 'danger'
    case 'MEDIUM':
      return 'warning'
    case 'LOW':
      return 'success'
    default:
      return 'neutral'
  }
}

export const getGlucoseStatus = (value) => {
  if (value < 3.8) return 'danger'
  if (value < 4.5) return 'warning'
  if (value > 9) return 'warning'
  if (value > 10.5) return 'danger'
  return 'good'
}
