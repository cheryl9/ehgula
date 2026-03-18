import { useState } from 'react'
import UrgencyBadge from './UrgencyBadge'

// Mock suggestion data - in real app, this would come from AI
const mockSuggestion = {
  suggestedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
  urgency: 'soon',
  urgencyScore: 62,
  factors: [
    {
      label: 'Days since last visit',
      value: '32 days',
      weight: 'High',
      detail: 'Last appointment was March 10, recommend follow-up within 4 weeks'
    },
    {
      label: 'Glucose stability',
      value: 'Moderate',
      weight: 'Medium',
      detail: 'Some spikes detected but overall trending stable'
    },
    {
      label: 'Medication adherence',
      value: '78%',
      weight: 'High',
      detail: 'Adherence declining - regular check-in recommended'
    },
    {
      label: 'Meal pattern issues',
      value: 'Recurring lunch skips',
      weight: 'Medium',
      detail: 'May benefit from discussion about meal timing strategies'
    }
  ],
  reason: 'Routine follow-up with focus on medication adherence and meal patterns'
}

export default function NextAppointmentSuggestion({ patientId }) {
  const [bookingRequest, setBookingRequest] = useState(false)

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const handleBookAppointment = () => {
    // In real app, this would call API to create appointment
    alert(`Appointment booked for ${formatDate(mockSuggestion.suggestedDate)}`)
    setBookingRequest(false)
  }

  return (
    <div className="bg-success-green-50 border border-success-green-200 rounded-lg p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Recommended Next Appointment</h3>
          <p className="text-sm text-slate-600 mt-1">AI-recommended scheduling based on patient metrics</p>
        </div>
        <UrgencyBadge level={mockSuggestion.urgency} score={mockSuggestion.urgencyScore} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <div className="text-sm font-medium text-slate-600 mb-1">Suggested Date</div>
          <div className="text-2xl font-bold text-success-green-700">
            {formatDate(mockSuggestion.suggestedDate)}
          </div>
          <div className="text-sm text-slate-600 mt-2">
            ({Math.ceil((mockSuggestion.suggestedDate - new Date()) / (1000 * 60 * 60 * 24))} days from now)
          </div>
        </div>

        <div>
          <div className="text-sm font-medium text-slate-600 mb-1">Recommended Reason</div>
          <div className="text-lg font-semibold text-slate-900">
            {mockSuggestion.reason}
          </div>
        </div>
      </div>

      {/* Contributing Factors */}
      <div className="mb-6">
        <h4 className="font-semibold text-slate-900 mb-3">Contributing Factors</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {mockSuggestion.factors.map((factor, idx) => (
            <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 hover:border-success-green-300 transition-colors">
              <div className="flex items-start justify-between mb-1">
                <span className="font-medium text-slate-900">{factor.label}</span>
                <span className={`text-xs font-semibold px-2 py-1 rounded ${
                  factor.weight === 'High'
                    ? 'bg-danger-red-100 text-danger-red-700'
                    : 'bg-warning-orange-100 text-warning-orange-700'
                }`}>
                  {factor.weight}
                </span>
              </div>
              <div className="text-sm text-info-blue-600 font-semibold mb-1">{factor.value}</div>
              <div className="text-xs text-slate-600">{factor.detail}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => setBookingRequest(true)}
          className="flex-1 px-4 py-3 bg-info-blue-600 text-white rounded-lg font-semibold hover:bg-info-blue-700 transition-colors flex items-center justify-center gap-2 shadow-md"
        >
          <span>✅</span>
          Confirm & Book Appointment
        </button>
        <button
          className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
        >
          Defer Decision
        </button>
      </div>

      {/* Booking Confirmation */}
      {bookingRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Confirm Appointment Booking</h3>
            <div className="space-y-3 mb-6 text-sm">
              <p className="text-slate-700">
                <strong>Date:</strong> {formatDate(mockSuggestion.suggestedDate)}
              </p>
              <p className="text-slate-700">
                <strong>Reason:</strong> {mockSuggestion.reason}
              </p>
              <p className="text-slate-700">
                <strong>Urgency:</strong> Follow-up (non-urgent)
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setBookingRequest(false)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBookAppointment}
                className="flex-1 px-4 py-2 bg-success-green-600 text-white rounded-lg font-medium hover:bg-success-green-700 transition-colors"
              >
                Book Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
