/**
 * Mock Appointment Data
 * Structure designed to mirror backend API response
 * Easy to replace with real API calls later
 */

export const MOCK_PATIENT_APPOINTMENTS = [
  {
    id: 'apt-001',
    date: new Date('2026-03-25'),
    time: '09:00',
    clinic: 'City Diabetes Center',
    doctor: 'Dr. Sarah Johnson',
    type: 'routine',
    autoBooked: false,
    urgencyScore: 35,
    urgencyLevel: 'routine',
    status: 'scheduled',
    reason: 'Regular follow-up',
    notes: 'Patient had stable glucose last visit. Continue current medication.',
    hba1c: 7.2,
    outcome: null
  },
  {
    id: 'apt-002',
    date: new Date('2026-03-20'),
    time: '14:30',
    clinic: 'Downtown Clinic',
    doctor: 'Dr. Michael Chen',
    type: 'urgent',
    autoBooked: true,
    urgencyScore: 82,
    urgencyLevel: 'urgent',
    status: 'scheduled',
    reason: 'Glucose unstable 5 days',
    notes: 'Auto-booked due to 5 consecutive glucose readings >9 mmol/L. Patient experiencing frequent hyperglycemic episodes.',
    hba1c: 8.1,
    outcome: null
  },
  {
    id: 'apt-003',
    date: new Date('2026-03-18'),
    time: '10:00',
    clinic: 'City Diabetes Center',
    doctor: 'Dr. Sarah Johnson',
    type: 'routine',
    autoBooked: false,
    urgencyScore: 28,
    urgencyLevel: 'routine',
    status: 'completed',
    reason: 'Regular check-in',
    notes: 'Patient reported good glucose control. Discussed meal timing strategies.',
    hba1c: 7.1,
    outcome: 'Glucose control improved, continue current plan'
  },
  {
    id: 'apt-004',
    date: new Date('2026-03-10'),
    time: '11:00',
    clinic: 'Downtown Clinic',
    doctor: 'Dr. Michael Chen',
    type: 'routine',
    autoBooked: false,
    urgencyScore: 40,
    urgencyLevel: 'routine',
    status: 'completed',
    reason: 'Medication review',
    notes: 'Reviewed Metformin adherence. Patient mentioned side effects.',
    hba1c: 7.4,
    outcome: 'Adjusted Metformin dose, scheduled follow-up in 2 weeks'
  }
]

// All appointments across all patients
export const MOCK_ALL_APPOINTMENTS = [
  {
    id: 'apt-001',
    patientId: 'P001',
    patientName: 'David Tan',
    date: new Date('2026-03-25'),
    time: '09:00',
    clinic: 'City Diabetes Center',
    doctor: 'Dr. Sarah Johnson',
    type: 'routine',
    autoBooked: false,
    urgencyScore: 35,
    urgencyLevel: 'routine',
    status: 'scheduled',
    reason: 'Regular follow-up',
    notes: 'Patient had stable glucose last visit. Continue current medication.'
  },
  {
    id: 'apt-002',
    patientId: 'P001',
    patientName: 'David Tan',
    date: new Date('2026-03-20'),
    time: '14:30',
    clinic: 'Downtown Clinic',
    doctor: 'Dr. Michael Chen',
    type: 'urgent',
    autoBooked: true,
    urgencyScore: 82,
    urgencyLevel: 'urgent',
    status: 'scheduled',
    reason: 'Glucose unstable 5 days',
    notes: 'Auto-booked due to 5 consecutive glucose readings >9 mmol/L.'
  },
  {
    id: 'apt-003',
    patientId: 'P002',
    patientName: 'Mary Lim',
    date: new Date('2026-03-22'),
    time: '10:30',
    clinic: 'City Diabetes Center',
    doctor: 'Dr. Sarah Johnson',
    type: 'routine',
    autoBooked: false,
    urgencyScore: 28,
    urgencyLevel: 'routine',
    status: 'scheduled',
    reason: 'Routine check-in',
    notes: 'Patient reported good glucose control.'
  },
  {
    id: 'apt-004',
    patientId: 'P002',
    patientName: 'Mary Lim',
    date: new Date('2026-03-18'),
    time: '11:00',
    clinic: 'Downtown Clinic',
    doctor: 'Dr. Michael Chen',
    type: 'routine',
    autoBooked: false,
    urgencyScore: 40,
    urgencyLevel: 'routine',
    status: 'completed',
    reason: 'Medication review',
    notes: 'Reviewed Metformin adherence.'
  }
]
