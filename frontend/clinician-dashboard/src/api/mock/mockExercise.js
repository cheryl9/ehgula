/**
 * Mock Exercise & Activity Data
 * Includes: Steps, Sitting Episodes, Heart Rate
 * Structure designed to mirror backend API response
 */

// Generate steps data helper
const generateStepsData = () => {
  const data = []
  const today = new Date()
  const DAILY_GOAL = 10000

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dayOfWeek = date.getDay()
    let steps

    // Weekdays: 7000-9000 steps (consistent under-goal)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      steps = Math.floor(Math.random() * 2000 + 7000)
    } else {
      // Weekends: 4000-6000 steps (less active)
      steps = Math.floor(Math.random() * 2000 + 4000)
    }

    data.push({
      date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' }),
      steps,
      goal: DAILY_GOAL,
      achievement: ((steps / DAILY_GOAL) * 100).toFixed(0)
    })
  }

  return data
}

export const MOCK_STEPS = generateStepsData()

// Sitting episodes data
const generateSittingData = () => {
  const MAX_CONTINUOUS_SITTING = 60
  const episodes = []

  const episodesConfig = [
    { start: 540, duration: 65 },
    { start: 610, duration: 45 },
    { start: 680, duration: 75 },
    { start: 770, duration: 40 },
    { start: 820, duration: 55 },
    { start: 895, duration: 80 }
  ]

  episodesConfig.forEach((ep, idx) => {
    const startHour = Math.floor(ep.start / 60)
    const startMin = ep.start % 60
    const endHour = Math.floor((ep.start + ep.duration) / 60)
    const endMin = (ep.start + ep.duration) % 60

    episodes.push({
      id: idx,
      startTime: `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`,
      endTime: `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`,
      duration: ep.duration,
      location: ['Office', 'Meeting', 'Desk', 'Conference Room'][Math.floor(Math.random() * 4)],
      type: ep.duration > MAX_CONTINUOUS_SITTING ? 'prolonged' : 'normal',
      exceedsLimit: ep.duration > MAX_CONTINUOUS_SITTING
    })
  })

  return episodes
}

export const MOCK_SITTING = generateSittingData()

// Heart rate data helper
const generateHeartRateData = () => {
  const data = []
  const now = new Date()

  const getZoneLabel = (hr) => {
    if (hr <= 60) return 'Resting'
    if (hr <= 100) return 'Light'
    if (hr <= 140) return 'Moderate'
    if (hr <= 170) return 'Vigorous'
    return 'Maximum'
  }

  for (let i = 23; i >= 0; i--) {
    const hour = now.getHours() - i
    let hr

    const timeOfDay = (hour + 24) % 24
    if (timeOfDay < 7 || timeOfDay > 22) {
      hr = Math.floor(Math.random() * 15 + 50)
    } else if (timeOfDay === 12 || timeOfDay === 13) {
      hr = Math.random() > 0.7 ? Math.floor(Math.random() * 40 + 130) : Math.floor(Math.random() * 30 + 70)
    } else if (timeOfDay === 17 || timeOfDay === 18) {
      hr = Math.random() > 0.5 ? Math.floor(Math.random() * 50 + 110) : Math.floor(Math.random() * 30 + 70)
    } else {
      hr = Math.floor(Math.random() * 25 + 65)
    }

    data.push({
      time: `${String(hour % 12 || 12).padStart(2, '0')}:00 ${hour < 12 ? 'AM' : 'PM'}`,
      hr,
      zone: getZoneLabel(hr)
    })
  }

  return data
}

export const MOCK_HEART_RATE = generateHeartRateData()

// Heart rate zones configuration
export const HR_ZONES = {
  resting: { min: 0, max: 60, label: 'Resting', color: '#3b82f6', bg: 'bg-info-blue-50' },
  light: { min: 60, max: 100, label: 'Light Activity', color: '#10b981', bg: 'bg-success-green-50' },
  moderate: { min: 100, max: 140, label: 'Moderate', color: '#f59e0b', bg: 'bg-warning-orange-50' },
  vigorous: { min: 140, max: 170, label: 'Vigorous', color: '#ef4444', bg: 'bg-danger-red-50' },
  max: { min: 170, max: 220, label: 'Maximum', color: '#991b1b', bg: 'bg-red-900' }
}
