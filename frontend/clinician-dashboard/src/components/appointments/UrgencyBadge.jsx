export default function UrgencyBadge({ level, score }) {
  const getUrgencyDetails = (level) => {
    const levels = {
      urgent: {
        label: 'Urgent',
        bgColor: 'bg-danger-red-50',
        textColor: 'text-danger-red-700',
        borderColor: 'border-danger-red-200',
        icon: '🔴'
      },
      soon: {
        label: 'Scheduled Soon',
        bgColor: 'bg-warning-orange-50',
        textColor: 'text-warning-orange-700',
        borderColor: 'border-warning-orange-200',
        icon: '🟡'
      },
      routine: {
        label: 'Routine',
        bgColor: 'bg-success-green-50',
        textColor: 'text-success-green-700',
        borderColor: 'border-success-green-200',
        icon: '🟢'
      }
    }
    return levels[level] || levels.routine
  }

  const details = getUrgencyDetails(level)

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-sm font-medium ${details.bgColor} ${details.textColor} ${details.borderColor}`}>
      <span>{details.icon}</span>
      <span>{details.label}</span>
      {score && <span className="ml-1 font-bold">({score})</span>}
    </span>
  )
}
