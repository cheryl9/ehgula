import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Heart } from 'lucide-react'
import clsx from 'clsx'
import { MOCK_HEART_RATE, HR_ZONES } from '../../api/dataProvider'

/**
 * HeartRateSummary - Heart rate zones and daily summary
 * Shows: HR trend chart, zone distribution, statistics
 */
export default function HeartRateSummary() {
  const heartRateData = MOCK_HEART_RATE

  // Calculate statistics
  const hrs = heartRateData.map((d) => d.hr)
  const avgHR = Math.round(hrs.reduce((a, b) => a + b, 0) / hrs.length)
  const maxHR = Math.max(...hrs)
  const minHR = Math.min(...hrs)
  const restingHR = hrs.filter((h) => h <= 60).length > 0 ? hrs.filter((h) => h <= 60)[0] : avgHR

  // Calculate zone distribution
  const zoneDistribution = {
    resting: hrs.filter((h) => h <= 60).length,
    light: hrs.filter((h) => h > 60 && h <= 100).length,
    moderate: hrs.filter((h) => h > 100 && h <= 140).length,
    vigorous: hrs.filter((h) => h > 140 && h <= 170).length,
    max: hrs.filter((h) => h > 170).length,
  }

  // Determine overall cardiac status
  const getCardiacStatus = () => {
    if (avgHR < 60) return { status: 'Low', color: 'text-info-blue-600', bg: 'bg-info-blue-50', desc: 'Excellent recovery' }
    if (avgHR < 80) return { status: 'Normal', color: 'text-success-green-600', bg: 'bg-success-green-50', desc: 'Healthy range' }
    if (avgHR < 100) return { status: 'Elevated', color: 'text-warning-orange-600', bg: 'bg-warning-orange-50', desc: 'Monitor activity' }
    return { status: 'High', color: 'text-danger-red-600', bg: 'bg-danger-red-50', desc: 'Stress detected' }
  }

  const cardiacStatus = getCardiacStatus()

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null

    const data = payload[0].payload
    return (
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-lg">
        <p className="font-semibold text-slate-900">{data.time}</p>
        <p className="text-lg font-bold" style={{ color: HR_ZONES[data.zone.toLowerCase()].color }}>
          {data.hr} bpm
        </p>
        <p className="text-sm text-slate-600">{data.zone} Zone</p>
      </div>
    )
  }

  const totalDataPoints = Object.values(zoneDistribution).reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className={clsx('rounded-lg border p-6', cardiacStatus.bg)}>
        <div className="flex items-start justify-between">
          <div>
            <p className={`text-sm font-medium ${cardiacStatus.color}`}>Average Heart Rate</p>
            <p className={`text-4xl font-bold ${cardiacStatus.color} mt-2`}>{avgHR} bpm</p>
            <p className="text-sm text-slate-600 mt-1">{cardiacStatus.desc}</p>
          </div>
          <Heart size={40} className={cardiacStatus.color} />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-600 mb-1">Resting HR</p>
          <p className="text-2xl font-bold text-info-blue-600">{restingHR} bpm</p>
          <p className="text-xs text-slate-600 mt-1">Sleep/rest</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-600 mb-1">Max HR</p>
          <p className={clsx('text-2xl font-bold', maxHR > 170 ? 'text-danger-red-600' : 'text-warning-orange-600')}>
            {maxHR} bpm
          </p>
          <p className="text-xs text-slate-600 mt-1">Peak activity</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-600 mb-1">HR Range</p>
          <p className="text-2xl font-bold text-slate-900">{maxHR - minHR} bpm</p>
          <p className="text-xs text-slate-600 mt-1">Variation</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-600 mb-1">HR Variability</p>
          <p className="text-2xl font-bold text-success-green-600">Good</p>
          <p className="text-xs text-slate-600 mt-1">Normal recovery</p>
        </div>
      </div>

      {/* Heart Rate Trend Chart */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">24-Hour Heart Rate Trend</h3>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={heartRateData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="time"
              angle={-45}
              textAnchor="end"
              height={80}
              tick={{ fontSize: 12 }}
              stroke="#64748b"
            />
            <YAxis label={{ value: 'Heart Rate (bpm)', angle: -90, position: 'insideLeft' }} stroke="#64748b" domain={[40, 200]} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <ReferenceLine
              y={60}
              stroke="#3b82f6"
              strokeDasharray="5 5"
              name="Resting Zone (60 bpm)"
              label={{ value: 'Resting', position: 'right', fill: '#3b82f6', fontSize: 12 }}
            />
            <ReferenceLine
              y={100}
              stroke="#10b981"
              strokeDasharray="5 5"
              name="Light Activity Zone (100 bpm)"
              label={{ value: 'Light', position: 'right', fill: '#10b981', fontSize: 12 }}
            />
            <Line
              type="monotone"
              dataKey="hr"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              name="Heart Rate"
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Zone Distribution */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Heart Rate Zone Distribution (24 hrs)</h3>
        <div className="space-y-4">
          {Object.entries(HR_ZONES).map(([key, zone]) => {
            const count = zoneDistribution[key]
            const percentage = ((count / totalDataPoints) * 100).toFixed(1)

            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: zone.color }} />
                    <span className="font-medium text-slate-900">{zone.label}</span>
                    <span className="text-xs text-slate-600">({zone.min}-{zone.max} bpm)</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900">{count}h</span>
                    <span className="text-sm text-slate-600 ml-2">{percentage}%</span>
                  </div>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{ width: `${percentage}%`, backgroundColor: zone.color }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Insights */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Heart Health Insights</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-info-blue-50 border border-info-blue-200 rounded-lg">
            <span className="text-info-blue-900 text-2xl">💡</span>
            <div>
              <p className="font-medium text-info-blue-900">Target Heart Rate Zone</p>
              <p className="text-sm text-info-blue-800">
                For moderate activity: {Math.round(avgHR * 0.6)}-{Math.round(avgHR * 0.8)} bpm
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-success-green-50 border border-success-green-200 rounded-lg">
            <span className="text-success-green-900 text-2xl">✅</span>
            <div>
              <p className="font-medium text-success-green-900">Good Heart Rate Variability</p>
              <p className="text-sm text-success-green-800">
                Your HR variation of {maxHR - minHR} bpm indicates good cardiac health and recovery capability.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-slate-900 text-2xl">📊</span>
            <div>
              <p className="font-medium text-slate-900">Activity Recommendation</p>
              <p className="text-sm text-slate-600">
                You spent {zoneDistribution.vigorous + zoneDistribution.max}h in high-intensity zones. Maintain regular aerobic exercise.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
