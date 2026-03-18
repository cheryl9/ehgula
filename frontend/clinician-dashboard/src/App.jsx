import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'

// Pages
import Patients from './pages/Patients'
import Appointments from './pages/Appointments'
import AppointmentsPage from './pages/AppointmentsPage'
import Reports from './pages/Reports'
import Login from './pages/Login'
import GlucosePage from './pages/GlucosePage'
import MedicationPage from './pages/MedicationPage'
import NutritionPage from './pages/NutritionPage'
import ExercisePage from './pages/ExercisePage'
import DoctorBriefsPage from './pages/DoctorBriefsPage'
import WeeklyDigestPage from './pages/WeeklyDigestPage'
import AnalyticsPage from './pages/AnalyticsPage'
import TriageBoard from './pages/TriageBoard'
import PatientOverviewPage from './pages/PatientOverviewPage'

// Components
import MainLayout from './components/layout/MainLayout'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  useEffect(() => {
    // Check if user needs to be redirected to login
    const token = localStorage.getItem('clinician_token')
    if (!token && window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
  }, [])

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/patients" element={<Patients />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/briefs" element={<DoctorBriefsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/triage" element={<TriageBoard />} />
          <Route path="/reports" element={<Reports />} />
          
          {/* Patient Detail Routes */}
          <Route path="/patients/:id" element={<PatientOverviewPage />} />
          <Route path="/patients/:id/appointments" element={<AppointmentsPage />} />
          <Route path="/patients/:id/digests" element={<WeeklyDigestPage />} />
          <Route path="/clinician/patients/:id/glucose" element={<GlucosePage />} />
          <Route path="/clinician/patients/:id/medication" element={<MedicationPage />} />
          <Route path="/clinician/patients/:id/nutrition" element={<NutritionPage />} />
          <Route path="/clinician/patients/:id/exercise" element={<ExercisePage />} />
          <Route path="/clinician/patients/:id/briefs" element={<DoctorBriefsPage />} />
          
          {/* Legacy routes for backward compatibility */}
          <Route path="/patient/:id/glucose" element={<GlucosePage />} />
          <Route path="/patient/:id/medication" element={<MedicationPage />} />
          <Route path="/patient/:id/nutrition" element={<NutritionPage />} />
          <Route path="/patient/:id/exercise" element={<ExercisePage />} />
          <Route path="/patient/:id/briefs" element={<DoctorBriefsPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/patients" replace />} />
      </Routes>
    </Router>
  )
}

export default App
