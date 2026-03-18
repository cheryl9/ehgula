import { useState } from 'react'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import clsx from 'clsx'

/**
 * DoseLog - Dose history log with takenat/missed/held status
 * Shows: Date, Time, Medication, Dose, Status, Notes
 */
export default function DoseLog() {
  const [filterDays, setFilterDays] = useState('7')

  // Mock dose log data
  const generateDoseLog = (days) => {
    const log = []
    const medications = [
      { name: 'Metformin', dose: '500mg' },
      { name: 'Glipizide', dose: '5mg' },
      { name: 'Rosuvastatin', dose: '10mg' },
      { name: 'Aspirin', dose: '81mg' },
    ]

    const today = new Date()
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })

      // Morning dose
      log.push({
        id: `${i}-morning`,
        date: dateStr,
        time: '8:00 AM',
        medication: 'Metformin',
        dose: '500mg',
        status: Math.random() > 0.15 ? 'taken' : Math.random() > 0.5 ? 'missed' : 'held',
        notes: (Math.random() > 0.8 && 'Patient was in meeting') || '',
      })

      // Evening dose (selected meds only)
      if (Math.random() > 0.3) {
        log.push({
          id: `${i}-evening`,
          date: dateStr,
          time: '6:00 PM',
          medication: 'Metformin',
          dose: '500mg',
          status: Math.random() > 0.1 ? 'taken' : 'missed',
          notes: Math.random() > 0.9 ? 'Late dose' : '',
        })
      }
    }

    return log.sort((a, b) => new Date(b.date) - new Date(a.date))
  }

  const doseLog = generateDoseLog(parseInt(filterDays))

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

  // Summary statistics
  const summary = {
    total: doseLog.length,
    taken: doseLog.filter((d) => d.status === 'taken').length,
    missed: doseLog.filter((d) => d.status === 'missed').length,
    held: doseLog.filter((d) => d.status === 'held').length,
  }

  const takenPercent = ((summary.taken / summary.total) * 100).toFixed(0)

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Dose History</h3>
          <p className="text-sm text-slate-600">{takenPercent}% doses taken • {summary.missed} missed • {summary.held} held by agent</p>
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
                  No dose history available
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
