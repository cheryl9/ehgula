/**
 * Mock Population-Level Analytics Data
 * Cohort statistics and patient risk stratification
 */

export const MOCK_POPULATION_STATS = {
  cohortOverview: {
    totalPatients: 4,
    overallAdherence: 76,
    avgGlucose: 7.37,
    glucoseTarget: 6.5,
    patientsMetGoals: 1,
    avgStepsThisWeek: 6575,
    stepsGoal: 70000,
    weeklyAutoBookedAppointments: 2
  },

  atRiskPatients: [
    {
      rank: 1,
      patientId: 'P003',
      name: 'Ahmad Razif',
      riskScore: 92,
      riskLevel: 'CRITICAL',
      primaryConcern: 'Low engagement & poor adherence',
      adherence: 38,
      glucose: 8.4,
      appEngagement: 'Minimal (8 readings this week)',
      action: 'Schedule intervention - diabetes education'
    },
    {
      rank: 2,
      patientId: 'P001',
      name: 'David Tan',
      riskScore: 78,
      riskLevel: 'HIGH',
      primaryConcern: 'Unst able glucose + declining adherence',
      adherence: 72,
      glucose: 7.2,
      appEngagement: 'Regular (27 readings this week)',
      action: 'Urgent appointment - medication adjustment'
    },
    {
      rank: 3,
      patientId: 'P004',
      name: 'Priya Nair',
      riskScore: 68,
      riskLevel: 'HIGH',
      primaryConcern: 'Pregnancy complications - glucose trending up',
      adherence: 94,
      glucose: 6.8,
      appEngagement: 'Very good (26 readings this week)',
      action: 'Increase monitoring - coordinate with OB/GYN'
    }
  ],

  weeklyTrends: {
    adherenceTrend: [
      { week: 'Week 1', value: 72 },
      { week: 'Week 2', value: 74 },
      { week: 'Week 3', value: 75 },
      { week: 'Week 4', value: 76 }
    ],
    glucoseTrend: [
      { week: 'Week 1', value: 7.5 },
      { week: 'Week 2', value: 7.4 },
      { week: 'Week 3', value: 7.3 },
      { week: 'Week 4', value: 7.37 }
    ],
    exerciseTrend: [
      { week: 'Week 1', value: 55 },
      { week: 'Week 2', value: 62 },
      { week: 'Week 3', value: 58 },
      { week: 'Week 4', value: 61 }
    ]
  }
};

export const getAtRiskPatients = () => {
  return MOCK_POPULATION_STATS.atRiskPatients;
};

export const getCohortOverview = () => {
  return MOCK_POPULATION_STATS.cohortOverview;
};

export const getTrends = () => {
  return MOCK_POPULATION_STATS.weeklyTrends;
};
