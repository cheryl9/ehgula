import { Phone, AlertCircle, Edit2 } from 'lucide-react'
import { useState } from 'react'
import { useClinicianStore } from '../../store/clinicianStore'

/**
 * PatientInfoCard - Display patient demographics and contact information
 * Shows: Name, DOB, age, condition, diagnosis date, clinician, emergency contact, etc.
 */
export default function PatientInfoCard() {
  const selectedPatient = useClinicianStore((state) => state.getSelectedPatient?.())
  const [isEditMode, setIsEditMode] = useState(false)

  if (!selectedPatient) {
    return null
  }

  const toReadableDate = (value) => {
    if (!value) return 'N/A'
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return value
    return parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
  }

  const patientInfo = {
    name: selectedPatient.name,
    dateOfBirth: 'N/A',
    age: selectedPatient.age ?? 'N/A',
    gender: selectedPatient.gender || 'N/A',
    condition: selectedPatient.condition || 'N/A',
    diagnosisDate: toReadableDate(selectedPatient.diagnosis_date),
    diseaseDuration: selectedPatient.diagnosis_date ? 'From diagnosis date' : 'N/A',
    clinician: 'Dr. Sarah Chen',
    emergencyContact: {
      phone: selectedPatient.emergency_contact || 'N/A',
    },
    preferredLanguage: selectedPatient.language_preference || 'N/A',
    lastClinicVisit: 'N/A',
    allergies: [],
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      {/* Header with Edit Button */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Patient Information</h2>
        <button
          onClick={() => setIsEditMode(!isEditMode)}
          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          title="Edit patient info"
        >
          <Edit2 size={16} />
          {isEditMode ? 'Cancel' : 'Edit'}
        </button>
      </div>

      {/* Main Info Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-6 pb-6 border-b border-slate-200">
        {/* Name */}
        <div>
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
            Full Name
          </p>
          <p className="text-sm font-medium text-slate-900">{patientInfo.name}</p>
        </div>

        {/* Date of Birth */}
        <div>
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
            Date of Birth
          </p>
          <p className="text-sm font-medium text-slate-900">{patientInfo.dateOfBirth}</p>
        </div>

        {/* Age */}
        <div>
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
            Age
          </p>
          <p className="text-sm font-medium text-slate-900">{patientInfo.age} years</p>
        </div>

        {/* Gender */}
        <div>
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
            Gender
          </p>
          <p className="text-sm font-medium text-slate-900">{patientInfo.gender}</p>
        </div>

        {/* Language */}
        <div>
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
            Preferred Language
          </p>
          <p className="text-sm font-medium text-slate-900">{patientInfo.preferredLanguage}</p>
        </div>
      </div>

      {/* Medical History */}
      <div className="mb-6 pb-6 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Medical History</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-slate-600 mb-1">Primary Condition</p>
            <p className="text-sm font-medium text-slate-900">{patientInfo.condition}</p>
          </div>
          <div>
            <p className="text-xs text-slate-600 mb-1">Diagnosis Date</p>
            <p className="text-sm font-medium text-slate-900">{patientInfo.diagnosisDate}</p>
          </div>
          <div>
            <p className="text-xs text-slate-600 mb-1">Duration</p>
            <p className="text-sm font-medium text-slate-900">{patientInfo.diseaseDuration}</p>
          </div>
          <div>
            <p className="text-xs text-slate-600 mb-1">Last Clinic Visit</p>
            <p className="text-sm font-medium text-slate-900">{patientInfo.lastClinicVisit}</p>
          </div>
        </div>
      </div>

      {/* Healthcare Team */}
      <div className="mb-6 pb-6 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Healthcare Team</h3>
        <div className="bg-info-blue-50 border border-info-blue-200 rounded-lg p-4">
          <p className="text-sm font-medium text-slate-900 mb-1">Primary Clinician</p>
          <p className="text-sm text-slate-700">{patientInfo.clinician}</p>
        </div>
      </div>

      {/* Contact Information */}
      <div className="mb-6 pb-6 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Emergency Contact</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Phone size={16} className="text-slate-400" />
            <div>
              <p className="text-xs text-slate-600">Relation - Phone</p>
              <p className="text-sm font-medium text-slate-900">
                {patientInfo.emergencyContact.phone}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Allergies */}
      {patientInfo.allergies.length > 0 && (
        <div className="bg-danger-red-50 border border-danger-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-danger-red-600 mt-0.5 flex-shrink-0" size={18} />
            <div>
              <h4 className="font-semibold text-sm text-danger-red-900 mb-2">Medication Allergies</h4>
              <ul className="space-y-1">
                {patientInfo.allergies.map((allergy, idx) => (
                  <li key={idx} className="text-sm text-danger-red-800">
                    • {allergy}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Edit Mode Placeholder */}
      {isEditMode && (
        <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-600 italic">
            Edit functionality coming in Phase 3.2. Contact information updates are restricted to
            admins.
          </p>
        </div>
      )}
    </div>
  )
}
