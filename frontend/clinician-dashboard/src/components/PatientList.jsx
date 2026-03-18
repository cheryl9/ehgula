import { useState, useMemo } from 'react'
import { Search, AlertCircle } from 'lucide-react'
import PatientCard from './PatientCard'

/**
 * PatientList - Searchable patient list for sidebar
 * Allows filtering by name, ID, or risk level
 */
export default function PatientList({ patients, selectedPatientId, isLoading, error }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRisk, setFilterRisk] = useState('all') // all, high, medium, low

  // Filter and search patients
  const filteredPatients = useMemo(() => {
    if (!patients) return []

    return patients.filter((patient) => {
      // Search filter
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch =
        patient.name.toLowerCase().includes(searchLower) ||
        patient.patient_id.toLowerCase().includes(searchLower)

      // Risk level filter
      const matchesRisk =
        filterRisk === 'all' ||
        patient.risk_level?.toLowerCase() === filterRisk.toLowerCase()

      return matchesSearch && matchesRisk
    })
  }, [patients, searchTerm, filterRisk])

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-danger-red-50 border border-danger-red-200">
        <div className="flex gap-2">
          <AlertCircle className="text-danger-red-600 flex-shrink-0" size={16} />
          <p className="text-sm text-danger-red-700">{error}</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-lg bg-slate-100 animate-pulse"
          ></div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
        <input
          type="text"
          placeholder="Search patients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white placeholder-slate-400 text-slate-900 focus:outline-none focus:border-info-blue-300 focus:ring-1 focus:ring-info-blue-100"
        />
      </div>

      {/* Risk Filter Buttons */}
      <div className="flex gap-1 flex-wrap">
        {['all', 'high', 'medium', 'low'].map((risk) => (
          <button
            key={risk}
            onClick={() => setFilterRisk(risk)}
            className={`text-xs font-medium px-2 py-1 rounded border transition-colors ${
              filterRisk === risk
                ? risk === 'high'
                  ? 'bg-danger-red-100 border-danger-red-300 text-danger-red-700'
                  : risk === 'medium'
                    ? 'bg-warning-orange-100 border-warning-orange-300 text-warning-orange-700'
                    : risk === 'low'
                      ? 'bg-success-green-100 border-success-green-300 text-success-green-700'
                      : 'bg-slate-200 border-slate-300 text-slate-700'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            {risk.charAt(0).toUpperCase() + risk.slice(1)}
          </button>
        ))}
      </div>

      {/* Patient List */}
      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
        {filteredPatients.length === 0 ? (
          <div className="p-4 text-center text-sm text-slate-500">
            {patients.length === 0 ? 'No patients assigned' : 'No matching patients'}
          </div>
        ) : (
          filteredPatients.map((patient) => (
            <PatientCard
              key={patient.patient_id}
              patient={patient}
              isSelected={patient.patient_id === selectedPatientId}
            />
          ))
        )}
      </div>

      {/* Patient Count */}
      <div className="text-xs text-slate-500 text-center border-t border-slate-100 pt-2">
        Showing {filteredPatients.length} of {patients?.length || 0} patients
      </div>
    </div>
  )
}
