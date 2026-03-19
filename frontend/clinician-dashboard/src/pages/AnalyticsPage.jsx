/**
 * Analytics Page (Population-Level)
 * Shows cohort statistics, at-risk patients, and trends
 * Route: /analytics
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, AlertTriangle, Activity } from 'lucide-react';
import { getCohortOverview, getAtRiskPatients, getTrends } from '../api/dataProvider';

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const [cohortRaw, setCohortRaw] = useState(null);
  const [atRiskRaw, setAtRiskRaw] = useState([]);
  const [trendsRaw, setTrendsRaw] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadAnalytics = async () => {
      setIsLoading(true);
      setError('');
      try {
        const [cohortResult, atRiskResult, trendResult] = await Promise.allSettled([
          getCohortOverview(),
          getAtRiskPatients(),
          getTrends(),
        ]);

        if (!isMounted) {
          return;
        }

        const hasCohort = cohortResult.status === 'fulfilled';
        const hasAtRisk = atRiskResult.status === 'fulfilled';
        const hasTrends = trendResult.status === 'fulfilled';

        if (hasCohort) {
          setCohortRaw(cohortResult.value || null);
        }

        if (hasAtRisk) {
          setAtRiskRaw(Array.isArray(atRiskResult.value) ? atRiskResult.value : []);
        }

        if (hasTrends) {
          setTrendsRaw(trendResult.value || null);
        }

        if (!hasCohort && !hasAtRisk && !hasTrends) {
          throw new Error('Failed to load analytics');
        }

        if (!hasCohort || !hasAtRisk || !hasTrends) {
          setError('Some analytics failed to refresh. Showing latest available data.');
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load analytics');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadAnalytics();

    return () => {
      isMounted = false;
    };
  }, []);

  const cohort = useMemo(() => {
    const raw = cohortRaw || {};
    return {
      totalPatients: Number(raw.totalPatients || 0),
      overallAdherence: Number(raw.overallAdherence ?? raw.avgAdherence ?? 0),
      avgGlucose: Number(raw.avgGlucose ?? 0),
      weeklyAutoBookedAppointments: Number(raw.weeklyAutoBookedAppointments || 0),
    };
  }, [cohortRaw]);

  const normalizeRiskLevel = (patient) => {
    const explicit = (patient.riskLevel || patient.risk_level || '').toString().toUpperCase();
    if (explicit) {
      return explicit;
    }

    const score = patient.riskScore ?? patient.risk_score;
    if (typeof score === 'number') {
      if (score >= 75) return 'CRITICAL';
      if (score >= 45) return 'HIGH';
      if (score >= 25) return 'MEDIUM';
      return 'LOW';
    }

    const adherence = patient.adherence ?? patient.adherence_pct ?? patient.medicationAdherencePct;
    if (typeof adherence === 'number') {
      if (adherence < 50) return 'CRITICAL';
      if (adherence < 75) return 'HIGH';
      return 'LOW';
    }

    return 'LOW';
  };

  const computeRiskScore = (patient) => {
    const existing = patient.riskScore ?? patient.risk_score;
    if (typeof existing === 'number' && !Number.isNaN(existing)) {
      return existing;
    }

    const adherence = Number(
      patient.adherence ?? patient.adherence_pct ?? patient.medicationAdherencePct ?? 0
    );
    const glucose = Number(
      patient.glucose ?? patient.last_glucose ?? patient.avgFastingGlucose ?? patient.avg_fasting_glucose ?? 0
    );
    const mealsSkipped = Number(patient.mealsSkipped ?? patient.meals_skipped ?? 0);

    const adherencePenalty = Math.max(0, 100 - adherence);
    const glucosePenalty = glucose > 6.5 ? (glucose - 6.5) * 12 : 0;
    const mealSkipPenalty = Math.max(0, mealsSkipped) * 3;

    return Math.max(0, Math.min(100, Math.round(adherencePenalty + glucosePenalty + mealSkipPenalty)));
  };

  const atRiskPatients = useMemo(
    () =>
      atRiskRaw.map((patient, idx) => {
        const adherence =
          patient.adherence ?? patient.adherence_pct ?? patient.medicationAdherencePct ?? 0;
        const glucose =
          patient.glucose ?? patient.last_glucose ?? patient.avgFastingGlucose ?? patient.avg_fasting_glucose ?? 'N/A';
        const riskScore = computeRiskScore(patient);

        let primaryConcern = patient.primaryConcern || 'Needs review';
        if (!patient.primaryConcern) {
          if (Number(adherence) < 50) {
            primaryConcern = 'Low engagement & poor adherence';
          } else if (Number(glucose) > 7) {
            primaryConcern = 'Unstable glucose + declining adherence';
          } else if ((patient.skipPattern || '').toString().toLowerCase() !== 'none') {
            primaryConcern = `Meal pattern: ${patient.skipPattern}`;
          }
        }

        return {
          ...patient,
          patientId: patient.patientId || patient.patient_id,
          name: patient.name || patient.patientName || 'Unknown Patient',
          rank: patient.rank || idx + 1,
          riskLevel: normalizeRiskLevel(patient),
          riskScore,
          primaryConcern,
          adherence,
          glucose,
          appEngagement: patient.appEngagement || 'Review weekly digest trend',
          action: patient.action || 'Review in patient profile',
        };
      }),
    [atRiskRaw]
  );

  const trends = useMemo(() => {
    const empty = {
      adherenceTrend: [],
      glucoseTrend: [],
      exerciseTrend: [],
    };

    if (!trendsRaw) {
      return empty;
    }

    if (!Array.isArray(trendsRaw)) {
      return {
        adherenceTrend: Array.isArray(trendsRaw.adherenceTrend) ? trendsRaw.adherenceTrend : [],
        glucoseTrend: Array.isArray(trendsRaw.glucoseTrend) ? trendsRaw.glucoseTrend : [],
        exerciseTrend: Array.isArray(trendsRaw.exerciseTrend) ? trendsRaw.exerciseTrend : [],
      };
    }

    const toNumber = (value, fallback = 0) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    };

    // Aggregate by week so real data (multiple patients per week) maps to one point per week.
    const byWeek = new Map();
    trendsRaw.forEach((row, idx) => {
      const key = row.week || row.weekStart || row.week_start || `W${idx + 1}`;
      const existing = byWeek.get(key) || {
        week: key,
        adherenceTotal: 0,
        glucoseTotal: 0,
        exerciseTotal: 0,
        count: 0,
      };

      const adherence = toNumber(
        row.value ?? row.adherence ?? row.adherence_pct ?? row.medicationAdherencePct ?? row.medication_adherence_pct,
        0
      );
      const glucose = toNumber(
        row.glucose ?? row.avgGlucose ?? row.avgFastingGlucose ?? row.avg_fasting_glucose,
        0
      );
      const explicitExercise = row.exercise ?? row.activity_score ?? row.activityScore;
      const derivedExercise = toNumber(row.stepGoalMetDays ?? row.step_goal_met_days, 0) * (100 / 7);
      const exercise = toNumber(explicitExercise, derivedExercise);

      byWeek.set(key, {
        week: key,
        adherenceTotal: existing.adherenceTotal + adherence,
        glucoseTotal: existing.glucoseTotal + glucose,
        exerciseTotal: existing.exerciseTotal + exercise,
        count: existing.count + 1,
      });
    });

    const weekly = Array.from(byWeek.values());

    return {
      adherenceTrend: weekly.map((row) => ({
        week: row.week,
        value: row.count ? Number((row.adherenceTotal / row.count).toFixed(1)) : 0,
      })),
      glucoseTrend: weekly.map((row) => ({
        week: row.week,
        value: row.count ? Number((row.glucoseTotal / row.count).toFixed(2)) : 0,
      })),
      exerciseTrend: weekly.map((row) => ({
        week: row.week,
        value: row.count ? Number((row.exerciseTotal / row.count).toFixed(1)) : 0,
      })),
    };
  }, [trendsRaw]);

  const getRiskColor = (level) => {
    switch(level) {
      case 'CRITICAL': return 'bg-red-50 border-red-200';
      case 'HIGH': return 'bg-orange-50 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-green-50 border-green-200';
    }
  };

  const getRiskBadgeColor = (level) => {
    switch(level) {
      case 'CRITICAL': return 'bg-red-100 text-red-700';
      case 'HIGH': return 'bg-orange-100 text-orange-700';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-green-100 text-green-700';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Population Analytics</h1>
        <p className="text-slate-600 mt-2">Cohort overview and patient stratification</p>
        {error && <p className="mt-2 text-sm text-danger-red-700">{error}</p>}
      </div>

      {isLoading && (
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
          Loading analytics...
        </div>
      )}

      {/* Cohort Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-600">Total Patients</p>
            <Users className="w-5 h-5 text-info-blue-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{cohort.totalPatients}</p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-600">Avg Adherence</p>
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{cohort.overallAdherence}%</p>
          <p className="text-xs text-slate-500 mt-2">Target: 90%</p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-600">Avg Glucose</p>
            <Activity className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{Number(cohort.avgGlucose || 0).toFixed(2)}</p>
          <p className="text-xs text-slate-500 mt-2">Target: 6.5</p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-600">Auto-Booked</p>
            <AlertTriangle className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{cohort.weeklyAutoBookedAppointments}</p>
          <p className="text-xs text-slate-500 mt-2">This week</p>
        </div>
      </div>

      {/* At-Risk Patients */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 mb-8">
        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          At-Risk Patients
        </h2>
        <div className="space-y-3">
          {atRiskPatients.map((patient) => (
            <div
              key={patient.patientId || patient.rank}
              className={`border border-slate-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition ${getRiskColor(patient.riskLevel)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-slate-900">{patient.rank}</span>
                  <div>
                    <h4 className="font-semibold text-slate-900">{patient.name}</h4>
                    <p className="text-sm text-slate-600">{patient.primaryConcern}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getRiskBadgeColor(patient.riskLevel)}`}>
                    Risk: {patient.riskScore}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 my-3 text-sm">
                <div>
                  <p className="text-slate-600">Adherence</p>
                  <p className="font-semibold text-slate-900">{patient.adherence}%</p>
                </div>
                <div>
                  <p className="text-slate-600">Glucose</p>
                  <p className="font-semibold text-slate-900">{patient.glucose}</p>
                </div>
                <div>
                  <p className="text-slate-600">Engagement</p>
                  <p className="font-semibold text-slate-900">{patient.appEngagement}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200">
                <p className="text-sm font-medium text-slate-700">🔔 {patient.action}</p>
                <button
                  onClick={() => patient.patientId && navigate(`/patients/${patient.patientId}`)}
                  className="px-3 py-1 text-sm text-info-blue-600 border border-info-blue-300 rounded hover:bg-info-blue-50"
                >
                  View Patient
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Adherence Trend */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Adherence Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trends.adherenceTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value) => `${value}%`} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#a855f7"
                strokeWidth={2}
                dot={{ fill: '#a855f7' }}
                name="Adherence %"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Glucose Trend */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Glucose Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trends.glucoseTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis domain={[6, 8]} />
              <Tooltip formatter={(value) => (typeof value === 'number' ? value.toFixed(1) : value)} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#06b6d4"
                strokeWidth={2}
                dot={{ fill: '#06b6d4' }}
                name="Glucose (mmol/L)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Exercise Trend */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Activity Goal Achievement</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={trends.exerciseTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis domain={[0, 100]} />
            <Tooltip formatter={(value) => `${value}%`} />
            <Bar dataKey="value" fill="#10b981" name="Goal Achievement %" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
