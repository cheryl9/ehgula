import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText } from 'lucide-react'
import { usePatient } from '../hooks'
import { LoadingSpinner } from '../components/ui'
import { NextAppointmentSuggestion } from '../components/appointments'
import { getLatestBriefByPatientId } from '../api/dataProvider'
import DoctorBriefModal from '../components/brief/DoctorBriefModal'
import { useEffect, useState } from 'react'

export default function AppointmentsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const patientId = id
  const { patient, data, isLoading, error } = usePatient(patientId, 'appointments')
  const [selectedBrief, setSelectedBrief] = useState(null)
  const [isBriefModalOpen, setIsBriefModalOpen] = useState(false)
  const [latestBrief, setLatestBrief] = useState(null)
  const [isBriefLoading, setIsBriefLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const loadLatestBrief = async () => {
      setIsBriefLoading(true)
      try {
        const data = await getLatestBriefByPatientId(patientId || 'P001')
        if (isMounted) {
          setLatestBrief(data || null)
        }
      } catch {
        if (isMounted) {
          setLatestBrief(null)
        }
      } finally {
        if (isMounted) {
          setIsBriefLoading(false)
        }
      }
    }

    loadLatestBrief()

    return () => {
      isMounted = false
    }
  }, [patientId])

  const handleViewBrief = () => {
    if (latestBrief) {
      setSelectedBrief(latestBrief)
      setIsBriefModalOpen(true)
    }
  }

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
        <h1 className="text-3xl font-bold text-slate-900">Appointments</h1>
        <p className="text-slate-600 mt-2">Patient: {patient?.name}</p>
        {error && <p className="mt-2 text-sm text-danger-red-700">{error}</p>}
      </div>

      {/* Doctor Brief Section */}
      {!isBriefLoading && latestBrief && (
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Pre-Appointment Brief Available
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                AI-generated clinical summary with glucose trends, medication adherence, and recommendations.
              </p>
            </div>
            <button
              onClick={handleViewBrief}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium whitespace-nowrap"
            >
              View Brief
            </button>
          </div>
        </div>
      )}

      {/* Next Appointment Suggestion */}
      <div className="mb-8">
        <NextAppointmentSuggestion patientId={patientId} appointments={data?.appointments} patient={patient} />
      </div>

      {/* Brief Modal */}
      <DoctorBriefModal
        brief={selectedBrief}
        isOpen={isBriefModalOpen}
        onClose={() => {
          setIsBriefModalOpen(false)
          setSelectedBrief(null)
        }}
        onSave={(updatedBrief) => {
          console.log('Brief saved:', updatedBrief)
          // TODO: Save to backend
        }}
      />
    </div>
  )
}
