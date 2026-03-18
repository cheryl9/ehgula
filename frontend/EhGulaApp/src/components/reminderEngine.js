// ─────────────────────────────────────────────────────────────────────────────
// src/reminderEngine.js
//
// Generates categorised reminders from LIVE Supabase data.
// Call buildAllReminders(data) where data comes from usePatientData().
//
// Your AI teammate's SEA-LION agent can replace each generator function
// here — the interface (input shape + output shape) stays identical.
// ─────────────────────────────────────────────────────────────────────────────

// ── Snooze config (exported so RemindersScreen can use them) ──────────────────
export const MAX_SNOOZES = 3
export const SNOOZE_DURATIONS_MINS = [15, 30, 60]

export const getSnoozeLabel = (snoozeCount) => {
  if (snoozeCount === 0) return 'Snooze 15 min'
  if (snoozeCount === 1) return 'Snooze 30 min'
  if (snoozeCount === 2) return 'Snooze 1 hr (last snooze)'
  return 'Max snoozes reached'
}

// ── ID counter ────────────────────────────────────────────────────────────────
let _id = 1
const uid = (prefix) => `${prefix}_${_id++}`

// ── Time helpers ──────────────────────────────────────────────────────────────
const toMins = (timeStr) => {
  if (!timeStr) return 0
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}
const nowMins  = () => { const n = new Date(); return n.getHours() * 60 + n.getMinutes() }
const todayStr = () => new Date().toISOString().split('T')[0]

// ─────────────────────────────────────────────────────────────────────────────
// Helper functions
// ─────────────────────────────────────────────────────────────────────────────

const isMeetingNow = (calendar = []) => {
  const now = nowMins()
  return calendar.some((ev) => {
    const start = toMins(ev.start_time) - 15
    const end   = toMins(ev.end_time)
    return now >= start && now <= end
  })
}

const daysSinceLastVisit = (appointments = []) => {
  const completed = appointments.filter((a) => a.status === 'completed')
  if (!completed.length) return 999
  const last = new Date(completed[completed.length - 1].date)
  return Math.floor((Date.now() - last.getTime()) / 86400000)
}

const glucoseInstabilityScore = (glucose = []) => {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 5)
  return glucose.filter((r) => {
    return new Date(r.timestamp) >= cutoff &&
      (r.value_mmol > 9.0 || r.value_mmol < 4.0)
  }).length
}

const lunchSkippedToday = (mealLogs = [], calendar = []) => {
  const today = mealLogs.find((m) => m.date === todayStr())
  if (today) return today.lunch_skipped || !today.lunch_logged
  // Fallback: check if lunch window (12–1pm) is blocked by a meeting
  return calendar.some((ev) => {
    const start = toMins(ev.start_time)
    const end   = toMins(ev.end_time)
    return start <= toMins('13:00') && end >= toMins('12:00')
  })
}

const longestSittingMins = (exercise) => {
  if (!exercise?.sitting_episodes?.length) return 0
  return Math.max(...exercise.sitting_episodes.map((s) => s.duration_mins))
}

const getNearbyFood = (patient) => {
  const area = patient?.location_area || 'your area'
  return [`nearest hawker centre near ${area}`, 'Maxwell Food Centre', 'Lau Pa Sat']
}

// ─────────────────────────────────────────────────────────────────────────────
// REMINDER GENERATORS
// ─────────────────────────────────────────────────────────────────────────────

function getMedicationReminders({ medications, doseLogs, mealLogs, calendar }) {
  const reminders    = []
  const now          = nowMins()
  const lunchSkipped = lunchSkippedToday(mealLogs, calendar)
  const inMeeting    = isMeetingNow(calendar)

  doseLogs.forEach((dose) => {
    const med = medications.find(
      (m) => m.name === dose.medication_name || m.id === dose.medication_id
    )
    if (!med) return

    if (dose.status === 'missed') {
      const heldForFood = med.requires_food && lunchSkipped
      let title, detail, action

      if (heldForFood && inMeeting) {
        title  = `${med.name} ${med.dose} held`
        detail = `No meal detected + you're in a meeting. Will remind after your next meal.`
        action = 'held'
      } else if (heldForFood) {
        title  = `${med.name} ${med.dose} — eat first!`
        detail = `This medication needs food. Lunch was skipped — take it after your next meal.`
        action = 'held'
      } else if (inMeeting) {
        title  = `${med.name} ${med.dose} delayed`
        detail = `You're in a meeting. We'll remind you as soon as it ends.`
        action = 'delayed'
      } else {
        title  = `Time for ${med.name} ${med.dose}`
        detail = `Scheduled ${dose.scheduled_time}. ${med.requires_food ? 'Take with food.' : 'Can take without food.'}`
        action = 'remind'
      }

      reminders.push({
        id: uid('med'), category: 'Medications',
        priority: heldForFood ? 'medium' : 'high',
        time: `Today ${dose.scheduled_time}`,
        title, detail, action,
        tagColor: '#C8E6C9', tagTextColor: '#2E7D32',
        snoozeable: !heldForFood, snoozeCount: 0, snoozedUntil: null,
      })
    }

    if (dose.status === 'pending') {
      const scheduledMins = toMins(dose.scheduled_time)
      if (now < scheduledMins) {
        reminders.push({
          id: uid('med'), category: 'Medications',
          priority: 'low',
          time: `Today ${dose.scheduled_time}`,
          title: `${med.name} ${med.dose} coming up`,
          detail: `Scheduled for ${dose.scheduled_time}. ${med.requires_food ? 'Remember to eat first.' : ''}`,
          action: 'upcoming',
          tagColor: '#C8E6C9', tagTextColor: '#2E7D32',
          snoozeable: true, snoozeCount: 0, snoozedUntil: null,
        })
      }
    }
  })

  // Low adherence warning
  const totalDoses   = doseLogs.length
  const takenDoses   = doseLogs.filter((d) => d.status === 'taken').length
  const adherencePct = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 100

  if (adherencePct < 80 && totalDoses > 0) {
    reminders.push({
      id: uid('med'), category: 'Medications',
      priority: 'high',
      time: 'Today',
      title: `Medication adherence: ${adherencePct}%`,
      detail: `You've missed several doses. Consistent medication is critical for glucose control.`,
      action: 'info',
      tagColor: '#FFCDD2', tagTextColor: '#C62828',
      snoozeable: false, snoozeCount: 0, snoozedUntil: null,
    })
  }

  return reminders
}

function getAppointmentReminders({ appointments, glucose, doseLogs }) {
  const reminders   = []
  const daysSince   = daysSinceLastVisit(appointments)
  const instability = glucoseInstabilityScore(glucose)
  const missedToday = doseLogs.filter((d) => d.status === 'missed').length

  // Urgency scoring
  let urgencyScore = 0
  if (daysSince > 90)   urgencyScore += 2
  if (daysSince > 60)   urgencyScore += 1
  if (instability > 4)  urgencyScore += 2
  if (instability > 2)  urgencyScore += 1
  if (missedToday >= 3) urgencyScore += 1

  const upcoming = appointments.find((a) => a.status === 'confirmed')
  if (upcoming) {
    const apptDate  = new Date(upcoming.date)
    const daysUntil = Math.ceil((apptDate - Date.now()) / 86400000)
    reminders.push({
      id: uid('apt'), category: 'Appointments',
      priority: 'medium',
      time: `${apptDate.toDateString()} — ${daysUntil} day${daysUntil !== 1 ? 's' : ''} away`,
      title: `Appointment with ${upcoming.clinician_name || 'your doctor'}`,
      detail: `${upcoming.clinic || ''}. ${upcoming.auto_booked ? 'Auto-booked based on glucose trends.' : ''} ${upcoming.booking_reason || ''}`,
      action: 'view',
      tagColor: '#BBDEFB', tagTextColor: '#1565C0',
      snoozeable: false, snoozeCount: 0, snoozedUntil: null,
      appointmentId: upcoming.id,
    })
  }

  if (!upcoming && urgencyScore >= 3) {
    const level = urgencyScore >= 5 ? 'High' : 'Medium'
    reminders.push({
      id: uid('apt'), category: 'Appointments',
      priority: urgencyScore >= 5 ? 'high' : 'medium',
      time: 'Action needed',
      title: `⚠ ${level} urgency — see a doctor soon`,
      detail: `Last visit: ${daysSince} days ago. Glucose unstable ${instability} times this week. ${missedToday} missed doses today.`,
      action: 'book',
      tagColor: '#FFCDD2', tagTextColor: '#C62828',
      snoozeable: false, snoozeCount: 0, snoozedUntil: null,
      // Hardcoded slots — swap with HealthHub API call when available
      suggestedSlots: [
        { id: 'slot1', date: 'Tomorrow', time: '09:00', clinic: 'Bedok Polyclinic'    },
        { id: 'slot2', date: 'Tomorrow', time: '14:30', clinic: 'Tampines Polyclinic' },
      ],
    })
  }

  if (daysSince > 60) {
    reminders.push({
      id: uid('apt'), category: 'Appointments',
      priority: 'low',
      time: `${daysSince} days ago`,
      title: `Last clinic visit was ${daysSince} days ago`,
      detail: `Regular check-ins help keep your diabetes on track.`,
      action: 'info',
      tagColor: '#FFF9C4', tagTextColor: '#F57F17',
      snoozeable: true, snoozeCount: 0, snoozedUntil: null,
    })
  }

  return reminders
}

function getMealReminders({ mealLogs, calendar, patient }) {
  const reminders    = []
  const now          = nowMins()
  const lunchSkipped = lunchSkippedToday(mealLogs, calendar)
  const today        = mealLogs.find((m) => m.date === todayStr())
  const food         = getNearbyFood(patient)

  if (lunchSkipped && now > toMins('12:00') && now < toMins('15:00')) {
    reminders.push({
      id: uid('meal'), category: 'Meals',
      priority: 'high',
      time: 'Today 12pm – 2pm',
      title: 'Lunch not detected — time to eat!',
      detail: `Glucose may dip without food. Nearest options: ${food.join(', ')}.`,
      action: 'log_meal',
      tagColor: '#FDE9C8', tagTextColor: '#E67E22',
      snoozeable: true, snoozeCount: 0, snoozedUntil: null,
    })
  }

  if (!today?.lunch_logged && now > toMins('14:00')) {
    reminders.push({
      id: uid('meal'), category: 'Meals',
      priority: 'medium',
      time: 'Past 2pm',
      title: 'Lunch still not logged',
      detail: `It's past 2pm and no lunch was recorded. Food-dependent medications have been held.`,
      action: 'log_meal',
      tagColor: '#FDE9C8', tagTextColor: '#E67E22',
      snoozeable: false, snoozeCount: 0, snoozedUntil: null,
    })
  }

  const skipCount = mealLogs.filter((m) => m.lunch_skipped).length
  if (skipCount >= 2) {
    reminders.push({
      id: uid('meal'), category: 'Meals',
      priority: 'low',
      time: 'Pattern detected',
      title: `Lunch skipped ${skipCount}x this week`,
      detail: `Consider blocking your calendar for a proper lunch break.`,
      action: 'info',
      tagColor: '#FDE9C8', tagTextColor: '#E67E22',
      snoozeable: true, snoozeCount: 0, snoozedUntil: null,
    })
  }

  return reminders
}

function getExerciseReminders({ exercise }) {
  const reminders = []
  if (!exercise) return reminders

  const now       = nowMins()
  const sitting   = longestSittingMins(exercise)
  const stepGoal  = exercise.step_goal ?? 10000
  const steps     = exercise.steps ?? 0
  const remaining = Math.max(0, stepGoal - steps)

  if (sitting >= 120) {
    const flagged = exercise.sitting_episodes?.find((s) => s.flagged)
    reminders.push({
      id: uid('ex'), category: 'Exercise',
      priority: sitting >= 180 ? 'high' : 'medium',
      time: flagged ? `${flagged.start_time} – ${flagged.end_time}` : 'Today',
      title: `Sitting for ${Math.floor(sitting / 60)}h ${sitting % 60}m — time to move!`,
      detail: `A short 10-min walk helps lower post-meal glucose.`,
      action: 'log_exercise',
      tagColor: '#E8D5F5', tagTextColor: '#9B59B6',
      snoozeable: true, snoozeCount: 0, snoozedUntil: null,
    })
  }

  if (remaining > 0 && now > toMins('16:00')) {
    reminders.push({
      id: uid('ex'), category: 'Exercise',
      priority: remaining > 5000 ? 'medium' : 'low',
      time: 'This afternoon',
      title: `${remaining.toLocaleString()} steps to go today`,
      detail: `You've done ${steps.toLocaleString()} of ${stepGoal.toLocaleString()} steps.`,
      action: 'log_exercise',
      tagColor: '#E8D5F5', tagTextColor: '#9B59B6',
      snoozeable: true, snoozeCount: 0, snoozedUntil: null,
    })
  }

  return reminders
}

// ─────────────────────────────────────────────────────────────────────────────
// MASTER BUILDER — call with data from usePatientData()
// ─────────────────────────────────────────────────────────────────────────────

export function buildAllReminders(data) {
  if (!data) return { General: [], Medications: [], Appointments: [], Meals: [], Exercise: [] }

  const meds  = getMedicationReminders(data)
  const apts  = getAppointmentReminders(data)
  const meals = getMealReminders(data)
  const exs   = getExerciseReminders(data)

  const priorityOrder = { high: 0, medium: 1, low: 2 }
  const sort = (arr) => [...arr].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  return {
    General:      sort([...meds, ...apts, ...meals, ...exs]),
    Medications:  sort(meds),
    Appointments: sort(apts),
    Meals:        sort(meals),
    Exercise:     sort(exs),
  }
}