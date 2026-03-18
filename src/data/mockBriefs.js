/**
 * Mock Doctor Brief Data
 * Simulates pre-appointment AI-generated clinical briefs
 * Source: SEA-LION AI agent (Xavier responsibility)
 */

export const MOCK_BRIEFS = {
  patient_p001: {
    id: 'brief_001',
    patientId: 'p001',
    patientName: 'David Tan',
    appointmentId: 'apt_001',
    appointmentDate: new Date('2025-03-20T14:00:00'),
    generatedAt: new Date('2025-03-17T11:30:00'),
    generatedBy: 'Clinician: Dr. Sarah Lee',
    lastDataSync: new Date('2025-03-17T10:45:00'),
    
    executiveSummary: `Patient's glucose control has become unstable over the past 5 days. 
Identified pattern of lunch-time skipping (Tue/Thu). Recommend discussion of meal 
timing and medication adjustment.`,

    glucoseTrends: {
      last30DaysAvg: 7.2,
      targetAvg: 6.5,
      instabilityScore: 'HIGH',
      standardDeviation: 1.8,
      pattern: 'Fasting normal, post-lunch dips below 4.5 on Tue/Thu',
      concerns: [
        '2 readings <3.8 this week (risk of hypoglycemia)',
        'Spike to 9.2 on Friday evening',
        'High variability post-meals'
      ],
      readingsThisWeek: 27,
      targetReadingsThisWeek: 28
    },

    medicationAdherence: {
      overallPercentage: 86,
      medications: [
        {
          name: 'Metformin',
          adherencePercentage: 73,
          status: 'DECLINING',
          missedDoses: 3,
          note: '3 missed doses this week (down from 2 last week)'
        },
        {
          name: 'Glipizide',
          adherencePercentage: 100,
          status: 'PERFECT'
        },
        {
          name: 'Rosuvastatin',
          adherencePercentage: 85,
          status: 'GOOD'
        }
      ]
    },

    mealPatterns: {
      breakfast: {
        loggedPercentage: 90,
        pattern: 'Consistent 7:30 AM',
        status: 'GOOD'
      },
      lunch: {
        loggedPercentage: 43,
        pattern: 'Skipped on Tue/Thu (12:30-2pm meetings)',
        status: 'PROBLEM',
        confidence: 'HIGH CONFIDENCE lunch being skipped'
      },
      dinner: {
        loggedPercentage: 85,
        pattern: 'Mostly 6:30-7:00 PM',
        status: 'GOOD'
      },
      overallAssessment: 'Recurrent lunch skip on specific days (contextual issue, not motivation)'
    },

    exerciseActivity: {
      weeklySteps: 34500,
      targetSteps: 70000,
      weeklyGoalPercentage: 49,
      status: 'BELOW_TARGET',
      averageStepsPerDay: 4929,
      sittingHours: 8.2,
      concernDays: ['Monday', 'Wednesday', 'Friday']
    },

    keyConcerns: [
      {
        rank: 1,
        title: 'Glucose instability + fasting <3.8 risk',
        severity: 'HIGH',
        explanation: '2 readings below 3.8 mmol/L this week indicate hypoglycemia risk'
      },
      {
        rank: 2,
        title: 'Lunch-skipping pattern + medication timing',
        severity: 'HIGH',
        explanation: 'Pattern of skipping lunch on Tue/Thu overlaps with 12:30-2pm meetings'
      },
      {
        rank: 3,
        title: 'Metformin adherence declining',
        severity: 'MEDIUM',
        explanation: 'Trending down from previous weeks - investigate barriers'
      }
    ],

    recommendedAgenda: [
      'Discuss Tuesday/Thursday schedule — can meetings be moved?',
      'Explore alternative medication timing if lunch immovable',
      'Review recent Metformin misses — barriers?',
      'Consider CGM settings or timing tuning'
    ],

    alerts: [
      {
        type: 'HYPOGLYCEMIA_RISK',
        severity: 'CRITICAL',
        icon: '🔴',
        title: 'Hypoglycemia Risk',
        message: '2 readings <3.8 mmol/L this week — counsel on pre-meeting snacks'
      },
      {
        type: 'ADHERENCE_DROP',
        severity: 'WARNING',
        icon: '🟡',
        title: 'Adherence Drop',
        message: 'Metformin trending down — investigate compliance'
      },
      {
        type: 'MEAL_PATTERN',
        severity: 'WARNING',
        icon: '🟡',
        title: 'Meal Pattern Anomaly',
        message: 'Recurrent lunch skip on specific days — contextual issue'
      }
    ],

    personalNotes: '', // Clinician can add notes before visit
    version: 1,
  },

  patient_p002: {
    id: 'brief_002',
    patientId: 'p002',
    patientName: 'Mary Lim',
    appointmentId: 'apt_002',
    appointmentDate: new Date('2025-03-21T10:00:00'),
    generatedAt: new Date('2025-03-17T11:25:00'),
    generatedBy: 'Clinician: Dr. Sarah Lee',
    lastDataSync: new Date('2025-03-17T10:45:00'),
    
    executiveSummary: `Excellent diabetes management and medication adherence. Patient is meeting all 
health targets. Recommend maintenance visits every 3 months and continue current regimen.`,

    glucoseTrends: {
      last30DaysAvg: 6.3,
      targetAvg: 6.5,
      instabilityScore: 'LOW',
      standardDeviation: 0.8,
      pattern: 'Stable throughout day, minimal variability',
      concerns: [],
      readingsThisWeek: 28,
      targetReadingsThisWeek: 28
    },

    medicationAdherence: {
      overallPercentage: 99,
      medications: [
        {
          name: 'Metformin',
          adherencePercentage: 100,
          status: 'PERFECT'
        },
        {
          name: 'Lisinopril',
          adherencePercentage: 100,
          status: 'PERFECT'
        },
        {
          name: 'Atorvastatin',
          adherencePercentage: 97,
          status: 'EXCELLENT'
        }
      ]
    },

    mealPatterns: {
      breakfast: {
        loggedPercentage: 100,
        pattern: 'Consistent 7:00 AM',
        status: 'EXCELLENT'
      },
      lunch: {
        loggedPercentage: 100,
        pattern: 'Consistent 12:30 PM',
        status: 'EXCELLENT'
      },
      dinner: {
        loggedPercentage: 98,
        pattern: 'Consistent 6:00 PM',
        status: 'EXCELLENT'
      },
      overallAssessment: 'Outstanding meal logging and consistency'
    },

    exerciseActivity: {
      weeklySteps: 78000,
      targetSteps: 70000,
      weeklyGoalPercentage: 111,
      status: 'EXCEEDS_TARGET',
      averageStepsPerDay: 11143,
      sittingHours: 4.2,
      concernDays: []
    },

    keyConcerns: [],

    recommendedAgenda: [
      'Congratulate on excellent adherence and glucose control',
      'Discuss maintenance strategy and frequency of follow-ups',
      'Screen for complications (annual eye, foot, kidney checks)',
      'Adjust medication timing if needed for lifestyle changes'
    ],

    alerts: [
      {
        type: 'POSITIVE',
        severity: 'INFO',
        icon: '✅',
        title: 'Excellent Control',
        message: 'Patient is meeting all health targets - exemplary management'
      }
    ],

    personalNotes: '',
    version: 1,
  },

  patient_p003: {
    id: 'brief_003',
    patientId: 'p003',
    patientName: 'Ahmad Razif',
    appointmentId: 'apt_003',
    appointmentDate: new Date('2025-03-22T15:30:00'),
    generatedAt: new Date('2025-03-17T11:20:00'),
    generatedBy: 'Clinician: Dr. Sarah Lee',
    lastDataSync: new Date('2025-03-17T10:45:00'),
    
    executiveSummary: `Recently diagnosed patient with low engagement over past 2 weeks. 
Minimal data logging and low app usage. Education and motivation intervention recommended.`,

    glucoseTrends: {
      last30DaysAvg: 8.1,
      targetAvg: 6.5,
      instabilityScore: 'MODERATE',
      standardDeviation: 1.5,
      pattern: 'Insufficient data - only 8 readings in past 7 days',
      concerns: [
        'Low engagement with monitoring',
        'Readings trending upward',
        'No CGM data available'
      ],
      readingsThisWeek: 8,
      targetReadingsThisWeek: 28
    },

    medicationAdherence: {
      overallPercentage: 42,
      medications: [
        {
          name: 'Metformin',
          adherencePercentage: 50,
          status: 'POOR',
          missedDoses: 7,
          note: 'Scattered dosing pattern'
        },
        {
          name: 'Glipizide',
          adherencePercentage: 35,
          status: 'POOR',
          missedDoses: 13,
          note: 'Frequently forgotten'
        }
      ]
    },

    mealPatterns: {
      breakfast: {
        loggedPercentage: 20,
        pattern: 'Minimal logging',
        status: 'POOR'
      },
      lunch: {
        loggedPercentage: 15,
        pattern: 'Minimal logging',
        status: 'POOR'
      },
      dinner: {
        loggedPercentage: 18,
        pattern: 'Minimal logging',
        status: 'POOR'
      },
      overallAssessment: 'Patient not logging meals - needs education on importance'
    },

    exerciseActivity: {
      weeklySteps: 12500,
      targetSteps: 70000,
      weeklyGoalPercentage: 18,
      status: 'CRITICAL',
      averageStepsPerDay: 1786,
      sittingHours: 14.5,
      concernDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    },

    keyConcerns: [
      {
        rank: 1,
        title: 'Low engagement and app usage',
        severity: 'CRITICAL',
        explanation: 'Recently diagnosed but minimal data logging - needs motivation intervention'
      },
      {
        rank: 2,
        title: 'Low medication adherence',
        severity: 'HIGH',
        explanation: 'Only 42% overall adherence - unclear if side effects, forgetfulness, or lack of understanding'
      },
      {
        rank: 3,
        title: 'Sedentary lifestyle',
        severity: 'HIGH',
        explanation: 'Average 1,786 steps/day with excessive sitting (14.5 hrs)'
      }
    ],

    recommendedAgenda: [
      'Assess barriers to engagement - side effects? Understanding of disease?',
      'Diabetes education refresher - importance of monitoring and medication',
      'Discuss physical activity - start with achievable goals (e.g., 3,000 steps/day)',
      'Consider reminders/alarms for medication',
      'Schedule follow-up in 2 weeks to reassess'
    ],

    alerts: [
      {
        type: 'LOW_ENGAGEMENT',
        severity: 'CRITICAL',
        icon: '🔴',
        title: 'Patient Disengagement',
        message: 'Recently diagnosed but minimal app usage - intervention needed'
      },
      {
        type: 'POOR_ADHERENCE',
        severity: 'CRITICAL',
        icon: '🔴',
        title: 'Poor Medication Adherence',
        message: 'Only 42% adherence - investigate barriers'
      },
      {
        type: 'SEDENTARY',
        severity: 'WARNING',
        icon: '🟡',
        title: 'Sedentary Lifestyle',
        message: '1,786 steps/day average - need activity intervention'
      }
    ],

    personalNotes: '',
    version: 1,
  },

  patient_p004: {
    id: 'brief_004',
    patientId: 'p004',
    patientName: 'Priya Nair',
    appointmentId: 'apt_004',
    appointmentDate: new Date('2025-03-23T09:00:00'),
    generatedAt: new Date('2025-03-17T11:15:00'),
    generatedBy: 'Clinician: Dr. Sarah Lee',
    lastDataSync: new Date('2025-03-17T10:45:00'),
    
    executiveSummary: `High-risk pregnant patient with diabetes. Glucose control is borderline acceptable 
but trending upward. Close monitoring and frequent visits recommended. Coordinate with OB/GYN.`,

    glucoseTrends: {
      last30DaysAvg: 6.8,
      targetAvg: 5.8, // Lower target for pregnancy
      instabilityScore: 'MODERATE',
      standardDeviation: 1.2,
      pattern: 'Trending upward over past 2 weeks',
      concerns: [
        'Above target for pregnancy',
        'Post-meal readings elevated',
        'Trending upward - may need medication adjustment'
      ],
      readingsThisWeek: 26,
      targetReadingsThisWeek: 28
    },

    medicationAdherence: {
      overallPercentage: 94,
      medications: [
        {
          name: 'Insulin (NPH)',
          adherencePercentage: 100,
          status: 'PERFECT',
          note: 'Pregnancy-safe formulation'
        },
        {
          name: 'Metformin',
          adherencePercentage: 88,
          status: 'GOOD',
          note: '1 missed dose this week'
        }
      ]
    },

    mealPatterns: {
      breakfast: {
        loggedPercentage: 95,
        pattern: 'Consistent 7:00 AM',
        status: 'EXCELLENT'
      },
      lunch: {
        loggedPercentage: 90,
        pattern: 'Mostly 12:30 PM - some variation',
        status: 'GOOD'
      },
      dinner: {
        loggedPercentage: 92,
        pattern: 'Consistent 6:30 PM',
        status: 'EXCELLENT'
      },
      overallAssessment: 'Good meal logging and timing - important for pregnancy management'
    },

    exerciseActivity: {
      weeklySteps: 28000,
      targetSteps: 42000, // Lower target for pregnancy
      weeklyGoalPercentage: 67,
      status: 'MODERATE',
      averageStepsPerDay: 4000,
      sittingHours: 9.5,
      concernDays: [],
      note: 'Appropriate activity level for pregnancy'
    },

    keyConcerns: [
      {
        rank: 1,
        title: 'Glucose above pregnancy target',
        severity: 'HIGH',
        explanation: 'Avg 6.8 vs target 5.8 - risk of fetal complications if not addressed'
      },
      {
        rank: 2,
        title: 'Upward glucose trend',
        severity: 'MEDIUM',
        explanation: 'Trending upward past 2 weeks - may need insulin adjustment'
      },
      {
        rank: 3,
        title: 'High-risk pregnancy status',
        severity: 'MEDIUM',
        explanation: 'Requires close coordination with OB/GYN and frequent monitoring'
      }
    ],

    recommendedAgenda: [
      'Review current insulin regimen - consider dose adjustment',
      'Discuss post-meal timing and portion control',
      'Coordinate with OB/GYN on any complications or concerns',
      'Screen for gestational complications (proteinuria, pre-eclampsia)',
      'Plan delivery timeline and post-partum follow-up',
      'Increase monitoring frequency to twice weekly'
    ],

    alerts: [
      {
        type: 'HIGH_RISK_PREGNANCY',
        severity: 'CRITICAL',
        icon: '🔴',
        title: 'High-Risk Pregnancy',
        message: 'Diabetes in pregnancy requires close monitoring - coordinate with OB/GYN'
      },
      {
        type: 'GLUCOSE_TRENDING_UP',
        severity: 'WARNING',
        icon: '🟡',
        title: 'Glucose Trending Upward',
        message: 'Glucose above pregnancy target - may need insulin adjustment'
      }
    ],

    personalNotes: '',
    version: 1,
  }
};

/**
 * Get brief by ID
 */
export const getBriefById = (briefId) => {
  return Object.values(MOCK_BRIEFS).find(brief => brief.id === briefId);
};

/**
 * Get briefs by patient ID
 */
export const getBriefsByPatientId = (patientId) => {
  return Object.values(MOCK_BRIEFS).filter(brief => brief.patientId === patientId);
};

/**
 * Get most recent brief for patient
 */
export const getLatestBriefByPatientId = (patientId) => {
  const briefs = getBriefsByPatientId(patientId);
  if (briefs.length === 0) return null;
  return briefs.sort((a, b) => b.generatedAt - a.generatedAt)[0];
};

/**
 * Get all briefs
 */
export const getAllBriefs = () => {
  return Object.values(MOCK_BRIEFS).sort((a, b) => b.generatedAt - a.generatedAt);
};
