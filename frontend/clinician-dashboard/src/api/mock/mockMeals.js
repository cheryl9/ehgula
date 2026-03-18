/**
 * Mock Meal & Nutrition Data
 * Includes: 30-day meal skip patterns
 * Structure designed to mirror backend API response
 */

// Generate meal data for past 30 days with detailed structure
const generateMealData = () => {
  const data = {}
  const today = new Date()

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateKey = date.toISOString().split('T')[0]

    // Breakfast: rarely skipped (90% chance of eating)
    const bSkipped = Math.random() > 0.9
    // Lunch: occasionally skipped, pattern on Tue/Thu (50-85% chance of eating)
    const dayOfWeek = date.getDay()
    const lSkipped = dayOfWeek === 2 || dayOfWeek === 4 ? Math.random() > 0.5 : Math.random() > 0.85
    // Dinner: rarely skipped (88% chance of eating)
    const dSkipped = Math.random() > 0.88

    data[dateKey] = {
      date,
      breakfast: { skipped: bSkipped, calories: bSkipped ? null : Math.floor(Math.random() * 300 + 400) },
      lunch: { skipped: lSkipped, calories: lSkipped ? null : Math.floor(Math.random() * 400 + 500) },
      dinner: { skipped: dSkipped, calories: dSkipped ? null : Math.floor(Math.random() * 500 + 600) },
    }
  }

  return data
}

export const MOCK_MEAL_DATA = generateMealData()

// Calculate meal adherence summary
export const calculateMealAdherence = () => {
  const totalMeals = Object.values(MOCK_MEAL_DATA).length * 3 // 30 days × 3 meals
  const mealsTaken = Object.values(MOCK_MEAL_DATA).reduce(
    (sum, day) => sum + (day.breakfast.skipped ? 0 : 1) + (day.lunch.skipped ? 0 : 1) + (day.dinner.skipped ? 0 : 1),
    0
  )

  return {
    adherenceRate: ((mealsTaken / totalMeals) * 100).toFixed(1),
    mealsTaken,
    totalMeals,
    breakfastRate: (
      (Object.values(MOCK_MEAL_DATA).filter(d => !d.breakfast.skipped).length /
        Object.values(MOCK_MEAL_DATA).length) *
      100
    ).toFixed(1),
    lunchRate: (
      (Object.values(MOCK_MEAL_DATA).filter(d => !d.lunch.skipped).length /
        Object.values(MOCK_MEAL_DATA).length) *
      100
    ).toFixed(1),
    dinnerRate: (
      (Object.values(MOCK_MEAL_DATA).filter(d => !d.dinner.skipped).length /
        Object.values(MOCK_MEAL_DATA).length) *
      100
    ).toFixed(1),
    totalSkipped: Object.values(MOCK_MEAL_DATA).reduce(
      (sum, day) => sum + (day.breakfast.skipped ? 1 : 0) + (day.lunch.skipped ? 1 : 0) + (day.dinner.skipped ? 1 : 0),
      0
    )
  }
}

// Meal patterns for analysis
export const MEAL_PATTERNS = {
  breakfast: { name: 'Breakfast', time: '7:00 AM - 9:00 AM', color: '#3b82f6' },
  lunch: { name: 'Lunch', time: '12:00 PM - 1:00 PM', color: '#f59e0b' },
  dinner: { name: 'Dinner', time: '6:00 PM - 8:00 PM', color: '#10b981' }
}
