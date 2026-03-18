import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts'
import { useState } from 'react'
import clsx from 'clsx'

/**
 * GlucoseTrend - Multi-day glucose trend chart with target zone
 * Shows: Fasting vs Post-meal readings, target range, trend
 */
export default function GlucoseTrend({ patientId = null }) {
  const [timeRange, setTimeRange] = useState('7') // '7', '14', '30'

  // Mock glucose data for 30 days
  const generateGlucoseData = (days) => {
    const data = []
    const today = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

      // Morning fasting readings (7-8 AM)
      data.push({
        date: dateStr,
        time: '7:30 AM',
        type: 'Fasting',
        value: 6.5 + Math.random() * 2.5, // 6.5-9.0
        readings: [
          { time: '7:30 AM', value: 6.5 + Math.random() * 2.5, type: 'Fasting' },
          { time: '9:00 AM', value: 7.2 + Math.random() * 2.5, type: 'Post-meal' },
          { time: '1:00 PM', value: 8.1 + Math.random() * 2.0, type: 'Post-meal' },
          { time: '6:30 PM', value: 7.0 + Math.random() * 2.5, type: 'Post-meal' },
        ],
      })
    }

    return data
  }

  const glucoseData = generateGlucoseData(parseInt(timeRange))

  // Calculate statistics
  const values = glucoseData.map((d) => d.value)
  const avgGlucose = (values.reduce((a, b) => a + b) / values.length).toFixed(1)
  const minGlucose = Math.min(...values).toFixed(1)
  const maxGlucose = Math.max(...values).toFixed(1)
  const stdDev = (Math.sqrt(values.reduce((sq, n) => sq + Math.pow(n - avgGlucose, 2)) / values.length).toFixed(1))

  // Count readings in range
  const inRange = values.filter((v) => v >= 4.5 && v <= 8.0).length
  const inRangePercent = ((inRange / values.length) * 100).toFixed(0)

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
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={glucoseData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
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
