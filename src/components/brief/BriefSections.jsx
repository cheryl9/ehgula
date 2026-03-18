/**
 * Brief Sections Component
 * Displays all sections of a doctor brief:
 * - Executive Summary
 * - Glucose Trends
 * - Medication Adherence
 * - Meal Patterns
 * - Exercise Activity
 * - Key Concerns
 * - Recommended Agenda
 * - Alerts
 */

import React from 'react';
import {
  AlertCircle,
  TrendingUp,
  Pill,
  Utensils,
  Activity,
  AlertTriangle,
  CheckCircle,
  Copy
} from 'lucide-react';

const BriefSections = ({ brief, onAddNote, personalNotes = '' }) => {
  const getGlucoseTrendIcon = (score) => {
    if (score === 'LOW') return <TrendingUp className="text-green-600 w-5 h-5" />;
    if (score === 'MODERATE') return <TrendingUp className="text-orange-500 w-5 h-5" />;
    return <TrendingUp className="text-red-600 w-5 h-5" />;
  };

  const getAdherenceColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600 bg-green-50';
    if (percentage >= 75) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'CRITICAL':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'HIGH':
        return 'bg-orange-50 border-orange-200 text-orange-900';
      case 'MEDIUM':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'WARNING':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-900';
    }
  };

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <section className="bg-blue-50 border-l-4 border-blue-500 p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Executive Summary</h3>
        <p className="text-blue-800 text-sm leading-relaxed">{brief.executiveSummary}</p>
      </section>

      {/* Critical Alerts */}
      {brief.alerts && brief.alerts.length > 0 && (
        <section>
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Alerts for Clinician
          </h3>
          <div className="space-y-2">
            {brief.alerts.map((alert, idx) => (
              <div
                key={idx}
                className={`border border-l-4 p-3 rounded ${getSeverityColor(alert.severity)}`}
                style={{
                  borderLeftColor: alert.severity === 'CRITICAL' ? '#dc2626' :
                                   alert.severity === 'HIGH' ? '#ea580c' :
                                   alert.severity === 'WARNING' ? '#eab308' : '#3b82f6'
                }}
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg">{alert.icon}</span>
                  <div>
                    <p className="font-medium">{alert.title}</p>
                    <p className="text-sm">{alert.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Glucose Trends */}
      <section className="border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Glucose Trends (Last 30 Days)
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Average</p>
            <p className="text-2xl font-bold text-gray-900">{brief.glucoseTrends.last30DaysAvg}</p>
            <p className="text-xs text-gray-500">Target: {brief.glucoseTrends.targetAvg}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Instability Score</p>
            <div className="flex items-center gap-2 mt-1">
              {getGlucoseTrendIcon(brief.glucoseTrends.instabilityScore)}
              <span className={brief.glucoseTrends.instabilityScore === 'LOW' ? 'text-green-600' :
                               brief.glucoseTrends.instabilityScore === 'MODERATE' ? 'text-orange-600' : 'text-red-600'}>
                {brief.glucoseTrends.instabilityScore}
              </span>
            </div>
            <p className="text-xs text-gray-500">SD: {brief.glucoseTrends.standardDeviation}</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">Pattern</p>
          <p className="text-sm text-gray-900">{brief.glucoseTrends.pattern}</p>
          {brief.glucoseTrends.concerns && brief.glucoseTrends.concerns.length > 0 && (
            <div className="mt-3 space-y-1">
              <p className="text-xs font-semibold text-red-600">Concerns:</p>
              {brief.glucoseTrends.concerns.map((concern, idx) => (
                <p key={idx} className="text-xs text-red-700">• {concern}</p>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Medication Adherence */}
      <section className="border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Pill className="w-5 h-5 text-purple-600" />
          Medication Adherence
        </h3>
        <div className="mb-4">
          <div className="flex justify-between items-end mb-2">
            <p className="text-sm text-gray-600">Overall</p>
            <p className="text-2xl font-bold text-gray-900">{brief.medicationAdherence.overallPercentage}%</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full"
              style={{ width: `${brief.medicationAdherence.overallPercentage}%` }}
            />
          </div>
        </div>
        <div className="space-y-3">
          {brief.medicationAdherence.medications.map((med, idx) => (
            <div key={idx} className={`p-2 rounded ${getAdherenceColor(med.adherencePercentage)}`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-sm">{med.name}</p>
                  <p className="text-xs">{med.status}</p>
                  {med.missedDoses && <p className="text-xs">{med.missedDoses} missed doses</p>}
                  {med.note && <p className="text-xs italic">{med.note}</p>}
                </div>
                <p className="text-lg font-bold">{med.adherencePercentage}%</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Meal Patterns */}
      <section className="border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Utensils className="w-5 h-5 text-orange-600" />
          Meal & Nutrition Patterns
        </h3>
        <div className="space-y-3">
          {['breakfast', 'lunch', 'dinner'].map((meal) => (
            <div key={meal} className="border border-gray-200 rounded p-3">
              <div className="flex justify-between items-start mb-1">
                <p className="font-medium text-sm capitalize">{meal}</p>
                <span className={`text-xs font-bold px-2 py-1 rounded ${
                  brief.mealPatterns[meal].status === 'EXCELLENT' ? 'bg-green-100 text-green-700' :
                  brief.mealPatterns[meal].status === 'GOOD' ? 'bg-green-100 text-green-700' :
                  brief.mealPatterns[meal].status === 'PROBLEM' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {brief.mealPatterns[meal].loggedPercentage}% logged
                </span>
              </div>
              <p className="text-sm text-gray-600">{brief.mealPatterns[meal].pattern}</p>
            </div>
          ))}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-sm text-gray-600">{brief.mealPatterns.overallAssessment}</p>
            {brief.mealPatterns.confidence && (
              <p className="text-xs text-green-700 mt-1">✓ {brief.mealPatterns.confidence}</p>
            )}
          </div>
        </div>
      </section>

      {/* Exercise & Activity */}
      <section className="border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Activity className="w-5 h-5 text-green-600" />
          Exercise & Activity
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Weekly Steps</p>
            <p className="text-2xl font-bold text-gray-900">{brief.exerciseActivity.weeklySteps.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Goal: {brief.exerciseActivity.targetSteps.toLocaleString()}</p>
            <p className="text-sm mt-2 font-semibold">{brief.exerciseActivity.weeklyGoalPercentage}%</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Daily Sitting</p>
            <p className="text-2xl font-bold text-gray-900">{brief.exerciseActivity.sittingHours}h</p>
            <p className="text-xs text-gray-500">Avg per day</p>
            <p className={`text-sm mt-2 font-semibold ${
              brief.exerciseActivity.status === 'EXCEEDS_TARGET' ? 'text-green-600' :
              brief.exerciseActivity.status === 'GOOD' ? 'text-green-600' :
              brief.exerciseActivity.status === 'MODERATE' ? 'text-orange-600' :
              'text-red-600'
            }`}>
              {brief.exerciseActivity.status.replace(/_/g, ' ')}
            </p>
          </div>
        </div>
      </section>

      {/* Key Concerns */}
      {brief.keyConcerns && brief.keyConcerns.length > 0 && (
        <section className="border border-red-200 bg-red-50 rounded-lg p-4">
          <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            Key Concerns (Ranked)
          </h3>
          <div className="space-y-3">
            {brief.keyConcerns.map((concern) => (
              <div key={concern.rank} className="border-l-4 border-red-600 pl-3">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-red-700">{concern.rank}.</span>
                  <div>
                    <p className="font-medium text-red-900 text-sm">{concern.title}</p>
                    <p className="text-xs text-red-700 mt-1">{concern.explanation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recommended Agenda */}
      <section className="border border-green-200 bg-green-50 rounded-lg p-4">
        <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          Recommended Consultation Agenda
        </h3>
        <ol className="space-y-2">
          {brief.recommendedAgenda.map((item, idx) => (
            <li key={idx} className="text-sm text-green-800">
              <span className="font-semibold">{idx + 1}.</span> {item}
            </li>
          ))}
        </ol>
      </section>

      {/* Personal Notes */}
      <section className="border border-gray-300 rounded-lg p-4 bg-gray-50">
        <h3 className="font-semibold text-gray-900 mb-2">Personal Notes (Clinician)</h3>
        <p className="text-xs text-gray-600 mb-2">Add notes before visiting this patient</p>
        <textarea
          defaultValue={personalNotes}
          onChange={(e) => onAddNote && onAddNote(e.target.value)}
          className="w-full text-sm border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="3"
          placeholder="Your personal notes for this appointment..."
        />
      </section>

      {/* Metadata */}
      <section className="text-xs text-gray-500 border-t border-gray-200 pt-4">
        <p>Generated: {new Date(brief.generatedAt).toLocaleString()}</p>
        <p>Last data sync: {new Date(brief.lastDataSync).toLocaleString()}</p>
        <p>Generated by: {brief.generatedBy}</p>
        <p>Version: {brief.version}</p>
      </section>
    </div>
  );
};

export default BriefSections;
