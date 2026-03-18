import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import { TrendingUp, TrendingDown } from 'lucide-react'
import clsx from 'clsx'
import { MOCK_STEPS } from '../../api/dataProvider'

/**
 * StepsChart - 7-day steps tracking with goal line
 * Shows: Bar chart with daily steps, goal indicator, weekly summary
 */
export default function StepsChart() {
  const DAILY_GOAL = 10000
  const stepsData = MOCK_STEPS

  // Calculate weekly stats
  const totalSteps = stepsData.reduce((sum, day) => sum + day.steps, 0)
  const avgSteps = (totalSteps / stepsData.length).toFixed(0)
  const maxSteps = Math.max(...stepsData.map((d) => d.steps))
  const minSteps = Math.min(...stepsData.map((d) => d.steps))
  const daysAboveGoal = stepsData.filter((d) => d.steps >= DAILY_GOAL).length
  const goalAchievement = ((totalSteps / (DAILY_GOAL * 7)) * 100).toFixed(0)

  // Get trend for last 2 weeks (simulated)
  const trend = Math.random() > 0.5 ? 'up' : 'down'

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null

    const data = payload[0].payload
    return (
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-lg">
        <p className="font-semibold text-slate-900">{data.date}</p>
        <p className="text-sm text-slate-600">
          <span className="font-medium">{data.steps.toLocaleString()}</span> steps
        </p>
        <p className="text-sm font-medium" style={{ color: data.steps >= DAILY_GOAL ? '#10b981' : '#ef4444' }}>
          {data.achievement}% of goal
        </p>
      </div>
    )
  }

  // Custom bar color based on achievement
  const getBarColor = (value) => {
    return value >= DAILY_GOAL ? '#10b981' : '#f59e0b'
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-600 mb-1">Weekly Total</p>
          <p className="text-2xl font-bold text-slate-900">{totalSteps.toLocaleString()}</p>
          <p className="text-xs text-slate-600 mt-1">steps</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-600 mb-1">Daily Average</p>
          <p className="text-2xl font-bold text-slate-900">{avgSteps.toLocaleString()}</p>
          <p className="text-xs text-slate-600 mt-1">steps/day</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-600 mb-1">Goal Achievement</p>
          <p className={clsx('text-2xl font-bold', goalAchievement >= 100 ? 'text-success-green-600' : 'text-warning-orange-600')}>
            {goalAchievement}%
          </p>
          <p className="text-xs text-slate-600 mt-1">{daysAboveGoal}/7 days</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-600 mb-1">Trend</p>
          <div className="flex items-center gap-2">
            {trend === 'up' ? (
              <TrendingUp className="text-success-green-600" size={24} />
            ) : (
              <TrendingDown className="text-danger-red-600" size={24} />
            )}
            <p className={`text-xl font-bold ${trend === 'up' ? 'text-success-green-600' : 'text-danger-red-600'}`}>
              {trend === 'up' ? 'Improving' : 'Declining'}
            </p>
          </div>
        </div>
      </div>

      {/* Chart Card */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Weekly Steps</h3>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stepsData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#64748b" />
            <YAxis label={{ value: 'Steps', angle: -90, position: 'insideLeft' }} stroke="#64748b" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <ReferenceLine
              y={DAILY_GOAL}
              stroke="#3b82f6"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Daily Goal (10K)"
              label={{ value: '10K Goal', position: 'right', fill: '#3b82f6', fontSize: 12 }}
            />
            <Bar
              dataKey="steps"
              fill="#f59e0b"
              name="Steps"
              radius={[8, 8, 0, 0]}
              shape={<CustomBarShape getBarColor={getBarColor} />}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Daily Breakdown */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Daily Breakdown</h3>
        <div className="space-y-3">
          {stepsData.map((day, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50">
              <div className="flex-1">
                <p className="font-medium text-slate-900">{day.date}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 bg-slate-100 rounded-full h-2 max-w-xs">
                    <div
                      className={clsx('h-2 rounded-full transition-all', day.steps >= DAILY_GOAL ? 'bg-success-green-500' : 'bg-warning-orange-500')}
                      style={{ width: `${Math.min((day.steps / DAILY_GOAL) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="text-right ml-4">
                <p className="text-xl font-bold text-slate-900">{day.steps.toLocaleString()}</p>
                <p className={clsx('text-sm font-medium', day.steps >= DAILY_GOAL ? 'text-success-green-600' : 'text-warning-orange-600')}>
                  {day.achievement}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Insights */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Activity Insights</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-info-blue-50 border border-info-blue-200 rounded-lg">
            <span className="text-info-blue-900 text-2xl">💡</span>
            <div>
              <p className="font-medium text-info-blue-900">Daily Goal: {DAILY_GOAL.toLocaleString()} steps</p>
              <p className="text-sm text-info-blue-800">You're currently averaging {avgSteps.toLocaleString()} steps/day</p>
            </div>
          </div>

          {daysAboveGoal < 3 ? (
            <div className="flex items-start gap-3 p-3 bg-warning-orange-50 border border-warning-orange-200 rounded-lg">
              <span className="text-warning-orange-900 text-2xl">⚠️</span>
              <div>
                <p className="font-medium text-warning-orange-900">Below Average Activity</p>
                <p className="text-sm text-warning-orange-800">Only {daysAboveGoal} days met the daily goal. Consider taking short walks after meals.</p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-3 bg-success-green-50 border border-success-green-200 rounded-lg">
              <span className="text-success-green-900 text-2xl">✅</span>
              <div>
                <p className="font-medium text-success-green-900">Good Activity Level</p>
                <p className="text-sm text-success-green-800">{daysAboveGoal} days met the daily goal. Keep up the great work!</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-slate-900 text-2xl">📊</span>
            <div>
              <p className="font-medium text-slate-900">Weekly Statistics</p>
              <p className="text-sm text-slate-600">
                Max: {maxSteps.toLocaleString()} steps | Min: {minSteps.toLocaleString()} steps | Range: {(maxSteps - minSteps).toLocaleString()} steps
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Custom bar component to color bars based on achievement
function CustomBarShape(props) {
  const { fill, x, y, width, height, payload, getBarColor } = props
  if (!payload) return null

  const color = getBarColor(payload.steps)

  return (
    <rect x={x} y={y} width={width} height={height} fill={color} rx={8} ry={8} />
  )
}
