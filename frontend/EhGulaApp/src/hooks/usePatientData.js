// ─────────────────────────────────────────────────────────────────────────────
// src/hooks/usePatientData.js
// Column names match confirmed schema from Supabase screenshots.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabase";
import { useAuth }  from "../../App";

const todayStr = () => new Date().toISOString().split("T")[0];

const daysAgoStr = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
};

export function usePatientData() {
  const { patientId } = useAuth();

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetchAll = useCallback(async () => {
    if (!patientId) {
      console.warn("[usePatientData] patientId not available yet — skipping fetch");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [
        patientRes,
        glucoseRes,
        glucoseLastWeekRes,
        medicationsRes,
        doseLogsTodayRes,
        doseLogsWeekRes,
        doseLogsLastWeekRes,
        mealLogsRes,
        calendarRes,
        exerciseRes,
        appointmentsRes,
        agentActionsRes,
      ] = await Promise.all([

        // Patient profile
        supabase
          .from("patients")
          .select("*, profiles(*)")
          .eq("id", patientId)
          .single(),

        // Glucose — this week
        // column: timestamp (timestamptz), value_mmol (numeric)
        supabase
          .from("glucose_readings")
          .select("*")
          .eq("patient_id", patientId)
          .gte("timestamp", `${daysAgoStr(7)}T00:00:00`)
          .order("timestamp", { ascending: true }),

        // Glucose — last week
        supabase
          .from("glucose_readings")
          .select("*")
          .eq("patient_id", patientId)
          .gte("timestamp", `${daysAgoStr(14)}T00:00:00`)
          .lt("timestamp",  `${daysAgoStr(7)}T00:00:00`)
          .order("timestamp", { ascending: true }),

        // Medications
        // columns: name, dose, frequency, scheduled_times (jsonb)
        supabase
          .from("medication_plans")
          .select("*")
          .eq("patient_id", patientId),

        // Dose logs — today only
        // columns: dose_date (date), scheduled_time (time), status
        supabase
          .from("medication_dose_logs")
          .select("*, medication_plans(name, dose)")
          .eq("patient_id", patientId)
          .eq("dose_date", todayStr()),

        // Dose logs — this week
        supabase
          .from("medication_dose_logs")
          .select("*, medication_plans(name, dose)")
          .eq("patient_id", patientId)
          .gte("dose_date", daysAgoStr(7)),

        // Dose logs — last week
        supabase
          .from("medication_dose_logs")
          .select("*, medication_plans(name, dose)")
          .eq("patient_id", patientId)
          .gte("dose_date", daysAgoStr(14))
          .lt("dose_date",  daysAgoStr(7)),

        // Meal logs — this week
        // columns: date (date), time (time), meal_type, logged, skipped
        supabase
          .from("meal_logs")
          .select("*")
          .eq("patient_id", patientId)
          .gte("date", daysAgoStr(7))
          .order("date", { ascending: false }),

        // Calendar events — today
        // columns: event_date (date), start_time (time), end_time (time)
        supabase
          .from("calendar_events")
          .select("*")
          .eq("patient_id", patientId)
          .eq("event_date", todayStr())
          .order("start_time", { ascending: true }),

        // Exercise log — today
        // columns: date, steps, step_goal, active_minutes,
        //          sitting_episodes (jsonb), heart_rate (jsonb)
        supabase
          .from("exercise_logs")
          .select("*")
          .eq("patient_id", patientId)
          .eq("date", todayStr())
          .single(),

        // Appointments — all
        supabase
          .from("appointments")
          .select("*")
          .eq("patient_id", patientId)
          .order("date", { ascending: true }),

        // Agent actions — last 7 days
        supabase
          .from("agent_actions")
          .select("*")
          .eq("patient_id", patientId)
          .gte("timestamp", `${daysAgoStr(7)}T00:00:00`)
          .order("timestamp", { ascending: false }),
      ]);

      // PGRST116 = no row for .single() — fine
      const toleratedCodes = ["PGRST116"];
      const errs = [
        patientRes, glucoseRes, glucoseLastWeekRes, medicationsRes,
        doseLogsTodayRes, doseLogsWeekRes, doseLogsLastWeekRes,
        mealLogsRes, calendarRes, exerciseRes, appointmentsRes, agentActionsRes,
      ].filter((r) => r.error && !toleratedCodes.includes(r.error?.code));

      if (errs.length > 0) throw new Error(errs[0].error.message);

      setData({
        patient:          patientRes.data         ?? null,
        patientId,
        glucose:          glucoseRes.data          ?? [],
        glucoseLastWeek:  glucoseLastWeekRes.data  ?? [],
        medications:      medicationsRes.data      ?? [],
        doseLogs:         doseLogsTodayRes.data    ?? [],
        doseLogsWeek:     doseLogsWeekRes.data     ?? [],
        doseLogsLastWeek: doseLogsLastWeekRes.data ?? [],
        mealLogs:         mealLogsRes.data         ?? [],
        calendar:         calendarRes.data         ?? [],
        exercise:         exerciseRes.data         ?? null,
        appointments:     appointmentsRes.data     ?? [],
        agentActions:     agentActionsRes.data     ?? [],
      });

    } catch (err) {
      console.error("[usePatientData]", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { data, loading, error, refetch: fetchAll };
}