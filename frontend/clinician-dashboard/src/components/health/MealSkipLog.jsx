import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import clsx from 'clsx'
import { MOCK_MEAL_DATA } from '../../api/dataProvider'

/**
 * MealSkipLog - Calendar view showing meal skip patterns
 * Displays: Calendar heatmap with meal skip data, patterns, warnings
 */
export default function MealSkipLog({ mealData }) {
  const [month, setMonth] = useState(new Date())
  const [mealType, setMealType] = useState('all') // all, breakfast, lunch, dinner

  const normalizeMealData = (input) => {
    if (input && typeof input === 'object' && !Array.isArray(input) && !Array.isArray(input.rows)) {
      return input
    }

    const rows = Array.isArray(input)
      ? input
      : (Array.isArray(input?.rows) ? input.rows : [])

    if (!rows.length) {
      return MOCK_MEAL_DATA
    }

    const byDate = {}
    for (const row of rows) {
      const dateKey = row.date
      if (!dateKey) continue

      if (!byDate[dateKey]) {
        byDate[dateKey] = {
          date: new Date(dateKey),
          breakfast: { skipped: false, calories: null },
          lunch: { skipped: false, calories: null },
          dinner: { skipped: false, calories: null },
        }
      }

      const mealType = row.meal_type || row.mealType
      if (!['breakfast', 'lunch', 'dinner'].includes(mealType)) {
        continue
      }

      byDate[dateKey][mealType] = {
        skipped: !!row.skipped,
        calories: null,
      }
    }

    return byDate
  }

  const normalizedMealData = normalizeMealData(mealData)

  // Detect recurring patterns
  const detectPatterns = () => {
    const patterns = []

    // Check Tuesday/Thursday lunch pattern
    let tueThuLunchSkips = 0
    Object.values(normalizedMealData).forEach((day) => {
      const dayOfWeek = day.date.getDay()
      if ((dayOfWeek === 2 || dayOfWeek === 4) && day.lunch.skipped) {
        tueThuLunchSkips++
      }
    })
    if (tueThuLunchSkips >= 4) {
      patterns.push({
        id: 'tue-thu-lunch',
        type: 'Recurring Pattern',
        title: 'Lunch frequently skipped on Tue/Thu',
        description: `${tueThuLunchSkips} times in past 30 days`,
        severity: 'warning',
      })
    }

    // Check total skips
    const totalSkips = Object.values(normalizedMealData).reduce((sum, day) => {
      return sum + (day.breakfast.skipped ? 1 : 0) + (day.lunch.skipped ? 1 : 0) + (day.dinner.skipped ? 1 : 0)
    }, 0)
    if (totalSkips > 15) {
      patterns.push({
        id: 'high-skips',
        type: 'High Skip Rate',
        title: 'Frequent meal skips detected',
        description: `${totalSkips} meals skipped in past 30 days`,
        severity: 'critical',
      })
    }

    return patterns
  }

  const patterns = detectPatterns()

  // Get color intensity for heatmap
  const getIntensity = (skipped) => {
    if (skipped) return 'bg-danger-red-500'
    return 'bg-success-green-100'
  }

  // Get skip summary for a date
  const getSkipCount = (dateKey) => {
    const day = normalizedMealData[dateKey]
    if (!day) return 0
    return (day.breakfast.skipped ? 1 : 0) + (day.lunch.skipped ? 1 : 0) + (day.dinner.skipped ? 1 : 0)
  }

  // Build calendar grid
  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay()

  const daysInMonth = getDaysInMonth(month)
  const firstDayOfWeek = getFirstDayOfMonth(month)
  const calendarDays = []

  // Empty cells for days before month starts
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null)
  }

  // Days of month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  // Stats
  const totalMeals = Object.values(normalizedMealData).reduce((sum, day) => sum + 3, 0) // 3 meals per day
  const totalSkips = Object.values(normalizedMealData).reduce((sum, day) => {
    return sum + (day.breakfast.skipped ? 1 : 0) + (day.lunch.skipped ? 1 : 0) + (day.dinner.skipped ? 1 : 0)
  }, 0)
  const skipRate = totalMeals > 0 ? ((totalSkips / totalMeals) * 100).toFixed(1) : '0.0'

  return (
    <div className="space-y-6">
      {/* Warnings */}
      {patterns.length > 0 && (
        <div className="space-y-3">
          {patterns.map((pattern) => (
            <div
              key={pattern.id}
              className={clsx(
                'flex items-start gap-3 rounded-lg border p-4',
                pattern.severity === 'critical' ? 'bg-danger-red-50 border-danger-red-200' : 'bg-warning-orange-50 border-warning-orange-200'
              )}
            >
              <AlertTriangle
                size={20}
                className={pattern.severity === 'critical' ? 'text-danger-red-600' : 'text-warning-orange-600'}
              />
              <div>
                <p className={`font-semibold ${pattern.severity === 'critical' ? 'text-danger-red-900' : 'text-warning-orange-900'}`}>
                  {pattern.title}
                </p>
                <p className={`text-sm ${pattern.severity === 'critical' ? 'text-danger-red-700' : 'text-warning-orange-700'}`}>
                  {pattern.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Card */}
      <div className="rounded-lg border border-slate-200 bg-white">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Meal Skip Calendar</h3>
            <p className="text-sm text-slate-600">{skipRate}% skip rate • {totalSkips} skipped meals in 30 days</p>
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            <button
              onClick={() => setMealType('all')}
              className={clsx(
                'px-3 py-1 text-sm font-medium rounded-lg transition-colors',
                mealType === 'all' ? 'bg-info-blue-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              )}
            >
              All Meals
            </button>
            <button
              onClick={() => setMealType('breakfast')}
              className={clsx(
                'px-3 py-1 text-sm font-medium rounded-lg transition-colors',
                mealType === 'breakfast' ? 'bg-warning-orange-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              )}
            >
              Breakfast
            </button>
            <button
              onClick={() => setMealType('lunch')}
              className={clsx(
                'px-3 py-1 text-sm font-medium rounded-lg transition-colors',
                mealType === 'lunch' ? 'bg-warning-orange-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              )}
            >
              Lunch
            </button>
            <button
              onClick={() => setMealType('dinner')}
              className={clsx(
                'px-3 py-1 text-sm font-medium rounded-lg transition-colors',
                mealType === 'dinner' ? 'bg-warning-orange-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              )}
            >
              Dinner
            </button>
          </div>
        </div>

        {/* Calendar */}
        <div className="p-6">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1))}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              ← Prev
            </button>
            <h4 className="text-lg font-semibold text-slate-900">
              {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h4>
            <button
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1))}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              Next →
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-xs font-semibold text-slate-600 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="aspect-square" />
              }

              const date = new Date(month.getFullYear(), month.getMonth(), day)
              const dateKey = date.toISOString().split('T')[0]
              const dayData = normalizedMealData[dateKey]
              const skipCount = getSkipCount(dateKey)

              // If no data for this date, show as disabled/grayed out
              if (!dayData) {
                return (
                  <div
                    key={day}
                    className="aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-medium border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                  >
                    <span>{day}</span>
                  </div>
                )
              }

              return (
                <div
                  key={day}
                  title={`${dayData.breakfast.skipped ? 'B' : ''}${dayData.lunch.skipped ? 'L' : ''}${dayData.dinner.skipped ? 'D' : ''}`}
                  className={clsx(
                    'aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all hover:shadow-md cursor-default border',
                    skipCount === 0
                      ? 'bg-success-green-100 border-success-green-200 text-success-green-900'
                      : skipCount === 1
                        ? 'bg-warning-orange-100 border-warning-orange-200 text-warning-orange-900'
                        : skipCount === 2
                          ? 'bg-warning-orange-300 border-warning-orange-400 text-white'
                          : 'bg-danger-red-500 border-danger-red-600 text-white'
                  )}
                >
                  <span>{day}</span>
                  {skipCount > 0 && <span className="text-xs opacity-80">{skipCount} skip</span>}
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-success-green-100 border border-success-green-200" />
              <span className="text-slate-700">No skips</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-warning-orange-100 border border-warning-orange-200" />
              <span className="text-slate-700">1 meal skipped</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-warning-orange-300 border border-warning-orange-400" />
              <span className="text-slate-700">2 meals skipped</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-danger-red-500 border border-danger-red-600" />
              <span className="text-slate-700">All 3 meals skipped</span>
            </div>
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h4 className="text-lg font-semibold text-slate-900 mb-4">Meal Skip Details (Last 7 Days)</h4>
        <div className="space-y-3">
          {Object.values(normalizedMealData)
            .slice(-7)
            .reverse()
            .map((day, idx) => {
              const hasSkip = day.breakfast.skipped || day.lunch.skipped || day.dinner.skipped
              if (!hasSkip) return null

              return (
                <div key={idx} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                  <div>
                    <p className="font-medium text-slate-900">
                      {day.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-sm text-slate-600">
                      {day.breakfast.skipped ? '❌ Breakfast' : '✓ Breakfast'} •{' '}
                      {day.lunch.skipped ? '❌ Lunch' : '✓ Lunch'} • {day.dinner.skipped ? '❌ Dinner' : '✓ Dinner'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-slate-900">{getSkipCount(day.date.toISOString().split('T')[0])} skipped</p>
                    <p className="text-sm text-slate-600">
                      {(day.breakfast.calories || 0) + (day.lunch.calories || 0) + (day.dinner.calories || 0)} cal
                    </p>
                  </div>
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}
