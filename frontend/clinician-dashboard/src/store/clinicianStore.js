import { create } from 'zustand'
import * as clinicianApi from '../api/clinician'

/**
 * Zustand store for all clinician portal state
 */
export const useClinicianStore = create((set, get) => ({
  // Auth State
  auth: {
    token: localStorage.getItem('clinician_token'),
    clinician: null,
    isLoading: false,
    error: null
  },

  // Patient State
  patients: {
    list: [],
    selectedId: null,
    isLoading: false,
    error: null
  },

  // Data State (for selected patient)
  data: {
    glucose: null,
    medication: null,
    meals: null,
    exercise: null,
    appointments: null,
    brief: null,
    isLoading: false,
    error: null
  },

  // UI State
  ui: {
    sidebarOpen: true,
    selectedTab: 'overview',
    modals: {
      rescheduleOpen: false,
      cancelOpen: false,
      briefOpen: false
    }
  },

  // Actions
  actions: {
    setToken: (token) => {
      localStorage.setItem('clinician_token', token)
      set((state) => ({
        auth: { ...state.auth, token }
      }))
    },

    fetchPatients: async () => {
      set((state) => ({
        patients: { ...state.patients, isLoading: true, error: null }
      }))
      try {
        const data = await clinicianApi.getAssignedPatients()
        set((state) => ({
          patients: {
            ...state.patients,
            list: data.patients,
            isLoading: false
          }
        }))
      } catch (error) {
        set((state) => ({
          patients: { ...state.patients, error: error.message, isLoading: false }
        }))
      }
    },

    selectPatient: (patientId) => {
      set((state) => ({
        patients: { ...state.patients, selectedId: patientId }
      }))
    },

    fetchPatientData: async (patientId, dataType = 'all') => {
      set((state) => ({
        data: { ...state.data, isLoading: true, error: null }
      }))
      try {
        const results = {}
        if (dataType === 'all' || dataType === 'glucose') {
          results.glucose = await clinicianApi.getGlucoseTrend(patientId)
        }
        if (dataType === 'all' || dataType === 'medication') {
          results.medication = await clinicianApi.getMedicationData(patientId)
        }
        if (dataType === 'all' || dataType === 'meals') {
          results.meals = await clinicianApi.getMealData(patientId)
        }
        if (dataType === 'all' || dataType === 'exercise') {
          results.exercise = await clinicianApi.getExerciseData(patientId)
        }
        if (dataType === 'all' || dataType === 'appointments') {
          results.appointments = await clinicianApi.getAppointments(patientId)
        }
        if (dataType === 'all' || dataType === 'brief') {
          results.brief = await clinicianApi.getDoctorBrief(patientId)
        }

        set((state) => ({
          data: {
            ...state.data,
            ...results,
            isLoading: false
          }
        }))
      } catch (error) {
        set((state) => ({
          data: { ...state.data, error: error.message, isLoading: false }
        }))
      }
    },

    toggleSidebar: () => {
      set((state) => ({
        ui: { ...state.ui, sidebarOpen: !state.ui.sidebarOpen }
      }))
    },

    setSelectedTab: (tab) => {
      set((state) => ({
        ui: { ...state.ui, selectedTab: tab }
      }))
    },

    openModal: (modalName) => {
      set((state) => ({
        ui: {
          ...state.ui,
          modals: { ...state.ui.modals, [modalName]: true }
        }
      }))
    },

    closeModal: (modalName) => {
      set((state) => ({
        ui: {
          ...state.ui,
          modals: { ...state.ui.modals, [modalName]: false }
        }
      }))
    }
  },

  // Selectors
  getSelectedPatient: () => {
    const state = get()
    return state.patients.list.find(p => p.patient_id === state.patients.selectedId)
  },

  getSelectedPatientData: () => {
    return get().data
  }
}))

export default useClinicianStore
