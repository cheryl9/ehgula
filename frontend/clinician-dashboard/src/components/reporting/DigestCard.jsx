/**
 * Weekly Digest Card Component
 * Displays a single week's health summary
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const DigestCard = ({ digest, onClick }) => {
  const getTrendIcon = (trend) => {
    if (trend === 'UP') return <TrendingUp className="w-4 h-4 text-red-600" />;
    if (trend === 'DOWN') return <TrendingDown className="w-4 h-4 text-green-600" />;
    return <Minus className="w-4 h-4 text-gray-600" />;
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'CRITICAL': return 'bg-red-50 border-red-200 text-red-700';
      case 'NEEDS_ATTENTION': return 'bg-orange-50 border-orange-200 text-orange-700';
      case 'FAIR': return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'EXCELLENT': return 'bg-green-50 border-green-200 text-green-700';
      default: return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md hover:border-gray-300 transition"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm text-gray-600">
            {digest.weekStart.toLocaleDateString()} - {digest.weekEnd.toLocaleDateString()}
          </p>
          <h4 className="font-semibold text-gray-900">{digest.patientName}</h4>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(digest.healthStatus)}`}>
          {digest.healthStatus.replace(/_/g, ' ')}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        {/* Glucose */}
        <div className="bg-blue-50 rounded p-2">
          <p className="text-xs text-gray-600">Glucose Avg</p>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-lg font-bold text-blue-700">{digest.avgGlucose}</span>
            {getTrendIcon(digest.glucoseTrend)}
          </div>
          <p className="text-xs text-gray-500">Target: 6.5</p>
        </div>

        {/* Adherence */}
        <div className="bg-purple-50 rounded p-2">
          <p className="text-xs text-gray-600">Adherence</p>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-lg font-bold text-purple-700">{digest.adherence}%</span>
            {getTrendIcon(digest.adherenceTrend)}
          </div>
          <p className="text-xs text-gray-500">Goal: 90%</p>
        </div>

        {/* Activity */}
        <div className="bg-green-50 rounded p-2">
          <p className="text-xs text-gray-600">Avg Steps</p>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-lg font-bold text-green-700">{digest.stepsAvg.toLocaleString()}</span>
            {getTrendIcon(digest.stepsTrend)}
          </div>
          <p className="text-xs text-gray-500">Goal: 10k/day</p>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-3">
        <ul className="text-xs text-gray-600 space-y-1">
          {digest.highlights.map((highlight, idx) => (
            <li key={idx}>• {highlight}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default DigestCard;
