// App-level constants

export const GLUCOSE_TARGETS = {
  min: 4.5,
  max: 8.0,
  danger_low: 3.8,
  danger_high: 10.0
}

export const MEDICATION_ADHERENCE_THRESHOLDS = {
  excellent: 95,
  good: 80,
  fair: 60,
  poor: 0
}

export const RISK_LEVELS = {
  HIGH: { label: 'High Risk', color: 'danger' },
  MEDIUM: { label: 'Medium Risk', color: 'warning' },
  LOW: { label: 'Low Risk', color: 'success' }
}

export const API_TIMEOUTS = {
  short: 5000,    // 5 seconds for simple queries
  medium: 10000,  // 10 seconds for data loads
  long: 30000     // 30 seconds for brief generation
}

export const PAGE_SIZES = {
  patients_list: 20,
  appointments: 10,
  glucose_readings: 100,
  dose_logs: 50
}

export const DATE_FORMAT = {
  short: 'dd MMM yyyy',
  full: 'dd MMMM yyyy HH:mm',
  time: 'HH:mm'
}

export const NAV_ITEMS = [
  { path: '/patients', label: 'Patients', icon: '👥' },
  { path: '/appointments', label: 'Appointments', icon: '📅' },
  { path: '/triage', label: 'Triage Board', icon: '🚨' },
  { path: '/briefs', label: 'Doctor Briefs', icon: '📋' },
  { path: '/analytics', label: 'Analytics', icon: '📈' }
]
