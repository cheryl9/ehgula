/**
 * Mock Weekly Digest Data
 * Aggregated health summaries for each week
 */

export const MOCK_WEEKLY_DIGESTS = {
  digest_001: {
    id: 'digest_001',
    patientId: 'P001',
    patientName: 'David Tan',
    weekStart: new Date('2026-03-09'),
    weekEnd: new Date('2026-03-15'),
    avgGlucose: 7.3,
    previousWeekGlucose: 7.0,
    glucoseTrend: 'UP',
    adherence: 72,
    previousWeekAdherence: 75,
    adherenceTrend: 'DOWN',
    mealsMissed: 3,
    stepsAvg: 4500,
    stepsTrend: 'DOWN',
    healthStatus: 'NEEDS_ATTENTION',
    highlights: [
      'Glucose trending up',
      'Adherence declining',
      'Lunch-skip pattern continues'
    ]
  },
  digest_002: {
    id: 'digest_002',
    patientId: 'P001',
    patientName: 'David Tan',
    weekStart: new Date('2026-03-02'),
    weekEnd: new Date('2026-03-08'),
    avgGlucose: 7.0,
    previousWeekGlucose: 6.8,
    glucoseTrend: 'UP',
    adherence: 75,
    previousWeekAdherence: 78,
    adherenceTrend: 'DOWN',
    mealsMissed: 2,
    stepsAvg: 5200,
    stepsTrend: 'UP',
    healthStatus: 'FAIR',
    highlights: [
      'Slight glucose increase',
      'Activity week good',
      'Medication adherence fair'
    ]
  },
  digest_003: {
    id: 'digest_003',
    patientId: 'P002',
    patientName: 'Mary Lim',
    weekStart: new Date('2026-03-09'),
    weekEnd: new Date('2026-03-15'),
    avgGlucose: 6.2,
    previousWeekGlucose: 6.3,
    glucoseTrend: 'STABLE',
    adherence: 100,
    previousWeekAdherence: 100,
    adherenceTrend: 'STABLE',
    mealsMissed: 0,
    stepsAvg: 11500,
    stepsTrend: 'UP',
    healthStatus: 'EXCELLENT',
    highlights: [
      'Excellent glucose control',
      'Perfect medication adherence',
      'Exceeds activity goals'
    ]
  },
  digest_004: {
    id: 'digest_004',
    patientId: 'P003',
    patientName: 'Ahmad Razif',
    weekStart: new Date('2026-03-09'),
    weekEnd: new Date('2026-03-15'),
    avgGlucose: 8.4,
    previousWeekGlucose: 8.1,
    glucoseTrend: 'UP',
    adherence: 38,
    previousWeekAdherence: 45,
    adherenceTrend: 'DOWN',
    mealsMissed: 5,
    stepsAvg: 1800,
    stepsTrend: 'DOWN',
    healthStatus: 'CRITICAL',
    highlights: [
      'Low engagement worsening',
      'Poor medication adherence',
      'Minimal activity'
    ]
  }
};

export const getWeeklyDigestsByPatientId = (patientId) => {
  return Object.values(MOCK_WEEKLY_DIGESTS)
    .filter(digest => digest.patientId === patientId)
    .sort((a, b) => b.weekStart - a.weekStart);
};

export const getAllWeeklyDigests = () => {
  return Object.values(MOCK_WEEKLY_DIGESTS).sort((a, b) => b.weekStart - a.weekStart);
};

export const getStatusColor = (status) => {
  switch(status) {
    case 'CRITICAL': return 'bg-red-100 text-red-700 border-red-200';
    case 'NEEDS_ATTENTION': return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'FAIR': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'EXCELLENT': return 'bg-green-100 text-green-700 border-green-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};
