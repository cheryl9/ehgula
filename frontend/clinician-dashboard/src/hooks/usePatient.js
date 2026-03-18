import { useEffect } from 'react'
import useClinicianStore from '../store/clinicianStore'

/**
 * usePatient hook - Manage selected patient and fetch patient data
 */
export function usePatient(patientId, dataType = 'all') {
  const store = useClinicianStore()

  // Select patient when ID changes
  useEffect(() => {
    if (patientId) {
      store.actions.selectPatient(patientId)
      store.actions.fetchPatientData(patientId, dataType)
    }
  }, [patientId, dataType, store.actions])

  return {
    patient: store.getSelectedPatient?.(),
    data: store.getSelectedPatientData?.(),
    isLoading: store.data.isLoading,
    error: store.data.error
  }
}

export default usePatient
