import { useState } from 'react'
import { X } from 'lucide-react'

export default function RescheduleModal({ appointment, onConfirm, onClose }) {
  const [reason, setReason] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!reason.trim() || !newDate || !newTime) {
      alert('Please fill in all fields')
      return
    }

    const updatedApt = {
      ...appointment,
      date: new Date(newDate),
      time: newTime,
      reason: `Rescheduled: ${reason}`
    }

    onConfirm(updatedApt)
  }

  // Generate available time slots
  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '14:00', '14:30', '15:00',
    '15:30', '16:00', '16:30', '17:00'
  ]

  // Get next 30 days available dates
  const availableDates = []
  for (let i = 1; i <= 30; i++) {
    const date = new Date()
    date.setDate(date.getDate() + i)
    // Skip weekends
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      availableDates.push(date.toISOString().split('T')[0])
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Reschedule Appointment</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded transition-colors"
          >
            <X size={20} className="text-slate-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Current Appointment
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
              Reason for Rescheduling
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Patient requested new time, Schedule conflict..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-info-blue-500 text-sm"
              rows="3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              New Date
            </label>
            <select
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-info-blue-500 text-sm"
            >
              <option value="">Select a date...</option>
              {availableDates.map((date) => (
                <option key={date} value={date}>
                  {new Date(date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              New Time
            </label>
            <select
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-info-blue-500 text-sm"
            >
              <option value="">Select a time...</option>
              {timeSlots.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-info-blue-600 text-white rounded-lg font-medium hover:bg-info-blue-700 transition-colors"
            >
              Confirm Reschedule
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
