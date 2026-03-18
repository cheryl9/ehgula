import { useState } from 'react'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import clsx from 'clsx'

/**
 * DoseLog - Dose history log with takenat/missed/held status
 * Shows: Date, Time, Medication, Dose, Status, Notes
 */
export default function DoseLog({ medicationData }) {
  const [filterDays, setFilterDays] = useState('7')

  const normalizeStatus = (value) => {
    const status = (value || '').toString().toLowerCase()
    if (status.includes('taken')) return 'taken'
    if (status.includes('missed')) return 'missed'
    if (status.includes('held') || status.includes('delay')) return 'held'
    return 'unknown'
  }

  const rawDoseLogs =
    (Array.isArray(medicationData?.dose_logs) && medicationData.dose_logs) ||
    (Array.isArray(medicationData?.dose_history) && medicationData.dose_history) ||
    []

  const now = new Date()
  const daysBack = Number(filterDays)
  const cutoff = new Date(now)
  cutoff.setDate(now.getDate() - (daysBack - 1))
  cutoff.setHours(0, 0, 0, 0)

  const doseLog = rawDoseLogs
    .map((row, idx) => {
      const ts = row.timestamp || row.taken_at || row.logged_at || row.date || null
      const parsedDate = ts ? new Date(ts) : null
      return {
        id: row.id || `dose-${idx}`,
        sortTs: parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.getTime() : 0,
        date: parsedDate && !Number.isNaN(parsedDate.getTime())
          ? parsedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })
          : (row.date || 'N/A'),
        time: parsedDate && !Number.isNaN(parsedDate.getTime())
          ? parsedDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
          : (row.time || row.scheduled_time || 'N/A'),
        medication: row.medication_name || row.medication || row.name || 'Unknown',
        dose: row.dose || 'N/A',
        status: normalizeStatus(row.status || row.action_type),
        notes: row.notes || row.reason || row.detail || '',
      }
    })
    .filter((row) => {
      if (!row.sortTs) return true
      return row.sortTs >= cutoff.getTime()
    })
    .sort((a, b) => b.sortTs - a.sortTs)

  const getStatusIcon = (status) => {
    switch (status) {
      case 'taken':
        return <CheckCircle className="text-success-green-600" size={18} />
      case 'missed':
        return <XCircle className="text-danger-red-600" size={18} />
      case 'held':
        return <AlertCircle className="text-warning-orange-600" size={18} />
      default:
        return null
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'taken':
        return 'bg-success-green-50 border-success-green-200'
      case 'missed':
        return 'bg-danger-red-50 border-danger-red-200'
      case 'held':
        return 'bg-warning-orange-50 border-warning-orange-200'
      default:
        return 'bg-slate-50 border-slate-200'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'taken':
        return 'Taken'
      case 'missed':
        return 'Missed'
      case 'held':
        return 'Held (Agent)'
      default:
        return 'Unknown'
    }
  }

  const aggregateSummary = Array.isArray(medicationData?.medications)
    ? medicationData.medications.reduce(
      (acc, med) => {
        acc.total += Number(med.total_doses || 0)
        acc.taken += Number(med.doses_taken || 0)
        acc.missed += Number(med.doses_missed || 0)
        acc.held += Number(med.doses_held_by_agent || 0)
        return acc
      },
      { total: 0, taken: 0, missed: 0, held: 0 }
    )
    : { total: 0, taken: 0, missed: 0, held: 0 }

  const tableSummary = {
    total: doseLog.length,
    taken: doseLog.filter((d) => d.status === 'taken').length,
    missed: doseLog.filter((d) => d.status === 'missed').length,
    held: doseLog.filter((d) => d.status === 'held').length,
  }

  const hasDoseRows = tableSummary.total > 0
  const summary = hasDoseRows ? tableSummary : aggregateSummary
  const summarySourceLabel = hasDoseRows ? 'Source: medication_dose_logs' : 'Source: medication aggregate totals'

  const takenPercent = summary.total > 0 ? ((summary.taken / summary.total) * 100).toFixed(0) : 0

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Dose History</h3>
          <p className="text-sm text-slate-600">{takenPercent}% doses taken • {summary.missed} missed • {summary.held} held by agent</p>
          <p className="text-xs text-slate-500 mt-1">{summarySourceLabel}</p>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2">
          {['7', '14', '30'].map((days) => (
            <button
              key={days}
              onClick={() => setFilterDays(days)}
              className={clsx(
                'px-3 py-1 text-sm font-medium rounded-lg transition-colors',
                filterDays === days
                  ? 'bg-info-blue-500 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              )}
            >
              {days}d
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 px-6 py-4 border-b border-slate-200 bg-slate-50">
        <div className="text-center">
          <p className="text-xs text-slate-600 mb-1">Total Doses</p>
          <p className="text-2xl font-bold text-slate-900">{summary.total}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-600 mb-1">Taken</p>
          <p className="text-2xl font-bold text-success-green-600">{summary.taken}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-600 mb-1">Missed</p>
          <p className="text-2xl font-bold text-danger-red-600">{summary.missed}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-600 mb-1">Held (Agent)</p>
          <p className="text-2xl font-bold text-warning-orange-600">{summary.held}</p>
        </div>
      </div>

      {/* Dose Log Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">Date</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">Time</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">Medication</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">Dose</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {doseLog.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-slate-600">
                  No dose history available from the current data source.
                </td>
              </tr>
            ) : (
              doseLog.map((dose) => (
                <tr key={dose.id} className={clsx('hover:bg-slate-50 transition-colors border-l-4', getStatusColor(dose.status))}>
                  <td className="px-6 py-3 text-sm font-medium text-slate-900">{dose.date}</td>
                  <td className="px-6 py-3 text-sm text-slate-700">{dose.time}</td>
                  <td className="px-6 py-3 text-sm font-medium text-slate-900">{dose.medication}</td>
                  <td className="px-6 py-3 text-sm text-slate-700">{dose.dose}</td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(dose.status)}
                      <span className="text-sm font-medium text-slate-900">{getStatusLabel(dose.status)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-600">{dose.notes || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
        <p className="text-sm text-slate-600">Showing {doseLog.length} doses from last {filterDays} days</p>
        <button className="text-info-blue-600 hover:text-info-blue-700 font-medium text-sm">
          ↓ Download CSV
        </button>
      </div>
    </div>
  )
}
