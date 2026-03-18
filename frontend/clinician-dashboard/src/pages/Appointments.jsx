import { useEffect, useMemo, useState } from 'react'
import { useClinicianStore } from '../store/clinicianStore'
import { getAllAppointments } from '../api/dataProvider'
import UrgencyBadge from '../components/appointments/UrgencyBadge'
import RescheduleModal from '../components/appointments/RescheduleModal'
import CancelModal from '../components/appointments/CancelModal'
import { ChevronDown, ChevronUp } from 'lucide-react'

export default function Appointments() {
  const store = useClinicianStore()
  const [appointments, setAppointments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [rescheduleId, setRescheduleId] = useState(null)
  const [cancelId, setCancelId] = useState(null)
  const [filterPatient, setFilterPatient] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('date-asc')

  useEffect(() => {
    if (!store.patients.list.length) {
      store.actions.fetchPatients()
    }
  }, [store])

  useEffect(() => {
    let isMounted = true

    const loadAppointments = async () => {
      setIsLoading(true)
      setError('')
      try {
        const data = await getAllAppointments()
        if (isMounted) {
          setAppointments(data)
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load appointments')
          setAppointments([])
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadAppointments()

    return () => {
      isMounted = false
    }
  }, [])

  const patientNameById = useMemo(
    () => new Map(store.patients.list.map((p) => [p.patient_id, p.name])),
    [store.patients.list]
  )

  const normalizedAppointments = useMemo(
    () => appointments.map((apt) => {
      const patientId = apt.patientId || apt.patient_id
      const urgencyScore = apt.urgencyScore ?? apt.urgency_score ?? 0

      return {
        ...apt,
        patientId,
        patientName: apt.patientName || patientNameById.get(patientId) || 'Unknown Patient',
        date: apt.date instanceof Date ? apt.date : new Date(apt.date),
        doctor: apt.doctor || apt.clinicianName || apt.clinician_name || 'Assigned Clinician',
        urgencyScore,
        urgencyLevel: apt.urgencyLevel || (urgencyScore >= 70 ? 'urgent' : 'routine'),
      }
    }),
    [appointments, patientNameById]
  )

  // Get unique patient names for filter
  const uniquePatients = ['all', ...new Set(normalizedAppointments.map(a => a.patientName))]

  // Filter appointments
  const filteredAppointments = normalizedAppointments.filter((apt) => {
    if (filterPatient !== 'all' && apt.patientName !== filterPatient) return false
    if (filterStatus !== 'all' && apt.status !== filterStatus) return false
    return true
  })

  // Sort appointments
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    if (sortBy === 'date-asc') return a.date - b.date
    if (sortBy === 'date-desc') return b.date - a.date
    if (sortBy === 'urgency-high') return b.urgencyScore - a.urgencyScore
    return 0
  })

  const getStatusIcon = (status) => {
    const icons = { scheduled: '📅', completed: '✅', cancelled: '❌', rescheduled: '🔄' }
    return icons[status] || '📅'
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getDaysSince = (date) => {
    const now = new Date()
    const diff = Math.ceil((date - now) / (1000 * 60 * 60 * 24))
    if (diff < 0) return `${Math.abs(diff)} days ago`
    if (diff === 0) return 'TODAY'
    if (diff === 1) return 'Tomorrow'
    return `In ${diff} days`
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
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">All Appointments</h1>
        <p className="text-slate-600 mt-2">Manage appointments across all patients</p>
        {error && <p className="mt-2 text-sm text-danger-red-700">{error}</p>}
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">Filter by Patient</label>
          <select
            value={filterPatient}
            onChange={(e) => setFilterPatient(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:border-slate-400 transition-colors"
          >
            {uniquePatients.map((name) => (
              <option key={name} value={name}>
                {name === 'all' ? 'All Patients' : name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">Filter by Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:border-slate-400 transition-colors"
          >
            <option value="all">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:border-slate-400 transition-colors"
          >
            <option value="date-asc">Date (Upcoming First)</option>
            <option value="date-desc">Date (Recent First)</option>
            <option value="urgency-high">Urgency (High First)</option>
          </select>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Patient</th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Date & Time</th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Clinic</th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Doctor</th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Urgency</th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Status</th>
              <th className="px-4 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wide">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading && (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-slate-600">
                  Loading appointments...
                </td>
              </tr>
            )}
            {sortedAppointments.map((apt) => (
              <>
                <tr key={apt.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4 text-sm">
                    <div className="font-medium text-slate-900">{apt.patientName}</div>
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <div className="font-medium text-slate-900">{formatDate(apt.date)}</div>
                    <div className="text-xs text-slate-500">{apt.time} • {getDaysSince(apt.date)}</div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-900">{apt.clinic}</td>
                  <td className="px-4 py-4 text-sm text-slate-900">{apt.doctor}</td>
                  <td className="px-4 py-4">
                    <UrgencyBadge level={apt.urgencyLevel} score={apt.urgencyScore} />
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span>{getStatusIcon(apt.status)}</span>
                      <span className="text-slate-700 capitalize">{apt.status}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={() => setExpandedId(expandedId === apt.id ? null : apt.id)}
                      className="inline-flex items-center justify-center p-1 text-info-blue-600 hover:text-info-blue-700 hover:bg-info-blue-50 rounded transition-colors"
                    >
                      {expandedId === apt.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </td>
                </tr>

                {/* Expanded Row */}
                {expandedId === apt.id && (
                  <tr key={`${apt.id}-detail`} className="bg-slate-50">
                    <td colSpan="7" className="px-4 py-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-3">Appointment Details</h4>
                          <dl className="space-y-3 text-sm">
                            <div>
                              <dt className="text-slate-600 font-medium">Reason:</dt>
                              <dd className="text-slate-900 mt-1">{apt.reason}</dd>
                            </div>
                            <div>
                              <dt className="text-slate-600 font-medium">Type:</dt>
                              <dd className="text-slate-900 mt-1 capitalize">{apt.type}</dd>
                            </div>
                            <div>
                              <dt className="text-slate-600 font-medium">Clinic:</dt>
                              <dd className="text-slate-900 mt-1">{apt.clinic}</dd>
                            </div>
                            {apt.autoBooked && (
                              <div>
                                <dt className="text-slate-600 font-medium">Auto-Booked:</dt>
                                <dd className="text-warning-orange-600 mt-1 font-medium">Yes 🤖</dd>
                              </div>
                            )}
                          </dl>
                        </div>

                        <div>
                          <h4 className="font-semibold text-slate-900 mb-3">Clinical Notes</h4>
                          <p className="text-sm text-slate-700 bg-white p-3 rounded border border-slate-200">
                            {apt.notes}
                          </p>
                        </div>

                        {apt.status === 'scheduled' && (
                          <div className="md:col-span-2 flex gap-3 pt-2">
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
              </>
            ))}
          </tbody>
        </table>

        {!isLoading && sortedAppointments.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-slate-600 text-lg">No appointments found matching your filters.</p>
          </div>
        )}
      </div>

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

