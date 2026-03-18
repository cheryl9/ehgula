// ─────────────────────────────────────────────────────────────────────────────
// src/hooks/usePatientData.js
//
// Single hook that fetches everything from Supabase.
// Used by: RemindersScreen, SummariesScreen, ChatScreen
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabase";

const todayStr = () => new Date().toISOString().split("T")[0];

const daysAgoStr = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
};

export function usePatientData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();
      if (userErr || !user) throw new Error("Not authenticated");

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
        supabase.from("patients").select("*").eq("user_id", user.id).single(),

        // Glucose — this week (7 days)
        supabase
          .from("glucose_readings")
          .select("*")
          .eq("patient_id", user.id)
          .gte("timestamp", daysAgoStr(7))
          .order("timestamp", { ascending: true }),

        // Glucose — last week (7–14 days ago) for vs-last-week comparison
        supabase
          .from("glucose_readings")
          .select("*")
          .eq("patient_id", user.id)
          .gte("timestamp", daysAgoStr(14))
          .lt("timestamp", daysAgoStr(7))
          .order("timestamp", { ascending: true }),

        // Medications
        supabase.from("medication_plans").select("*").eq("patient_id", user.id),

        // Dose logs — today only
        supabase
          .from("medication_dose_logs")
          .select("*")
          .eq("patient_id", user.id)
          .eq("dose_date", todayStr()),

        // Dose logs — this week
        supabase
          .from("medication_dose_logs")
          .select("*")
          .eq("patient_id", user.id)
          .gte("dose_date", daysAgoStr(7)),

        // Dose logs — last week
        supabase
          .from("medication_dose_logs")
          .select("*")
          .eq("patient_id", user.id)
          .gte("dose_date", daysAgoStr(14))
          .lt("dose_date", daysAgoStr(7)),

        // Meal logs — this week
        supabase
          .from("meal_logs")
          .select("*")
          .eq("patient_id", user.id)
          .gte("date", daysAgoStr(7))
          .order("date", { ascending: false }),

        // Calendar events — today
        supabase
          .from("calendar_events")
          .select("*")
          .eq("patient_id", user.id)
          .eq("event_date", todayStr())
          .order("start_time", { ascending: true }),

        // Exercise log — today (.single() ok, tolerate no-row error)
        supabase
          .from("exercise_logs")
          .select("*")
          .eq("patient_id", user.id)
          .eq("date", todayStr())
          .single(),

        // Appointments — all
        supabase
          .from("appointments")
          .select("*")
          .eq("patient_id", user.id)
          .order("date", { ascending: true }),

        // Agent actions — last 7 days
        supabase
          .from("agent_actions")
          .select("*")
          .eq("patient_id", user.id)
          .gte("timestamp", daysAgoStr(7))
          .order("timestamp", { ascending: false }),
      ]);

      // PGRST116 = no row for .single() — perfectly fine
      const toleratedCodes = ["PGRST116"];
      const errs = [
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
      ].filter((r) => r.error && !toleratedCodes.includes(r.error.code));

      if (errs.length > 0) throw new Error(errs[0].error.message);

      setData({
        patient: patientRes.data ?? null,
        glucose: glucoseRes.data ?? [],
        glucoseLastWeek: glucoseLastWeekRes.data ?? [],
        medications: medicationsRes.data ?? [],
        doseLogs: doseLogsTodayRes.data ?? [],
        doseLogsWeek: doseLogsWeekRes.data ?? [],
        doseLogsLastWeek: doseLogsLastWeekRes.data ?? [],
        mealLogs: mealLogsRes.data ?? [],
        calendar: calendarRes.data ?? [],
        exercise: exerciseRes.data ?? null,
        appointments: appointmentsRes.data ?? [],
        agentActions: agentActionsRes.data ?? [],
      });
    } catch (err) {
      console.error("[usePatientData]", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { data, loading, error, refetch: fetchAll };
}
