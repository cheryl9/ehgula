/**
 * Analytics Page (Population-Level)
 * Shows cohort statistics, at-risk patients, and trends
 * Route: /analytics
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, AlertTriangle, Activity } from 'lucide-react';
import { getCohortOverview, getAtRiskPatients, getTrends } from '../api/dataProvider';

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const cohort = getCohortOverview();
  const atRiskPatients = getAtRiskPatients();
  const trends = getTrends();

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
      </div>

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
          <p className="text-3xl font-bold text-slate-900">{cohort.avgGlucose.toFixed(2)}</p>
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
              key={patient.patientId}
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
                  onClick={() => navigate(`/patients/${patient.patientId}`)}
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
              <Tooltip formatter={(value) => value.toFixed(1)} />
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
