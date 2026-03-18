/**
 * Weekly Digest Page (Patient-Specific)
 * Shows past 4 weeks of digests for a patient
 * Route: /patients/:id/digests
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';
import { usePatient } from '../hooks';
import { LoadingSpinner } from '../components/ui';
import { getWeeklyDigestsByPatientId } from '../api/dataProvider';
import DigestCard from '../components/reporting/DigestCard';

export default function WeeklyDigestPage() {
  const { id: patientId } = useParams();
  const navigate = useNavigate();
  const { patient, isLoading } = usePatient(patientId);
  const [digests, setDigests] = useState([]);
  const [isDigestLoading, setIsDigestLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadDigests = async () => {
      setIsDigestLoading(true);
      try {
        const data = await getWeeklyDigestsByPatientId(patientId || 'P001');
        if (isMounted) {
          setDigests(Array.isArray(data) ? data : []);
        }
      } catch {
        if (isMounted) {
          setDigests([]);
        }
      } finally {
        if (isMounted) {
          setIsDigestLoading(false);
        }
      }
    };

    loadDigests();

    return () => {
      isMounted = false;
    };
  }, [patientId]);

  if (isLoading || isDigestLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <button
        onClick={() => navigate(`/patients/${patientId}`)}
        className="flex items-center gap-2 mb-6 text-info-blue-600 hover:text-info-blue-700 font-medium transition-colors"
      >
        <ArrowLeft size={18} />
        Back to Patient Overview
      </button>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-8 h-8 text-info-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Weekly Digest</h1>
            <p className="text-slate-600 mt-2">Patient: {patient?.name}</p>
          </div>
        </div>
      </div>

      {digests.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-slate-600">No weekly digests available for this patient.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {digests.map((digest) => (
            <DigestCard
              key={digest.id}
              digest={digest}
              onClick={() => console.log('View digest detail:', digest.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
