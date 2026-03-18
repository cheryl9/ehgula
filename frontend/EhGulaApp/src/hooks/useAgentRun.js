// src/hooks/useAgentRun.js
//
// Runs the backend agent and returns in-app reminders,
// alert level, and pending booking state.
// Call this on app foreground or screen focus.
// Used by: RemindersScreen, HomeScreen
// ─────────────────────────────────────────────

import { useState, useCallback } from "react";
import { runAgent }  from "../services/api";
import { useAuth }   from "../../App";

export function useAgentRun() {
  const { patientId } = useAuth();

  const [reminders,      setReminders]      = useState([]);
  const [alertLevel,     setAlertLevel]     = useState("normal");
  const [pendingBooking, setPendingBooking] = useState(null);
  const [observations,   setObservations]   = useState([]);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState(null);

  const run = useCallback(async () => {
    if (!patientId) {
      console.warn("[useAgentRun] patientId not available yet — skipping run");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await runAgent(patientId);

      setReminders(result.in_app_reminders  ?? []);
      setAlertLevel(result.alert_level      ?? "normal");
      setObservations(result.observations   ?? []);

      if (result.booking_status === "pending" && result.pending_booking) {
        setPendingBooking(result.pending_booking);
      }

    } catch (err) {
      console.error("[useAgentRun]", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  return {
    reminders,
    alertLevel,
    pendingBooking,
    observations,
    loading,
    error,
    runAgent: run,
  };
}