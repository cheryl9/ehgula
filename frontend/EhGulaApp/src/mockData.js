// src/mockData.js
// Comprehensive synthetic healthcare data for diabetes management demo
// Includes patient profile, medications, glucose readings, meals, calendar, exercise, and agent actions

// ─── Patient Profile ───────────────────────────────────────────────────────
export const mockPatient = {
  patient_id: 'P001',
  name: 'David Tan',
  age: 45,
  gender: 'Male',
  language_preference: 'English',
  ethnicity: 'Chinese',
  condition: 'Type 2 Diabetes',
  diagnosis_date: '2021-03-15',
  clinician_id: 'C001',
  clinician_name: 'Dr Tan Wei Ming',
  emergency_contact: 'Wife — +65 9123 4567',
  nric_last4: '456A',
  allergies: ['Penicillin'],
  conditions: ['Type 2 Diabetes', 'Hypertension'],
};

// ─── Medications ───────────────────────────────────────────────────────────
export const mockMedications = [
  {
    name: 'Metformin',
    dose: '500mg',
    frequency: 'Twice daily',
    scheduled_times: ['08:00', '13:00'],
    requires_food: true,
    min_food_gap_mins: 0,
    side_effects_if_empty: 'Nausea, vomiting',
  },
  {
    name: 'Glipizide',
    dose: '5mg',
    frequency: 'Once daily',
    scheduled_times: ['12:30'],
    requires_food: true,
    take_before_meal_mins: 30,
  },
  {
    name: 'Rosuvastatin',
    dose: '10mg',
    frequency: 'Once daily',
    scheduled_times: ['21:00'],
    requires_food: false,
  },
];

// ─── Glucose Readings (30 days with patterns) ─────────────────────────────
export const generateGlucoseReadings = () => {
  const readings = [];
  const base = new Date(2026, 2, 17); // March 17, 2026

  for (let day = 0; day < 30; day++) {
    const current = new Date(base);
    current.setDate(current.getDate() + day);
    const dayOfWeek = current.getDay(); // 0=Sun, 1=Mon, 2=Tue, etc.
    const isSkipDay = dayOfWeek === 2 || dayOfWeek === 4; // Tuesday or Thursday

    // Reading times throughout the day (8am to 8pm, every 1-2 hours)
    const timeOffsets = [0, 2, 4, 5, 7, 9, 11, 13];
    
    for (const offset of timeOffsets) {
      const t = new Date(current);
      t.setHours(8 + offset, 0, 0);
      const isLunchWindow = offset >= 4 && offset <= 6;

      let value;
      if (isSkipDay && isLunchWindow) {
        // Dangerous dip on skip days (lunch not eaten)
        value = 3.8 + Math.random() * 0.7;
      } else if (offset < 2) {
        // Fasting reading
        value = 6.5 + Math.random() * 1.0;
      } else if (offset === 4 || offset === 5) {
        // Post-meal peak
        value = 8.0 + Math.random() * 1.5;
      } else {
        // Normal range
        value = 5.2 + Math.random() * 1.8;
      }

      readings.push({
        timestamp: t.toISOString(),
        value_mmol: Math.round(value * 10) / 10,
        reading_type: offset < 2 ? 'fasting' : isLunchWindow ? 'lunch_window' : 'post_meal',
        source: 'cgm',
      });
    }
  }

  return readings;
};

export const mockGlucoseReadings = generateGlucoseReadings();

// ─── Glucose Target ────────────────────────────────────────────────────────
export const mockGlucoseTarget = {
  fasting_min: 4.0,
  fasting_max: 7.0,
  post_meal_max: 10.0,
};

// ─── Meal Logs ─────────────────────────────────────────────────────────────
export const mockMealLogs = [
  {
    date: '2026-03-17',
    breakfast: { time: '07:30', logged: true, description: 'Kaya toast + coffee' },
    lunch: { time: null, logged: false, skipped: true, skip_reason: 'back_to_back_meetings' },
    dinner: { time: '19:30', logged: true, description: 'Chicken rice' },
  },
  {
    date: '2026-03-18',
    breakfast: { time: '07:45', logged: true, description: 'Oatmeal + banana' },
    lunch: { time: '12:15', logged: true, description: 'Veggie noodles' },
    dinner: { time: '19:45', logged: true, description: 'Grilled fish with vegetables' },
  },
  {
    date: '2026-03-19',
    breakfast: { time: '07:20', logged: true, description: 'Whole wheat bread + egg' },
    lunch: { time: null, logged: false, skipped: true, skip_reason: 'long_meeting' },
    dinner: { time: '20:00', logged: true, description: 'Soup + brown rice' },
  },
];

// ─── Calendar / Work Schedule ──────────────────────────────────────────────
export const mockCalendar = [
  {
    date: '2026-03-17',
    events: [
      { title: 'Team standup', start: '09:00', end: '09:30', type: 'internal', audio_only: true },
      { title: 'Client presentation', start: '11:00', end: '12:00', type: 'external', audio_only: false },
      { title: 'Strategy sync', start: '12:30', end: '14:00', type: 'internal', audio_only: true },
      { title: '1-1 with manager', start: '15:00', end: '15:30', type: 'internal', audio_only: false },
    ],
    lunch_blocked: true,
  },
  {
    date: '2026-03-18',
    events: [
      { title: 'Project kickoff', start: '10:00', end: '11:30', type: 'internal', audio_only: false },
      { title: 'Design review', start: '14:00', end: '15:30', type: 'internal', audio_only: false },
    ],
    lunch_blocked: false,
  },
];

// ─── Exercise and Activity Data ────────────────────────────────────────────
export const mockExerciseLogs = [
  {
    date: '2026-03-17',
    steps: 6842,
    step_goal: 10000,
    active_minutes: 37,
    sitting_episodes: [
      { start: '09:00', end: '12:10', duration_mins: 190, flagged: true },
      { start: '13:30', end: '16:40', duration_mins: 190, flagged: true },
    ],
    walking_sessions: [
      {
        start: '12:10',
        end: '12:32',
        steps: 1840,
        route: 'Amoy Street FC',
        agent_suggested: true,
        accepted: true,
      },
    ],
    heart_rate: [
      { time: '09:00', bpm: 71, zone: 'resting' },
      { time: '12:10', bpm: 88, zone: 'walking' },
      { time: '12:20', bpm: 96, zone: 'walking' },
      { time: '12:32', bpm: 78, zone: 'recovery' },
      { time: '15:00', bpm: 72, zone: 'resting' },
    ],
  },
];

// ─── Appointment History ──────────────────────────────────────────────────
export const mockAppointments = [
  {
    date: '2025-12-10',
    clinic: 'NUH Diabetes Centre',
    clinician: 'Dr Tan Wei Ming',
    type: 'routine',
    auto_booked: false,
    hba1c_result: 7.0,
    notes: 'Stable. Continue current medications.',
  },
  {
    date: '2026-03-20',
    clinic: 'NUH Diabetes Centre',
    clinician: 'Dr Tan Wei Ming',
    type: 'urgent',
    auto_booked: true,
    booking_reason: 'Glucose unstable 5 consecutive days',
    urgency_score: 4,
    status: 'confirmed',
  },
];

// ─── Agent Action Log ──────────────────────────────────────────────────────
export const mockAgentActions = [
  {
    timestamp: '2026-03-17T13:02:00',
    action_type: 'medication_held',
    detail: 'Metformin 500mg held — no meal detected since 10:30 AM',
    triggered_by: 'lunch_intelligence',
    silent: true,
    outcome: 'rescheduled to 14:45',
  },
  {
    timestamp: '2026-03-17T13:05:00',
    action_type: 'appointment_booked',
    detail: 'Urgent booking — NUH 20 Mar 2:00 PM. Glucose unstable 5 days.',
    triggered_by: 'appointment_agent',
    silent: false,
    outcome: 'confirmed',
  },
  {
    timestamp: '2026-03-17T13:10:00',
    action_type: 'exercise_suggestion',
    detail: 'Sitting 3.2 hrs. Suggested walk to Amoy Street FC.',
    triggered_by: 'exercise_optimizer',
    silent: false,
    outcome: 'accepted',
  },
  {
    timestamp: '2026-03-17T15:30:00',
    action_type: 'glucose_alert',
    detail: 'Glucose spiked to 9.5 mmol/L post-meeting stress.',
    triggered_by: 'glucose_monitor',
    silent: true,
    outcome: 'logged',
  },
];

// ─── Weekly Health Digest ─────────────────────────────────────────────────
export const mockWeeklyDigest = {
  week: '2026-03-11 to 2026-03-17',
  avg_fasting_glucose: 6.9,
  avg_post_meal_glucose: 8.1,
  medication_adherence_pct: 73,
  meals_skipped: 4,
  skip_pattern: ['Tuesday', 'Thursday'],
  avg_steps: 6200,
  step_goal_met_days: 2,
  sitting_episodes_flagged: 6,
  agent_actions_taken: 12,
  agent_actions_silent: 8,
  worst_day: 'Tuesday',
  highlights: {
    positive: 'Glipizide 100% adherence',
    concern: 'Lunch skipped 4 times — Tue/Thu pattern',
  },
};

// ─── Chat Predefined Questions (by tab) ────────────────────────────────────
export const predefinedQuestions = {
  general: [
    'I want to know more about my condition.',
    'I want to book a medical appointment with my doctor.',
    'I want to schedule a reminder for my medications.',
  ],
  medications: [
    'What medications do I need to take today?',
    'Why was my Metformin reminder delayed?',
    'I missed a dose — what should I do?',
  ],
  appointments: [
    'When is my next appointment?',
    'Can you check if I need to see a doctor soon?',
    'I want to book a medical appointment with my doctor.',
  ],
  meals: [
    'Did I skip lunch today?',
    'What should I eat to keep my glucose stable?',
    'Find me a nearby hawker centre.',
  ],
  exercise: [
    'How many steps have I taken today?',
    'How long have I been sitting?',
    'Suggest a walking route for me.',
  ],
};

// ─── Agent Thinking Steps (by tab) ─────────────────────────────────────────
export const agentSteps = {
  appointments: [
    'Checking your glucose trends',
    'Scoring appointment urgency',
    'Checking missed medications',
    'Checking your calendar',
    'Finding available clinic slots',
  ],
  medications: [
    'Loading your medication schedule',
    'Checking if you have eaten recently',
    'Checking your calendar for meetings',
    'Recalculating safe timing',
  ],
  meals: [
    'Checking your glucose readings',
    'Reading your calendar',
    'Detecting meal skip signals',
    'Calculating confidence score',
    'Finding nearby food options',
  ],
  exercise: [
    'Reading your step count',
    'Calculating steps to goal',
    'Checking sitting duration',
    'Reviewing your heart rate data',
  ],
  general: [
    'Reading your health context',
    'Generating response',
  ],
};

// ─── Mock AI Responses (keyed by question text) ────────────────────────────
// TODO: Replace with real API call to backend /api/chat endpoint
export const mockResponses = {
  // General
  'I want to know more about my condition.':
    'You have Type 2 Diabetes, which means your body has difficulty managing blood sugar levels. Your current HbA1c is 7.2% — slightly above the target of 7.0%. The good news is this is manageable with your current medications, regular meals, and exercise. Want me to explain any specific aspect?',

  'I want to book a medical appointment with my doctor.':
    'I\'ve checked your health data and booked you an urgent appointment:\n\n📅 Friday, 20 March 2026\n🏥 NUH Diabetes Centre\n⏰ 2:00 PM\n👨‍⚕️ Dr Tan Wei Ming\n\nYour glucose has been unstable for 5 days. I\'ve also prepared a health brief for Dr Tan.',

  'I want to schedule a reminder for my medications.':
    'Head over to the Reminders tab and I can set up smart reminders for your medications. I\'ll automatically adjust timing based on your meals and meetings so you never take Metformin on an empty stomach.',

  // Medications
  'What medications do I need to take today?':
    'Here are your medications for today:\n\n💊 Metformin 500mg — held until after your next meal\n💊 Glipizide 5mg — taken ✅ at 12:30 PM\n💊 Rosuvastatin 10mg — due at 9:00 PM\n\nYour Metformin has been held because no meal was detected since 10:30 AM.',

  'Why was my Metformin reminder delayed?':
    'Your Metformin needs to be taken with food, but I detected that you haven\'t eaten since 10:30 AM. Taking it on an empty stomach can cause nausea.\n\nI\'ve held the reminder until after your next meal. Once you eat, I\'ll remind you within 15 minutes. 🍱',

  'I missed a dose — what should I do?':
    'Don\'t worry — it happens! For Metformin:\n\n• If it\'s within 2 hours — take it now with food\n• If it\'s been more than 2 hours — skip it and continue with your next scheduled dose\n• Never double up\n\nShould I log this missed dose for your doctor\'s brief?',

  // Appointments
  'When is my next appointment?':
    'Your next appointment is:\n\n📅 Friday, 20 March 2026\n🏥 NUH Diabetes Centre\n⏰ 2:00 PM\n👨‍⚕️ Dr Tan Wei Ming\n\nI\'ve already prepared a health brief for Dr Tan covering your glucose trends, medication adherence, and meal patterns from the past 30 days.',

  'Can you check if I need to see a doctor soon?':
    'Based on your health data, I recommend seeing your doctor soon.\n\n⚠️ Urgency score: 4/5\n\nReasons:\n• Glucose unstable for 5 consecutive days\n• 4 missed Metformin doses this week\n• Last visit was 98 days ago\n\nI\'ve booked you in for Friday 20 March at 2:00 PM at NUH.',

  // Meals
  'Did I skip lunch today?':
    'Based on your data, it looks like you likely skipped lunch today (82% confidence).\n\nHere\'s what I detected:\n• Glucose dropped to 4.6 mmol/L at 12:00 PM\n• No movement detected for 3 hours\n• Your calendar was blocked from 11 AM to 3 PM\n\nI\'ve already held your Metformin until after you eat. Amoy Street Food Centre is just 3 minutes away — want directions? 🍱',

  'What should I eat to keep my glucose stable?':
    'For stable glucose, here are some good hawker options:\n\n🍚 Brown rice instead of white rice\n🐔 Chicken rice — ask for less rice, more veg\n🍜 Yong tau foo — great low-GI choice\n🥗 Economy rice — 1 protein + 2 vegetables\n\nAvoid: sugary drinks, fried carbs, and kaya toast on an empty stomach.',

  'Find me a nearby hawker centre.':
    'Here are the nearest hawker centres to you:\n\n📍 Amoy Street Food Centre — 3 min walk (+280 steps)\n📍 Maxwell Food Centre — 7 min walk (+650 steps)\n📍 Lau Pa Sat — 10 min walk (+900 steps)\n\nAmoy Street is closest! Walking there adds 280 steps towards your daily goal of 10,000. 🚶',

  // Exercise
  'How many steps have I taken today?':
    'You\'ve taken 6,842 steps today — you\'re 3,158 steps short of your 10,000 goal.\n\nQuick ways to close the gap:\n🚶 Walk to Amoy Street FC (+280 steps)\n🚶 Walk home via Tanjong Pagar MRT (+1,100 steps)\n🚶 Take the stairs instead of the lift (+120 steps)',

  'How long have I been sitting?':
    'You\'ve been sitting for 3 hours and 12 minutes straight — above the recommended 1-hour limit.\n\nProlonged sitting can raise your blood glucose. Even a 5-minute walk now would help. Your glucose is also slightly low at 4.8 mmol/L — a short walk after grabbing food would be perfect. 🚶',

  'Suggest a walking route for me.':
    'Here are some walking routes from your current location:\n\n🏠 Walk home via Tanjong Pagar MRT\n   14 min · +1,100 steps\n\n☕ Walk to Amoy Street FC\n   3 min · +280 steps · grab lunch too\n\n🏢 Office park loop\n   8 min · +720 steps · good for post-lunch\n\nThe walk home would almost hit your step goal for today!',
};