/**
 * Centralized Mock Data Exports
 * All mock data for the application is organized here for easy access
 * This enables seamless migration to real API calls later
 */

// Appointment data
export {
  MOCK_PATIENT_APPOINTMENTS,
  MOCK_ALL_APPOINTMENTS
} from './mockAppointments'

// Exercise & Activity data
export {
  MOCK_STEPS,
  MOCK_SITTING,
  MOCK_HEART_RATE,
  HR_ZONES
} from './mockExercise'

// Meal & Nutrition data
export {
  MOCK_MEAL_DATA,
  calculateMealAdherence,
  MEAL_PATTERNS
} from './mockMeals'
