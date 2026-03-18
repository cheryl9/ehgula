export default function Reports() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Analytics & Reports</h1>
        <p className="text-slate-600 mt-2">📊 Coming in Phase 7</p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
        <p className="text-slate-600">Population-level analytics will include:</p>
        <ul className="mt-4 space-y-2 text-sm text-slate-600 max-w-md mx-auto text-left">
          <li>✓ Cohort overview metrics</li>
          <li>✓ At-risk patient identification</li>
          <li>✓ Population trends (adherence, glucose)</li>
          <li>✓ Weekly digest summaries</li>
        </ul>
      </div>
    </div>
  )
}
