import { AlertTriangle, Clock } from 'lucide-react'
import clsx from 'clsx'

/**
 * SittingLog - Sitting episodes timeline
 * Shows: Continuous sitting periods, duration, recommendations
 */
export default function SittingLog({ exerciseData }) {
  const MAX_CONTINUOUS_SITTING = 60 // minutes
  const sittingEpisodes = Array.isArray(exerciseData?.sitting) ? exerciseData.sitting : []

  if (!sittingEpisodes.length) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-600">
        No sitting episode data available for this patient.
      </div>
    )
  }

  // Calculate statistics
  const totalSittingTime = sittingEpisodes.reduce((sum, ep) => sum + ep.duration, 0)
  const avgEpisodeDuration = (totalSittingTime / sittingEpisodes.length).toFixed(0)
  const maxContinuousSitting = Math.max(...sittingEpisodes.map((ep) => ep.duration))
  const prolongedEpisodes = sittingEpisodes.filter((ep) => ep.exceedsLimit).length
  const exceedingPercent = ((prolongedEpisodes / sittingEpisodes.length) * 100).toFixed(0)

  // Get recommendations
  const getRecommendations = () => {
    const recs = []

    if (prolongedEpisodes > 2) {
      recs.push({
        id: 1,
        type: 'warning',
        title: 'Frequent Prolonged Sitting',
        text: `${prolongedEpisodes} episodes exceeded 60 minutes. Consider taking breaks every hour.`,
      })
    }

    if (maxContinuousSitting > 120) {
      recs.push({
        id: 2,
        type: 'critical',
        title: 'Extended Sitting Period',
        text: `${maxContinuousSitting} minutes of continuous sitting detected. Take a 10-minute break immediately.`,
      })
    }

    if (recs.length === 0) {
      recs.push({
        id: 3,
        type: 'success',
        title: 'Good Movement Patterns',
        text: 'You maintained regular breaks. Keep up the healthy sitting habits!',
      })
    }

    return recs
  }

  const recommendations = getRecommendations()

  // Format time duration
  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  // Get color intensity for duration
  const getDurationColor = (duration) => {
    if (duration > MAX_CONTINUOUS_SITTING + 30) {
      return 'bg-danger-red-50 border-danger-red-200'
    }
    if (duration > MAX_CONTINUOUS_SITTING) {
      return 'bg-warning-orange-50 border-warning-orange-200'
    }
    return 'bg-success-green-50 border-success-green-200'
  }

  const getDurationTextColor = (duration) => {
    if (duration > MAX_CONTINUOUS_SITTING + 30) {
      return 'text-danger-red-900'
    }
    if (duration > MAX_CONTINUOUS_SITTING) {
      return 'text-warning-orange-900'
    }
    return 'text-success-green-900'
  }

  const getDurationBadgeColor = (duration) => {
    if (duration > MAX_CONTINUOUS_SITTING + 30) {
      return 'bg-danger-red-100 text-danger-red-800'
    }
    if (duration > MAX_CONTINUOUS_SITTING) {
      return 'bg-warning-orange-100 text-warning-orange-800'
    }
    return 'bg-success-green-100 text-success-green-800'
  }

  return (
    <div className="space-y-6">
      {/* Recommendations */}
      <div className="space-y-3">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className={clsx(
              'flex items-start gap-3 rounded-lg border p-4',
              rec.type === 'critical'
                ? 'bg-danger-red-50 border-danger-red-200'
                : rec.type === 'warning'
                  ? 'bg-warning-orange-50 border-warning-orange-200'
                  : 'bg-success-green-50 border-success-green-200'
            )}
          >
            {rec.type !== 'success' && (
              <AlertTriangle
                size={20}
                className={rec.type === 'critical' ? 'text-danger-red-600' : 'text-warning-orange-600'}
              />
            )}
            {rec.type === 'success' && <span className="text-xl">✅</span>}
            <div>
              <p
                className={`font-semibold ${
                  rec.type === 'critical'
                    ? 'text-danger-red-900'
                    : rec.type === 'warning'
                      ? 'text-warning-orange-900'
                      : 'text-success-green-900'
                }`}
              >
                {rec.title}
              </p>
              <p
                className={`text-sm ${
                  rec.type === 'critical'
                    ? 'text-danger-red-700'
                    : rec.type === 'warning'
                      ? 'text-warning-orange-700'
                      : 'text-success-green-700'
                }`}
              >
                {rec.text}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Stats Card */}
      <div className="rounded-lg border border-slate-200 bg-white">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="text-lg font-semibold text-slate-900">Sitting Analysis</h3>
          <p className="text-sm text-slate-600">
            {sittingEpisodes.length} episodes • {formatDuration(totalSittingTime)} total • {exceedingPercent}% exceed 60min limit
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="text-center">
            <p className="text-xs text-slate-600 mb-1">Total Episodes</p>
            <p className="text-2xl font-bold text-slate-900">{sittingEpisodes.length}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-600 mb-1">Avg Duration</p>
            <p className="text-2xl font-bold text-slate-900">{avgEpisodeDuration}m</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-600 mb-1">Max Duration</p>
            <p className={clsx('text-2xl font-bold', getDurationTextColor(maxContinuousSitting))}>
              {maxContinuousSitting}m
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-600 mb-1">Prolonged Episodes</p>
            <p className="text-2xl font-bold text-warning-orange-600">{prolongedEpisodes}</p>
          </div>
        </div>

        {/* Episodes Timeline */}
        <div className="p-6">
          <h4 className="text-sm font-semibold text-slate-900 mb-4">Today's Sitting Episodes</h4>
          <div className="space-y-3">
            {sittingEpisodes.map((episode) => (
              <div
                key={episode.id}
                className={clsx('rounded-lg border p-4 transition-all hover:shadow-md', getDurationColor(episode.duration))}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Clock size={16} className="text-slate-500" />
                      <span className="font-medium text-slate-900">
                        {episode.startTime} - {episode.endTime}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{episode.location}</p>
                  </div>

                  <div className="text-right">
                    <span className={clsx('inline-block px-3 py-1 rounded-full text-sm font-medium', getDurationBadgeColor(episode.duration))}>
                      {episode.duration}m
                    </span>
                    {episode.exceedsLimit && (
                      <p className="text-xs text-warning-orange-700 mt-1 font-medium">Exceeds limit</p>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-200 rounded-full h-2">
                    <div
                      className={clsx(
                        'h-2 rounded-full transition-all',
                        episode.duration > MAX_CONTINUOUS_SITTING + 30
                          ? 'bg-danger-red-500'
                          : episode.duration > MAX_CONTINUOUS_SITTING
                            ? 'bg-warning-orange-500'
                            : 'bg-success-green-500'
                      )}
                      style={{ width: `${Math.min((episode.duration / 120) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-600 whitespace-nowrap">
                    {((episode.duration / 120) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="px-6 py-4 border-t border-slate-200 bg-info-blue-50">
          <p className="text-sm font-medium text-info-blue-900 mb-2">💡 Tips for Healthy Sitting Habits</p>
          <ul className="text-sm text-info-blue-800 space-y-1">
            <li>• Stand or walk for at least 5 minutes every hour</li>
            <li>• Take stairs instead of the elevator when possible</li>
            <li>• Do light stretches during breaks</li>
            <li>• Stay hydrated - refill your water bottle frequently</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
