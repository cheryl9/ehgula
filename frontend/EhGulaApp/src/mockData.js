// src/mockData.js
// All fake data used while backend + AI are being built.
// When backend is ready, replace responses in ChatScreen.jsx with real API calls.

export const mockPatient = {
  id: 'P001',
  name: 'David',
  condition: 'Type 2 Diabetes',
}

// Pre-defined suggestion chips shown before user types
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
    'I want to book a medical appointment with my doctor.',
    'When is my next appointment?',
    'Can you check if I need to see a doctor soon?',
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
}

// Animated checklist steps shown while agent is "thinking"
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
}

// Mock AI responses — keyed by question text
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
}