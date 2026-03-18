/**
 * Doctor Briefs Page (Global)
 * Lists all generated doctor briefs with filtering and search
 * Route: /briefs
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, FileText, AlertCircle, Search } from 'lucide-react';
import { getAllBriefs } from '../api/dataProvider';
import DoctorBriefModal from '../components/brief/DoctorBriefModal';

export default function DoctorBriefsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState('all');
  const [selectedBrief, setSelectedBrief] = useState(null);
  const [isBriefModalOpen, setIsBriefModalOpen] = useState(false);
  const [briefs, setBriefs] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const loadBriefs = async () => {
      try {
        const data = await getAllBriefs();
        if (isMounted) {
          setBriefs(Array.isArray(data) ? data : []);
        }
      } catch {
        if (isMounted) {
          setBriefs([]);
        }
      }
    };

    loadBriefs();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredBriefs = useMemo(() => {
    let result = briefs;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(b => b.patientName.toLowerCase().includes(query));
    }

    if (filterRisk !== 'all') {
      result = result.filter(b => {
        const criticalCount = b.alerts.filter(a => a.severity === 'CRITICAL').length;
        const highCount = b.alerts.filter(a => a.severity === 'HIGH').length;
        const warningCount = b.alerts.filter(a => a.severity === 'WARNING').length;

        if (filterRisk === 'critical') return criticalCount > 0;
        if (filterRisk === 'high') return criticalCount === 0 && highCount > 0;
        if (filterRisk === 'warning') return criticalCount === 0 && highCount === 0 && warningCount > 0;
        if (filterRisk === 'good') return criticalCount === 0 && highCount === 0 && warningCount === 0;
        return true;
      });
    }

    return result;
  }, [searchQuery, filterRisk, briefs]);

  const getRiskBadge = (brief) => {
    const criticalCount = brief.alerts.filter(a => a.severity === 'CRITICAL').length;
    const highCount = brief.alerts.filter(a => a.severity === 'HIGH').length;
    const warningCount = brief.alerts.filter(a => a.severity === 'WARNING').length;

    if (criticalCount > 0) {
      return <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">🔴 {criticalCount} Critical</span>;
    }
    if (highCount > 0) {
      return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-semibold">🟠 {highCount} High</span>;
    }
    if (warningCount > 0) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-semibold">🟡 {warningCount} Warning</span>;
    }
    return <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">✅ Good</span>;
  };

  const getConcernSummary = (brief) => {
    if (brief.keyConcerns.length === 0) return 'No concerns - on track';
    return brief.keyConcerns.slice(0, 2).map(c => c.title).join(' • ');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-8 h-8 text-info-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Doctor Briefs</h1>
              <p className="text-gray-600">Pre-appointment AI-generated clinical summaries</p>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by patient name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-info-blue-500"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              {[
                { value: 'all', label: 'All Briefs' },
                { value: 'critical', label: '🔴 Critical' },
                { value: 'high', label: '🟠 High' },
                { value: 'warning', label: '🟡 Warning' },
                { value: 'good', label: '✅ Good' }
              ].map(f => (
                <button
                  key={f.value}
                  onClick={() => setFilterRisk(f.value)}
                  className={`px-3 py-2 rounded text-sm font-medium transition ${
                    filterRisk === f.value
                      ? 'bg-info-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {filteredBriefs.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No briefs found matching your search.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBriefs.map((brief) => (
              <div
                key={brief.id}
                onClick={() => {
                  setSelectedBrief(brief);
                  setIsBriefModalOpen(true);
                }}
                className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md hover:border-gray-300 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{brief.patientName}</h3>
                      {getRiskBadge(brief)}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{getConcernSummary(brief)}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(brief.appointmentDate).toLocaleDateString()} {new Date(brief.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span>Generated: {new Date(brief.generatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="ml-4 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/patients/${brief.patientId}`);
                      }}
                      className="px-3 py-1 text-sm text-info-blue-600 border border-info-blue-300 rounded hover:bg-info-blue-50"
                    >
                      View Patient
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBrief(brief);
                        setIsBriefModalOpen(true);
                      }}
                      className="px-3 py-1 text-sm bg-info-blue-600 text-white rounded hover:bg-info-blue-700"
                    >
                      Read
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Brief Modal */}
      <DoctorBriefModal
        brief={selectedBrief}
        isOpen={isBriefModalOpen}
        onClose={() => {
          setIsBriefModalOpen(false);
          setSelectedBrief(null);
        }}
        onSave={(updatedBrief) => {
          console.log('Brief saved:', updatedBrief);
        }}
      />
    </div>
  );
}
