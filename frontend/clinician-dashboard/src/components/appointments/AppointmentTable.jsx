import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { MOCK_PATIENT_APPOINTMENTS } from '../../api/dataProvider'
import UrgencyBadge from './UrgencyBadge'
import RescheduleModal from './RescheduleModal'
import CancelModal from './CancelModal'

export default function AppointmentTable({ filterUrgency = 'all', sortBy = 'date-desc' }) {
  const [appointments, setAppointments] = useState(MOCK_PATIENT_APPOINTMENTS)
  const [expandedId, setExpandedId] = useState(null)
  const [rescheduleId, setRescheduleId] = useState(null)
  const [cancelId, setCancelId] = useState(null)

  // Filter appointments
  const filteredAppointments = appointments.filter((apt) => {
    if (filterUrgency === 'all') return true
    if (filterUrgency === 'urgent') return apt.urgencyLevel === 'urgent'
    if (filterUrgency === 'soon') {
      const daysUntil = Math.ceil((apt.date - new Date()) / (1000 * 60 * 60 * 24))
      return daysUntil <= 7 && daysUntil >= 0 && apt.status === 'scheduled'
    }
    if (filterUrgency === 'routine') return apt.urgencyLevel === 'routine'
    return true
  })

  // Sort appointments
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    if (sortBy === 'date-desc') return b.date - a.date
    if (sortBy === 'date-asc') return a.date - b.date
    if (sortBy === 'urgency-high') return b.urgencyScore - a.urgencyScore
    return 0
  })

  const getStatusIcon = (status) => {
    const icons = {
      scheduled: '📅',
      completed: '✅',
      cancelled: '❌',
      rescheduled: '🔄'
    }
    return icons[status] || '📅'
  }

  const getDaysSince = (date) => {
    const now = new Date()
    const diff = Math.ceil((date - now) / (1000 * 60 * 60 * 24))
    if (diff < 0) return `${Math.abs(diff)} days ago`
    if (diff === 0) return 'TODAY'
    if (diff === 1) return 'Tomorrow'
    return `In ${diff} days`
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const handleReschedule = (apt) => {
    const updated = appointments.map((a) =>
      a.id === apt.id ? { ...a, status: 'rescheduled', date: new Date() } : a
    )
    setAppointments(updated)
    setRescheduleId(null)
  }

  const handleCancel = (apt) => {
    const updated = appointments.map((a) =>
      a.id === apt.id ? { ...a, status: 'cancelled' } : a
    )
    setAppointments(updated)
    setCancelId(null)
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Date & Time</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Clinic</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Doctor</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Type</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Urgency</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Status</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {sortedAppointments.map((apt) => (
              <tbody key={apt.id}>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-900">{formatDate(apt.date)}</div>
                    <div className="text-xs text-slate-500">{apt.time}</div>
                    <div className="text-xs text-info-blue-600 font-medium mt-1">{getDaysSince(apt.date)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-900">{apt.clinic}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-900">{apt.doctor}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-700 capitalize">{apt.type}</div>
                    {apt.autoBooked && (
                      <div className="text-xs text-warning-orange-600 font-medium">🤖 Auto-booked</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <UrgencyBadge level={apt.urgencyLevel} score={apt.urgencyScore} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getStatusIcon(apt.status)}</span>
                      <span className="text-sm text-slate-700 capitalize">{apt.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setExpandedId(expandedId === apt.id ? null : apt.id)}
                      className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-info-blue-600 hover:text-info-blue-700 hover:bg-info-blue-50 rounded transition-colors"
                    >
                      {expandedId === apt.id ? (
                        <>
                          <ChevronUp size={16} />
                          Collapse
                        </>
                      ) : (
                        <>
                          <ChevronDown size={16} />
                          Details
                        </>
                      )}
                    </button>
                  </td>
                </tr>

                {/* Expanded Row */}
                {expandedId === apt.id && (
                  <tr className="bg-slate-50">
                    <td colSpan="7" className="px-6 py-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-3">Appointment Details</h4>
                          <dl className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <dt className="text-slate-600">Reason:</dt>
                              <dd className="text-slate-900 font-medium">{apt.reason}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-slate-600">HbA1c:</dt>
                              <dd className="text-slate-900 font-medium">{apt.hba1c}%</dd>
                            </div>
                          </dl>
                        </div>

                        <div>
                          <h4 className="font-semibold text-slate-900 mb-3">Clinical Notes</h4>
                          <p className="text-sm text-slate-700 bg-white p-3 rounded border border-slate-200">
                            {apt.notes}
                          </p>
                        </div>

                        {apt.outcome && (
                          <div className="md:col-span-2">
                            <h4 className="font-semibold text-slate-900 mb-2">Outcome</h4>
                            <p className="text-sm text-slate-700 bg-white p-3 rounded border border-slate-200">
                              {apt.outcome}
                            </p>
                          </div>
                        )}

                        {apt.status === 'scheduled' && (
                          <div className="md:col-span-2 flex gap-3">
                            <button
                              onClick={() => setRescheduleId(apt.id)}
                              className="flex-1 px-4 py-2 bg-info-blue-600 text-white rounded-lg font-medium hover:bg-info-blue-700 transition-colors"
                            >
                              ✏️ Reschedule
                            </button>
                            <button
                              onClick={() => setCancelId(apt.id)}
                              className="flex-1 px-4 py-2 bg-danger-red-100 text-danger-red-700 rounded-lg font-medium hover:bg-danger-red-200 transition-colors"
                            >
                              ❌ Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            ))}
          </tbody>
        </table>
      </div>

      {sortedAppointments.length === 0 && (
        <div className="p-12 text-center">
          <p className="text-slate-600 text-lg">No appointments found matching your filters.</p>
        </div>
      )}

      {/* Modals */}
      {rescheduleId && (
        <RescheduleModal
          appointment={appointments.find((a) => a.id === rescheduleId)}
          onConfirm={handleReschedule}
          onClose={() => setRescheduleId(null)}
        />
      )}

      {cancelId && (
        <CancelModal
          appointment={appointments.find((a) => a.id === cancelId)}
          onConfirm={handleCancel}
          onClose={() => setCancelId(null)}
        />
      )}
    </div>
  )
}
