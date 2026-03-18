import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { usePatient } from '../hooks'
import { LoadingSpinner } from '../components/ui'
import { StepsChart, SittingLog, HeartRateSummary } from '../components/health'

export default function ExercisePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const patientId = id
  const { patient, isLoading } = usePatient(patientId)
  const [activeTab, setActiveTab] = useState('steps')

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
        <h1 className="text-3xl font-bold text-slate-900">Exercise & Activity</h1>
        <p className="text-slate-600 mt-2">Patient: {patient?.name}</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('steps')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'steps' ? 'border-info-blue-500 text-info-blue-600' : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Daily Steps
        </button>
        <button
          onClick={() => setActiveTab('sitting')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'sitting' ? 'border-info-blue-500 text-info-blue-600' : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Sitting Analysis
        </button>
        <button
          onClick={() => setActiveTab('heart')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'heart' ? 'border-info-blue-500 text-info-blue-600' : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Heart Rate
        </button>
      </div>

      {/* Content Sections */}
      {activeTab === 'steps' && <StepsChart />}
      {activeTab === 'sitting' && <SittingLog />}
      {activeTab === 'heart' && <HeartRateSummary />}
    </div>
  )
}
