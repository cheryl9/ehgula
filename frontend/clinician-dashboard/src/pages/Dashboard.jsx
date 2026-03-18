import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useClinicianStore from '../store/clinicianStore'
import { Badge, LoadingSpinner } from '../components/ui'
import { getRiskColor } from '../utils/formatters'
import { Users } from 'lucide-react'

export default function Dashboard() {
  const navigate = useNavigate()
  const store = useClinicianStore()

  useEffect(() => {
    // Fetch patients on mount
    store.actions.fetchPatients()
  }, [])

  if (store.patients.isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const handleSelectPatient = (patientId) => {
    navigate(`/patients/${patientId}`)
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-2">Select a patient to view their overview and health data</p>
      </div>

      {/* Patient List */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <Users size={20} className="text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">Your Assigned Patients ({store.patients.list.length})</h2>
          </div>
        </div>

        <div className="divide-y divide-slate-200">
          {store.patients.list.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-600">
              No patients assigned yet.
            </div>
          ) : (
            store.patients.list.map((patient) => (
              <div
                key={patient.patient_id}
                onClick={() => handleSelectPatient(patient.patient_id)}
                className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-info-blue-100 flex items-center justify-center text-sm font-medium text-info-blue-700">
                      {patient.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{patient.name}</p>
                      <p className="text-sm text-slate-600">
                        {patient.age} years • {patient.condition}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 ml-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900">
                      Glucose: {patient.last_glucose} mmol/L
                    </p>
                    <p className="text-xs text-slate-600">Adherence: {patient.adherence}%</p>
                  </div>
                  <Badge
                    label={patient.risk_level}
                    variant={getRiskColor(patient.risk_level)}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
