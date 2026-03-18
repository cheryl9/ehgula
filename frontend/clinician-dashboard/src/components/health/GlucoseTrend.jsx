import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts'
import { useMemo, useState } from 'react'
import clsx from 'clsx'

/**
 * GlucoseTrend - Multi-day glucose trend chart with target zone
 * Shows: Fasting vs Post-meal readings, target range, trend
 */
export default function GlucoseTrend({ glucoseData }) {
  const [timeRange, setTimeRange] = useState('7') // '7', '14', '30'

  const chartData = useMemo(() => {
    const rows = Array.isArray(glucoseData?.readings) ? glucoseData.readings : []
    if (!rows.length) {
      return []
    }

    const days = Number(timeRange)
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - (days - 1))
    cutoff.setHours(0, 0, 0, 0)

    const dayBuckets = new Map()
    for (const row of rows) {
      const tsValue = row.timestamp || row.time || row.date
      if (!tsValue) continue
      const ts = new Date(tsValue)
      if (Number.isNaN(ts.getTime()) || ts < cutoff) continue

      const key = ts.toISOString().slice(0, 10)
      if (!dayBuckets.has(key)) {
        dayBuckets.set(key, [])
      }

      const value = Number(row.value_mmol ?? row.value)
      if (Number.isFinite(value)) {
        dayBuckets.get(key).push({ ts, value, type: row.reading_type || row.type || 'normal' })
      }
    }

    return Array.from(dayBuckets.entries())
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .map(([isoDate, dayRows]) => {
        const avg = dayRows.reduce((sum, item) => sum + item.value, 0) / dayRows.length
        const dt = new Date(`${isoDate}T00:00:00`)
        return {
          date: dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          time: 'Daily avg',
          type: 'Daily average',
          value: avg,
        }
      })
  }, [glucoseData, timeRange])

  // Calculate statistics
  const values = chartData.map((d) => d.value)
  const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null
  const avgGlucose = avg !== null ? avg.toFixed(1) : 'N/A'
  const minGlucose = values.length ? Math.min(...values).toFixed(1) : 'N/A'
  const maxGlucose = values.length ? Math.max(...values).toFixed(1) : 'N/A'
  const stdDev = values.length && avg !== null
    ? Math.sqrt(values.reduce((sq, n) => sq + Math.pow(n - avg, 2), 0) / values.length).toFixed(1)
    : 'N/A'

  // Count readings in range
  const inRange = values.filter((v) => v >= 4.5 && v <= 8.0).length
  const inRangePercent = values.length ? ((inRange / values.length) * 100).toFixed(0) : '0'

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="rounded-lg bg-white p-3 shadow-lg border border-slate-200">
          <p className="text-sm font-semibold text-slate-900">{data.date}</p>
          <p className="text-xs text-slate-600">{data.time}</p>
          <p className="text-sm font-bold text-info-blue-600">
            {data.value.toFixed(1)} mmol/L
          </p>
          <p className="text-xs text-slate-500 mt-1">{data.type}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Glucose Trend</h2>
          <p className="text-sm text-slate-600">Blood glucose readings over time</p>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2">
          {['7', '14', '30'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={clsx(
                'px-3 py-1 text-sm font-medium rounded-lg transition-colors',
                timeRange === range
                  ? 'bg-info-blue-500 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              )}
            >
              {range}d
            </button>
          ))}
        </div>
      </div>

      {/* Statistics Row */}
      <div className="grid grid-cols-4 gap-4 mb-6 pb-6 border-b border-slate-200">
        <div>
          <p className="text-xs text-slate-600 mb-1">Average</p>
          <p className="text-lg font-bold text-slate-900">{avgGlucose}</p>
          <p className="text-xs text-slate-500">mmol/L</p>
        </div>
        <div>
          <p className="text-xs text-slate-600 mb-1">Range</p>
          <p className="text-lg font-bold text-slate-900">
            {minGlucose} - {maxGlucose}
          </p>
          <p className="text-xs text-slate-500">mmol/L</p>
        </div>
        <div>
          <p className="text-xs text-slate-600 mb-1">Std Dev</p>
          <p className="text-lg font-bold text-slate-900">{stdDev}</p>
          <p className="text-xs text-slate-500">variability</p>
        </div>
        <div>
          <p className="text-xs text-slate-600 mb-1">In Target</p>
          <p className="text-lg font-bold text-success-green-600">{inRangePercent}%</p>
          <p className="text-xs text-slate-500">4.5-8.0 mmol/L</p>
        </div>
      </div>

      {/* Chart */}
      {chartData.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center text-slate-600">
          No glucose readings available for this patient in the selected range.
        </div>
      ) : (
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: '12px' }} />
          <YAxis 
            domain={[3, 11]} 
            stroke="#64748b"
            label={{ value: 'mmol/L', angle: -90, position: 'insideLeft' }}
            style={{ fontSize: '12px' }}
          />

          {/* Target Range Background */}
          <ReferenceLine 
            y={4.5} 
            stroke="#10b981" 
            strokeWidth={2}
            strokeDasharray="5 5"
            label={{ value: 'Min Target (4.5)', position: 'right', fill: '#10b981', fontSize: 12 }}
          />
          <ReferenceLine 
            y={8.0} 
            stroke="#10b981" 
            strokeWidth={2}
            strokeDasharray="5 5"
            label={{ value: 'Max Target (8.0)', position: 'right', fill: '#10b981', fontSize: 12 }}
          />

          {/* Danger Zones */}
          <ReferenceLine 
            y={3.8} 
            stroke="#ef4444" 
            strokeWidth={1}
            strokeDasharray="3 3"
            label={{ value: 'Low (3.8)', position: 'right', fill: '#ef4444', fontSize: 11 }}
          />
          <ReferenceLine 
            y={9.0} 
            stroke="#ef4444" 
            strokeWidth={1}
            strokeDasharray="3 3"
            label={{ value: 'High (9.0)', position: 'right', fill: '#ef4444', fontSize: 11 }}
          />

          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />
          <Line 
            type="monotone"
            dataKey="value"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 4 }}
            activeDot={{ r: 6 }}
            name="Glucose (mmol/L)"
          />
        </LineChart>
      </ResponsiveContainer>
      )}

      {/* Legend/Key */}
      <div className="mt-6 pt-6 border-t border-slate-200 grid grid-cols-4 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-success-green-500"></div>
          <span className="text-slate-700">Target Range</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-danger-red-500"></div>
          <span className="text-slate-700">Danger Zones</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-info-blue-500"></div>
          <span className="text-slate-700">Your Readings</span>
        </div>
        <button className="text-info-blue-600 hover:text-info-blue-700 font-medium">
          ↓ Download PDF
        </button>
      </div>
    </div>
  )
}
