import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks'
import { LogOut, Bell, MessageSquare, Calendar, Zap } from 'lucide-react'
import { useClinicianStore } from '../../store/clinicianStore'
import clsx from 'clsx'
import { useState } from 'react'

export default function Topbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout, isAuthenticated } = useAuth()
  const selectedPatient = useClinicianStore((state) => state.getSelectedPatient?.())
  const [showNotifications, setShowNotifications] = useState(false)
  const selectedRiskLevel = (selectedPatient?.risk_level || '').toString().toUpperCase()

  // Hide patient info on /patients page
  const showPatientInfo = selectedPatient && location.pathname !== '/patients'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleGenerateBrief = () => {
    if (selectedPatient) {
      navigate(`/doctor-briefs/${selectedPatient.patient_id}`)
    }
  }

  // Mock unreviewed briefs count
  const unreviewedBriefsCount = 2

  return (
    <div className="border-b border-slate-200 bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left: Patient Info */}
        <div className="flex items-center gap-4">
          {showPatientInfo ? (
            <div className="flex items-center gap-3">
              {/* Patient Avatar */}
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-info-blue-100 text-sm font-bold text-info-blue-700">
                {selectedPatient.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .substring(0, 2)}
              </div>
              {/* Patient Details */}
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  {selectedPatient.name}
                </h2>
              </div>
              {/* Risk Badge */}
              <span
                className={clsx(
                  'text-xs font-medium px-2.5 py-1 rounded-full border',
                  selectedRiskLevel.toLowerCase() === 'high'
                    ? 'bg-danger-red-100 text-danger-red-700 border-danger-red-200'
                    : selectedRiskLevel.toLowerCase() === 'medium'
                      ? 'bg-warning-orange-100 text-warning-orange-700 border-warning-orange-200'
                      : 'bg-success-green-100 text-success-green-700 border-success-green-200'
                )}
              >
                {selectedRiskLevel || 'N/A'} Risk
              </span>
            </div>
          ) : (
            <div className="text-sm text-slate-500"></div>
          )}
        </div>

        {/* Right: Actions & Profile */}
        {isAuthenticated && (
          <div className="flex items-center gap-3">
            {showPatientInfo && (
              <>
                {/* Generate Brief Button */}
                <button
                  onClick={handleGenerateBrief}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-info-blue-600 bg-info-blue-50 hover:bg-info-blue-100 border border-info-blue-200 transition-colors"
                  title="Generate AI doctor brief"
                >
                  <Zap size={16} />
                  Brief
                </button>

                {/* Message Button */}
                <button
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
                  title="Send message to patient"
                >
                  <MessageSquare size={16} />
                  Message
                </button>

                {/* Schedule Button */}
                <button
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
                  title="Schedule appointment"
                >
                  <Calendar size={16} />
                  Schedule
                </button>
              </>
            )}

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative flex items-center justify-center h-10 w-10 rounded-lg hover:bg-slate-100 transition-colors"
                title="Notifications"
              >
                <Bell size={18} className="text-slate-600" />
                {unreviewedBriefsCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-danger-red-600 text-xs font-bold text-white">
                    {unreviewedBriefsCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 rounded-lg border border-slate-200 bg-white shadow-lg z-50">
                  <div className="p-4 border-b border-slate-100">
                    <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {unreviewedBriefsCount > 0 ? (
                      <>
                        <div className="p-3 hover:bg-slate-50 border-b border-slate-100 cursor-pointer transition-colors">
                          <div className="flex items-start gap-3">
                            <div className="flex h-2 w-2 rounded-full bg-info-blue-600 mt-1.5 flex-shrink-0"></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900">
                                Unreviewed Doctor Briefs
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                {unreviewedBriefsCount} briefs ready for review
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="p-4 text-center text-sm text-slate-500">
                        No new notifications
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile & Logout */}
            <div className="border-l border-slate-200 pl-3">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 transition-colors"
                title="Sign out"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
