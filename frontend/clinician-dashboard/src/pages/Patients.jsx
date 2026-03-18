import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useClinicianStore from '../store/clinicianStore'
import { LoadingSpinner, Badge } from '../components/ui'
import { getRiskColor } from '../utils/formatters'
import { Search } from 'lucide-react'

export default function Patients() {
  const store = useClinicianStore()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    store.actions.fetchPatients()
  }, [])

  if (store.patients.isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Filter patients based on search
  const filteredPatients = store.patients.list.filter((patient) => {
    // Search filter - case insensitive name search
    const matchesSearch = patient.name.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesSearch
  })

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Patients</h1>
        <p className="text-slate-600 mt-2">Manage {filteredPatients.length} patients</p>
        {store.patients.error && (
          <p className="mt-2 text-sm text-danger-red-700">{store.patients.error}</p>
        )}
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-6">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-3 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by patient name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 hover:border-slate-400 focus:outline-none focus:border-info-blue-500 transition-colors"
          />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-slate-600">Patient</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-slate-600">Condition</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-slate-600">Glucose</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-slate-600">Adherence</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-slate-600">Risk</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-slate-600">Next Appt</th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-slate-600">
                  {searchQuery ? 'No patients found matching your search.' : 'No patients available.'}
                </td>
              </tr>
            ) : (
              filteredPatients.map((patient, idx) => (
                <tr key={patient.patient_id} className={`${idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'} hover:bg-info-blue-50 cursor-pointer transition-colors`} onClick={() => navigate(`/patients/${patient.patient_id}`)}>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{patient.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{patient.condition}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{patient.last_glucose} mmol/L</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{patient.adherence_pct}%</td>
                  <td className="px-6 py-4 text-sm">
                    <Badge label={(patient.risk_level || 'N/A').toUpperCase()} variant={getRiskColor(patient.risk_level)} />
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{patient.next_appointment_date}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
