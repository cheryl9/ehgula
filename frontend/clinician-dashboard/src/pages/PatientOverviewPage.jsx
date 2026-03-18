import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { usePatient } from '../hooks'
import { LoadingSpinner } from '../components/ui'
import MetricsRow from '../components/dashboard/MetricsRow'
import AlertBanner from '../components/dashboard/AlertBanner'
import RiskIndicators from '../components/dashboard/RiskIndicators'
import PatientInfoCard from '../components/dashboard/PatientInfoCard'

export default function PatientOverviewPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const patientId = id
  const { patient, isLoading } = usePatient(patientId)

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate('/patients')}
          className="mb-6 flex items-center gap-2 text-info-blue-600 hover:text-info-blue-700 font-medium"
        >
          <ArrowLeft size={18} />
          Back to Patients
        </button>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-slate-600">Patient not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/patients')}
        className="mb-6 flex items-center gap-2 text-info-blue-600 hover:text-info-blue-700 font-medium"
      >
        <ArrowLeft size={18} />
        Back to Patients
      </button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Patient Overview</h1>
        <p className="text-slate-600 mt-2">Patient: {patient?.name}</p>
      </div>

      {/* Content */}
      <div className="space-y-8">
        {/* Part 1: Metrics Row */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Key Metrics</h2>
          <MetricsRow />
        </div>

        {/* Part 2: Alerts & Warnings */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Clinical Alerts</h2>
          <AlertBanner />
        </div>

        {/* Part 3: Main Content Area - Risk Indicators + Patient Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Risk Indicators (2/3 width) */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Risk Assessment</h2>
            <RiskIndicators />
          </div>

          {/* Right: Patient Info (1/3 width) */}
          <div className="lg:col-span-1">
            <PatientInfoCard />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <button
            onClick={() => navigate(`/clinician/patients/${patient.patient_id}/glucose`)}
            className="rounded-lg border border-slate-200 bg-white p-4 hover:shadow-md hover:border-info-blue-200 transition-all cursor-pointer text-left"
          >
            <h3 className="font-medium text-slate-900 mb-2">📊 View Full Glucose Chart</h3>
            <p className="text-sm text-slate-600">7, 14, or 30-day glucose trends</p>
          </button>
          <button
            onClick={() => navigate(`/clinician/patients/${patient.patient_id}/medication`)}
            className="rounded-lg border border-slate-200 bg-white p-4 hover:shadow-md hover:border-info-blue-200 transition-all cursor-pointer text-left"
          >
            <h3 className="font-medium text-slate-900 mb-2">💊 Medication Adherence</h3>
            <p className="text-sm text-slate-600">Review dose logs and patterns</p>
          </button>
          <button
            onClick={() => navigate(`/clinician/patients/${patient.patient_id}/nutrition`)}
            className="rounded-lg border border-slate-200 bg-white p-4 hover:shadow-md hover:border-info-blue-200 transition-all cursor-pointer text-left"
          >
            <h3 className="font-medium text-slate-900 mb-2">🍽️ Nutrition & Meals</h3>
            <p className="text-sm text-slate-600">View meal skip patterns and analysis</p>
          </button>
          <button
            onClick={() => navigate(`/clinician/patients/${patient.patient_id}/exercise`)}
            className="rounded-lg border border-slate-200 bg-white p-4 hover:shadow-md hover:border-info-blue-200 transition-all cursor-pointer text-left"
          >
            <h3 className="font-medium text-slate-900 mb-2">🏃 Exercise & Activity</h3>
            <p className="text-sm text-slate-600">View steps, sitting, heart rate metrics</p>
          </button>
          <button
            onClick={() => navigate(`/patients/${patient.patient_id}/appointments`)}
            className="rounded-lg border border-slate-200 bg-white p-4 hover:shadow-md hover:border-info-blue-200 transition-all cursor-pointer text-left"
          >
            <h3 className="font-medium text-slate-900 mb-2">📅 Appointments</h3>
            <p className="text-sm text-slate-600">View history and schedule new visits</p>
          </button>
        </div>
      </div>
    </div>
  )
}
