import { useNavigate } from 'react-router-dom'
import { Clock, AlertCircle } from 'lucide-react'
import clsx from 'clsx'
import { useClinicianStore } from '../store/clinicianStore'

/**
 * PatientCard - Individual patient card for sidebar patient list
 * Shows patient name, risk level, next appointment, and click to select
 */
export default function PatientCard({ patient, isSelected }) {
  const navigate = useNavigate()
  const selectPatient = useClinicianStore((state) => state.actions.selectPatient)
  const fetchPatientData = useClinicianStore((state) => state.actions.fetchPatientData)

  const handleClick = () => {
    selectPatient(patient.patient_id)
    fetchPatientData(patient.patient_id)
    navigate(`/dashboard/${patient.patient_id}`)
  }

  // Get risk level color
  const getRiskColor = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case 'high':
        return 'bg-danger-red-100 text-danger-red-700 border-danger-red-200'
      case 'medium':
        return 'bg-warning-orange-100 text-warning-orange-700 border-warning-orange-200'
      case 'low':
        return 'bg-success-green-100 text-success-green-700 border-success-green-200'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  // Get initials from name
  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const initials = getInitials(patient.name)
  const riskColor = getRiskColor(patient.risk_level)

  return (
    <button
      onClick={handleClick}
      className={clsx(
        'w-full rounded-lg p-3 text-left transition-all duration-200 border',
        isSelected
          ? 'bg-info-blue-50 border-info-blue-300 shadow-sm'
          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
      )}
    >
      {/* Header: Initials + Name + Risk Badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Avatar */}
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700 flex-shrink-0">
            {initials}
          </div>
          {/* Name */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{patient.name}</p>
          </div>
        </div>
        {/* Risk Badge */}
        <span className={clsx('text-xs font-medium px-2 py-1 rounded border flex-shrink-0', riskColor)}>
          {patient.risk_level || 'N/A'}
        </span>
      </div>

      {/* Next Appointment */}
      {patient.next_appointment ? (
        <div className="flex items-center gap-2 text-xs text-slate-600 mb-2">
          <Clock size={12} />
          <span className="truncate">{patient.next_appointment}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
          <AlertCircle size={12} />
          <span>No appointment scheduled</span>
        </div>
      )}

      {/* Quick Stats Row */}
      <div className="flex justify-between text-xs text-slate-600 border-t border-slate-100 pt-2">
        <span>Glucose: {patient.last_glucose || 'N/A'}</span>
        <span>Adherence: {patient.adherence || 'N/A'}%</span>
      </div>
    </button>
  )
}
