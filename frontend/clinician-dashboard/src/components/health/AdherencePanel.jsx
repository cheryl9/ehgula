import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { TrendingUp, TrendingDown } from 'lucide-react'

/**
 * AdherencePanel - Medication adherence visualization
 * Shows: Adherence % per medication with trend
 */
export default function AdherencePanel({ medicationData }) {
  const medications = Array.isArray(medicationData?.medications)
    ? medicationData.medications.map((med, idx) => ({
      id: med.medication_id || med.id || `${med.name || 'med'}-${idx}`,
      name: med.name || 'Unknown',
      dose: med.dose || 'N/A',
      frequency: med.frequency || 'N/A',
      adherence: Number.isFinite(Number(med.adherence_pct ?? med.adherence))
        ? Number(med.adherence_pct ?? med.adherence)
        : 0,
      trend: (med.trend || 'stable').toLowerCase(),
      lastTaken: med.last_taken || 'N/A',
      nextDue: med.next_due || 'N/A',
    }))
    : []

  // Data for bar chart
  const chartData = medications.map((med) => ({
    name: med.name.substring(0, 8),
    adherence: med.adherence,
    color:
      med.adherence >= 90
        ? '#10b981'
        : med.adherence >= 80
          ? '#f59e0b'
          : '#ef4444',
  }))

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="rounded-lg bg-white p-2 shadow-lg border border-slate-200">
          <p className="text-sm font-semibold text-slate-900">{data.name}</p>
          <p className="text-sm text-info-blue-600">{data.adherence}%</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Overview Bar Chart */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Medication Adherence</h2>
        <p className="text-sm text-slate-600 mb-4">
          Overall: {Number.isFinite(Number(medicationData?.overall_adherence_pct))
            ? `${Number(medicationData.overall_adherence_pct)}%`
            : 'N/A'}
        </p>

        {chartData.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center text-slate-600">
            No medication adherence data available for this patient.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '12px' }} />
              <YAxis domain={[0, 100]} stroke="#64748b" style={{ fontSize: '12px' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="adherence" fill="#8884d8" name="Adherence %">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* Target Reference */}
        <div className="mt-4 flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success-green-500"></div>
            <span className="text-slate-700">Excellent (≥90%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-warning-orange-500"></div>
            <span className="text-slate-700">Good (80-89%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-danger-red-500"></div>
            <span className="text-slate-700">Concerning ({`<80%`})</span>
          </div>
        </div>
      </div>

      {/* Detailed Medication List */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="text-sm font-semibold text-slate-900">Medication Details</h3>
        </div>

        <div className="divide-y divide-slate-200">
          {medications.length === 0 ? (
            <div className="p-6 text-sm text-slate-600">No medication records available.</div>
          ) : medications.map((med) => {
            const statusColor =
              med.adherence >= 90
                ? 'bg-success-green-50 border-success-green-200'
                : med.adherence >= 80
                  ? 'bg-warning-orange-50 border-warning-orange-200'
                  : 'bg-danger-red-50 border-danger-red-200'

            const adherenceColor =
              med.adherence >= 90
                ? 'text-success-green-700 bg-success-green-100'
                : med.adherence >= 80
                  ? 'text-warning-orange-700 bg-warning-orange-100'
                  : 'text-danger-red-700 bg-danger-red-100'

            return (
              <div key={med.id} className={`p-4 border-l-4 transition-colors hover:bg-slate-50 ${statusColor}`}>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                  {/* Medication Name & Dose */}
                  <div>
                    <p className="font-semibold text-slate-900">{med.name}</p>
                    <p className="text-sm text-slate-600">
                      {med.dose} • {med.frequency}
                    </p>
                  </div>

                  {/* Adherence % */}
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Adherence</p>
                    <div className="flex items-center gap-2">
                      <div className={`px-2 py-1 rounded text-sm font-bold ${adherenceColor}`}>
                        {med.adherence}%
                      </div>
                    </div>
                  </div>

                  {/* Trend */}
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Trend</p>
                    <div className="flex items-center gap-1">
                      {med.trend === 'up' ? (
                        <>
                          <TrendingUp className="text-success-green-600" size={16} />
                          <span className="text-sm text-success-green-700 font-medium">Improving</span>
                        </>
                      ) : med.trend === 'down' ? (
                        <>
                          <TrendingDown className="text-danger-red-600" size={16} />
                          <span className="text-sm text-danger-red-700 font-medium">Declining</span>
                        </>
                      ) : (
                        <span className="text-sm text-slate-600">Stable</span>
                      )}
                    </div>
                  </div>

                  {/* Last Taken */}
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Last Taken</p>
                    <p className="text-sm font-medium text-slate-900">{med.lastTaken}</p>
                  </div>

                  {/* Next Due */}
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Next Due</p>
                    <p className="text-sm font-medium text-slate-900">{med.nextDue}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
