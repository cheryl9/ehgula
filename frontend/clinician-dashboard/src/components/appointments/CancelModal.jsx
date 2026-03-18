import { useState } from 'react'
import { X } from 'lucide-react'

export default function CancelModal({ appointment, onConfirm, onClose }) {
  const [reason, setReason] = useState('')
  const [notifyPatient, setNotifyPatient] = useState(true)

  const cancelReasons = [
    'Patient requested cancellation',
    'Doctor scheduling conflict',
    'Clinic unavailable',
    'Patient no longer needs appointment',
    'Medical emergency',
    'Other (specify in notes)'
  ]

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!reason.trim()) {
      alert('Please select or provide a cancellation reason')
      return
    }

    const updatedApt = {
      ...appointment,
      status: 'cancelled',
      cancelReason: reason,
      cancelNotified: notifyPatient
    }

    onConfirm(updatedApt)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Cancel Appointment</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded transition-colors"
          >
            <X size={20} className="text-slate-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-danger-red-50 border border-danger-red-200 rounded-lg">
            <p className="text-sm text-danger-red-900">
              ⚠️ This will cancel the appointment and cannot be undone. Patient will be notified.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Appointment to Cancel
            </label>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-900 font-medium">{appointment?.doctor}</p>
              <p className="text-xs text-slate-600">{appointment?.clinic}</p>
              <p className="text-xs text-slate-500 mt-1">
                {appointment?.date.toLocaleDateString()} at {appointment?.time}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Cancellation Reason
            </label>
            <div className="space-y-2">
              {cancelReasons.map((r) => (
                <label key={r} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={reason === r}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-4 h-4 text-info-blue-600"
                  />
                  <span className="text-sm text-slate-700">{r}</span>
                </label>
              ))}
            </div>
          </div>

          {reason === 'Other (specify in notes)' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Specify Reason
              </label>
              <textarea
                placeholder="Please explain the cancellation reason..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-info-blue-500 text-sm"
                rows="3"
                onChange={(e) => setReason(`Other: ${e.target.value}`)}
              />
            </div>
          )}

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={notifyPatient}
              onChange={(e) => setNotifyPatient(e.target.checked)}
              className="w-4 h-4 text-info-blue-600 rounded"
            />
            <span className="text-sm text-slate-700">Notify patient of cancellation</span>
          </label>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
            >
              Keep Appointment
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-danger-red-600 text-white rounded-lg font-medium hover:bg-danger-red-700 transition-colors"
            >
              Cancel Appointment
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
