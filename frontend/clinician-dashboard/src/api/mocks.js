// Mock data for development prior to backend API completion
// WARNING: Using mock data because Nathan & Xavier have not completed their components yet

export const MOCK_PATIENTS = [
  {
    patient_id: 'P001',
    name: 'David Tan',
    age: 45,
    photo_url: null,
    risk_level: 'HIGH',
    risk_score: 85,
    condition: 'Type 2 Diabetes',
    last_glucose: 7.2,
    adherence_pct: 73,
    next_appointment_date: '2026-03-20',
    unreviewed_briefs_count: 1,
    last_updated: '2026-03-17T10:45:00Z'
  },
  {
    patient_id: 'P002',
    name: 'Mary Lim',
    age: 52,
    photo_url: null,
    risk_level: 'LOW',
    risk_score: 25,
    condition: 'Type 2 Diabetes',
    last_glucose: 6.1,
    adherence_pct: 100,
    next_appointment_date: '2026-04-15',
    unreviewed_briefs_count: 0,
    last_updated: '2026-03-17T11:00:00Z'
  },
  {
    patient_id: 'P003',
    name: 'Ahmad Razif',
    age: 38,
    photo_url: null,
    risk_level: 'MEDIUM',
    risk_score: 60,
    condition: 'Type 2 Diabetes',
    last_glucose: 8.5,
    adherence_pct: 55,
    next_appointment_date: '2026-03-25',
    unreviewed_briefs_count: 0,
    last_updated: '2026-03-16T09:30:00Z'
  },
  {
    patient_id: 'P004',
    name: 'Priya Nair',
    age: 34,
    photo_url: null,
    risk_level: 'HIGH',
    risk_score: 92,
    condition: 'Gestational Diabetes',
    last_glucose: 9.8,
    adherence_pct: 68,
    next_appointment_date: '2026-03-19',
    unreviewed_briefs_count: 2,
    last_updated: '2026-03-17T08:00:00Z'
  }
]

export const MOCK_GLUCOSE = {
  avg_glucose: 7.2,
  avg_glucose_7day: 7.1,
  avg_glucose_30day: 7.2,
  min_glucose: 3.8,
  max_glucose: 10.2,
  std_dev: 1.8,
  readings_below_3_8: 2,
  readings_above_9: 4,
  readings: [
    { timestamp: '2026-03-17T08:00:00Z', value_mmol: 7.2, type: 'fasting' },
    { timestamp: '2026-03-17T10:00:00Z', value_mmol: 6.8, type: 'post_meal' },
    { timestamp: '2026-03-17T12:00:00Z', value_mmol: 5.4, type: 'pre_meal' },
    { timestamp: '2026-03-17T13:00:00Z', value_mmol: 4.6, type: 'lunch_window' },
    { timestamp: '2026-03-17T15:00:00Z', value_mmol: 7.1, type: 'normal' },
    { timestamp: '2026-03-17T18:00:00Z', value_mmol: 6.9, type: 'pre_meal' },
    { timestamp: '2026-03-17T20:00:00Z', value_mmol: 7.3, type: 'post_meal' }
  ]
}

export const MOCK_MEDICATIONS = {
  overall_adherence_pct: 73,
  medications: [
    {
      medication_id: 'M001',
      name: 'Metformin',
      dose: '500mg',
      frequency: 'Twice daily',
      adherence_pct: 73,
      trend: 'declining',
      total_doses: 60,
      doses_taken: 44,
      doses_missed: 10,
      doses_held_by_agent: 6,
      held_reason_counts: { no_meal_detected: 6 }
    },
    {
      medication_id: 'M002',
      name: 'Glipizide',
      dose: '5mg',
      frequency: 'Once daily',
      adherence_pct: 100,
      trend: 'stable',
      total_doses: 30,
      doses_taken: 30,
      doses_missed: 0,
      doses_held_by_agent: 0,
      held_reason_counts: {}
    },
    {
      medication_id: 'M003',
      name: 'Rosuvastatin',
      dose: '10mg',
      frequency: 'Once daily',
      adherence_pct: 85,
      trend: 'stable',
      total_doses: 30,
      doses_taken: 25,
      doses_missed: 5,
      doses_held_by_agent: 0,
      held_reason_counts: {}
    }
  ]
}

export const MOCK_DOCTOR_BRIEF = {
  brief_id: 'B001',
  patient_id: 'P001',
  appointment_id: 'A001',
  generated_timestamp: '2026-03-17T11:30:00Z',
  executive_summary: 'Patient\'s glucose control has become unstable over the past 5 days. Identified pattern of lunch-time skipping (Tue/Thu). Recommend discussion of meal timing and medication adjustment.',
  glucose_trends: {
    last_30_days_avg: 7.2,
    instability_score: 'HIGH',
    pattern: 'Fasting normal, post-lunch dips below 4.5 on Tue/Thu',
    concern: '2 readings <3.8 this week (risk of hypoglycemia)'
  },
  medication_adherence: {
    overall_pct: 73,
    by_medication: [
      { name: 'Metformin', adherence_pct: 73, trend: 'declining', note: '3 missed doses this week' },
      { name: 'Glipizide', adherence_pct: 100, trend: 'perfect', note: 'No missed doses' }
    ]
  },
  key_concerns: [
    { priority: 1, concern: 'Glucose instability + fasting <3.8 risk', details: '2 readings <3.8 mmol/L this week' },
    { priority: 2, concern: 'Lunch-skipping pattern + medication timing', details: 'Recurrent skip on Tue/Thu overlapping with meetings' },
    { priority: 3, concern: 'Metformin adherence declining', details: 'Trending down to 73%, investigate barriers' }
  ],
  recommended_agenda: [
    'Discuss Tuesday/Thursday schedule — can meetings be moved?',
    'Explore alternative medication timing if lunch immovable',
    'Review recent Metformin misses — barriers?',
    'Consider CGM settings or timing tuning'
  ]
}
