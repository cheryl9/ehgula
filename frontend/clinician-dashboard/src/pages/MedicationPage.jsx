import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { usePatient } from '../hooks'
import { LoadingSpinner } from '../components/ui'
import { AdherencePanel, DoseLog } from '../components/health'

export default function MedicationPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const patientId = id
  const { patient, data, isLoading, error } = usePatient(patientId, 'medication')

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <button
        onClick={() => navigate(`/patients/${patientId}`)}
        className="flex items-center gap-2 mb-6 text-info-blue-600 hover:text-info-blue-700 font-medium transition-colors"
      >
        <ArrowLeft size={18} />
        Back to Patient Overview
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Medication Adherence</h1>
        <p className="text-slate-600 mt-2">Patient: {patient?.name}</p>
        {error && <p className="mt-2 text-sm text-danger-red-700">{error}</p>}
      </div>

      {/* Adherence Panel */}
      <div className="mb-6">
        <AdherencePanel medicationData={data?.medication} />
      </div>

      {/* Dose Log */}
      <DoseLog medicationData={data?.medication} />
    </div>
  )
}
