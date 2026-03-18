import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Heart, Clock } from 'lucide-react'
import { NAV_ITEMS } from '../../constants'
import clsx from 'clsx'
import { useClinicianStore } from '../../store/clinicianStore'
import { MOCK_ALL_APPOINTMENTS } from '../../api/dataProvider'

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const patients = useClinicianStore((state) => state.patients.list)
  const patientsLoading = useClinicianStore((state) => state.patients.isLoading)

  // Get upcoming appointments sorted by date
  const getUpcomingAppointments = () => {
    const now = new Date()
    const upcoming = MOCK_ALL_APPOINTMENTS.filter((apt) => apt.date > now && apt.status === 'scheduled')
    return upcoming.sort((a, b) => a.date - b.date).slice(0, 5) // Show only 5 nearest
  }

  const upcomingAppointments = getUpcomingAppointments()

  const formatAppointmentDate = (date) => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="w-64 border-r border-slate-200 bg-white flex flex-col h-full overflow-hidden flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 p-4 border-b border-slate-200 flex-shrink-0">
        <Heart className="text-danger-red-600" size={32} />
        <div>
          <h1 className="text-xl font-bold text-slate-900">ehgula</h1>
          <p className="text-xs text-slate-500">Clinician Portal</p>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="px-4 py-4 space-y-2 flex-shrink-0 border-b border-slate-200">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path ||
                          location.pathname.startsWith(item.path + '/')
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={clsx(
                'block rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-info-blue-100 text-info-blue-700'
                  : 'text-slate-600 hover:bg-slate-100'
              )}
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Upcoming Appointments Section */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
          Upcoming Appointments
        </h3>
        {patientsLoading ? (
          <div className="text-xs text-slate-500">Loading...</div>
        ) : upcomingAppointments.length === 0 ? (
          <div className="text-xs text-slate-500">No upcoming appointments</div>
        ) : (
          <div className="space-y-2">
            {upcomingAppointments.map((apt) => (
              <div
                key={apt.id}
                onClick={() => navigate(`/patients/${apt.patientId}/appointments`)}
                className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-info-blue-50 hover:border-info-blue-200 cursor-pointer transition-colors text-left"
              >
                <div className="flex items-start gap-2">
                  <Clock size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-900 truncate">{apt.patientName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{formatAppointmentDate(apt.date)}</p>
                    <p className="text-xs text-slate-500">{apt.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-600 flex-shrink-0">
        <p className="font-medium mb-1">Version</p>
        <p>Phase 2 - Navigation</p>
      </div>
    </div>
  )
}
