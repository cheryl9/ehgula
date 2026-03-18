/**
 * Triage Board Page
 * 3-lane board: URGENT (red), NEEDS ATTENTION (yellow), ON TRACK (green)
 * Route: /triage
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { getAtRiskPatients } from '../api/dataProvider';
import { useClinicianStore } from '../store/clinicianStore';

export default function TriagePage() {
  const navigate = useNavigate();
  const store = useClinicianStore();
  const [atRiskRaw, setAtRiskRaw] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!store.patients.list.length) {
      store.actions.fetchPatients();
    }
  }, [store]);

  useEffect(() => {
    let isMounted = true;

    const loadAtRiskPatients = async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await getAtRiskPatients();
        if (isMounted) {
          setAtRiskRaw(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load triage data');
          setAtRiskRaw([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadAtRiskPatients();

    return () => {
      isMounted = false;
    };
  }, []);

  const patientNameById = useMemo(
    () => new Map(store.patients.list.map((p) => [p.patient_id, p.name])),
    [store.patients.list]
  );

  const normalizeRiskLevel = (patient) => {
    const explicitLevel = (patient.riskLevel || patient.risk_level || '').toString().toUpperCase();
    if (explicitLevel) {
      return explicitLevel;
    }

    const score = patient.riskScore ?? patient.risk_score;
    if (typeof score === 'number') {
      if (score >= 80) return 'CRITICAL';
      if (score >= 60) return 'HIGH';
      return 'LOW';
    }

    const adherence = patient.adherence ?? patient.adherence_pct ?? patient.medicationAdherencePct;
    if (typeof adherence === 'number') {
      if (adherence < 50) return 'CRITICAL';
      if (adherence < 75) return 'HIGH';
    }

    return 'LOW';
  };

  const normalizedAtRiskPatients = useMemo(
    () =>
      atRiskRaw.map((patient) => {
        const patientId = patient.patientId || patient.patient_id;
        const riskLevel = normalizeRiskLevel(patient);
        const adherence =
          patient.adherence ?? patient.adherence_pct ?? patient.medicationAdherencePct ?? null;
        const glucose =
          patient.glucose ?? patient.last_glucose ?? patient.avgFastingGlucose ?? null;
        return {
          ...patient,
          patientId,
          name: patient.name || patient.patientName || patientNameById.get(patientId) || 'Unknown Patient',
          riskLevel,
          adherence,
          glucose,
        };
      }),
    [atRiskRaw, patientNameById]
  );

  const urgentPatients = normalizedAtRiskPatients.filter((p) => p.riskLevel === 'CRITICAL');
  const needsAttentionPatients = normalizedAtRiskPatients.filter((p) => p.riskLevel === 'HIGH');

  const onTrackPatients = useMemo(() => {
    const blockedIds = new Set([
      ...urgentPatients.map((p) => p.patientId),
      ...needsAttentionPatients.map((p) => p.patientId),
    ]);

    return store.patients.list
      .filter((p) => !blockedIds.has(p.patient_id))
      .map((p) => ({
        patientId: p.patient_id,
        name: p.name,
        riskScore: p.risk_score,
        adherence: p.adherence_pct,
        glucose: p.last_glucose,
      }));
  }, [store.patients.list, urgentPatients, needsAttentionPatients]);

  const TriageLane = ({ title, icon: Icon, color, patients, count, bgColor }) => (
    <div className="bg-white rounded-lg border border-slate-200">
      <div className={`${bgColor} px-6 py-4 border-b border-slate-200 flex items-center gap-3`}>
        <Icon className="w-6 h-6" />
        <div>
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-600">{count} patient{count !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="p-4 space-y-3 min-h-96">
        {patients.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p>No patients in this lane</p>
          </div>
        ) : (
          patients.map((patient) => (
            <div
              key={patient.patientId || patient.patient_id}
              onClick={() => navigate(`/patients/${patient.patientId || patient.patient_id}`)}
              className={`${color} border rounded-lg p-3 cursor-pointer hover:shadow-md transition`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-slate-900">{patient.name}</h4>
                  <p className="text-xs text-slate-600">
                    Risk Score: {patient.riskScore || patient.risk_score}
                  </p>
                </div>
              </div>

              {patient.primaryConcern && (
                <p className="text-sm text-slate-700 mb-2">
                  <strong>Concern:</strong> {patient.primaryConcern}
                </p>
              )}

              {patient.action && (
                <div className="text-xs bg-slate-50 rounded p-2 mb-2 border border-slate-200">
                  🔔 {patient.action}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                {patient.adherence !== null && patient.adherence !== undefined && (
                  <div>
                    <p className="text-slate-600">Adherence</p>
                    <p className="font-semibold">{patient.adherence}%</p>
                  </div>
                )}
                {patient.glucose !== null && patient.glucose !== undefined && (
                  <div>
                    <p className="text-slate-600">Glucose</p>
                    <p className="font-semibold">{patient.glucose}</p>
                  </div>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/patients/${patient.patientId || patient.patient_id}`);
                }}
                className="w-full px-2 py-1 text-xs bg-slate-900 text-white rounded hover:bg-slate-800"
              >
                View Details
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Triage Board</h1>
        <p className="text-slate-600 mt-2">Patient priority stratification by clinical risk</p>
        {error && <p className="mt-2 text-sm text-danger-red-700">{error}</p>}
      </div>

      {isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-600">
          Loading triage data...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* URGENT Lane */}
            <TriageLane
              title="🔴 URGENT"
              icon={AlertCircle}
              color="bg-red-50 border-red-200"
              bgColor="bg-red-100"
              patients={urgentPatients}
              count={urgentPatients.length}
            />

            {/* NEEDS ATTENTION Lane */}
            <TriageLane
              title="🟡 NEEDS ATTENTION"
              icon={Clock}
              color="bg-yellow-50 border-yellow-200"
              bgColor="bg-yellow-100"
              patients={needsAttentionPatients}
              count={needsAttentionPatients.length}
            />

            {/* ON TRACK Lane */}
            <TriageLane
              title="🟢 ON TRACK"
              icon={CheckCircle}
              color="bg-green-50 border-green-200"
              bgColor="bg-green-100"
              patients={onTrackPatients}
              count={onTrackPatients.length}
            />
          </div>

          <div className="mt-8 bg-info-blue-50 border border-info-blue-200 rounded-lg p-6">
            <p className="text-sm text-info-blue-900">
              <strong>How to use this board:</strong> Drag patients between lanes as their status changes.
              Click any patient card to view full details and generate a brief before appointment.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
