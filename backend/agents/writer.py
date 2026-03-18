from supabase_client import supabase
from datetime import datetime


# ─────────────────────────────────────────────
# APPOINTMENT WRITES
# ─────────────────────────────────────────────

def write_appointment(patient_data: dict, slot: dict, urgency_score: int):
    """Writes a confirmed appointment to Supabase."""
    supabase.table("appointments").insert({
        "patient_id":     patient_data["id"],
        "date":           slot["date"],
        "time":           slot["time"],
        "clinic":         slot["clinic"],
        "clinician":      "Dr Tan Wei Ming",
        "type":           "urgent",
        "auto_booked":    True,
        "booking_reason": "High urgency score from AI agent",
        "urgency_score":  urgency_score,
        "status":         "confirmed",
        "created_at":     datetime.now().isoformat()
    }).execute()


def write_doctor_brief(patient_id: str, appointment_id: str, brief_text: str):
    """Attaches the AI-generated brief to an appointment record."""
    supabase.table("appointments").update({
        "doctor_brief":    brief_text,
        "brief_generated": True,
        "brief_at":        datetime.now().isoformat()
    }).eq("id", appointment_id).execute()


def write_appointment_reminder(patient_id: str, remind_on: str,
                                reason: str, urgency_score: int):
    """
    Writes a pending reminder record to Supabase.
    In production a scheduler reads this table and re-triggers
    the confirmation flow on the remind_on date.
    """
    supabase.table("appointment_reminders").insert({
        "patient_id":    patient_id,
        "remind_on":     remind_on,
        "reason":        reason,
        "urgency_score": urgency_score,
        "status":        "pending",
        "created_at":    datetime.now().isoformat()
    }).execute()


# ─────────────────────────────────────────────
# AGENT ACTION LOG
# Every agent action — silent or visible —
# gets written here for the audit trail
# ─────────────────────────────────────────────

def write_agent_action(patient_id: str, action_type: str, detail: str,
                       triggered_by: str, silent: bool, outcome: str):
    """
    Writes every agent action to the agent_actions audit table.

    action_type options:
        appointment_confirmed | appointment_declined | appointment_declined_all
        medication_reminder   | medication_held      | medication_delayed
        medication_taken      | medication_missed
        meal_skip_detected    | meal_skip_confirmed
        exercise_nudge        | glucose_flagged
    """
    supabase.table("agent_actions").insert({
        "patient_id":   patient_id,
        "timestamp":    datetime.now().isoformat(),
        "action_type":  action_type,
        "detail":       detail,
        "triggered_by": triggered_by,
        "silent":       silent,
        "outcome":      outcome
    }).execute()


# ─────────────────────────────────────────────
# MEAL SKIP WRITE
# Logs detected and confirmed meal skips
# ─────────────────────────────────────────────

def write_meal_skip_detected(patient_id: str, meal_type: str,
                              confidence_score: int, signals: list):
    """
    Writes a meal skip prediction to agent_actions.
    Called when the agent detects a likely skip — before patient confirms.

    signals — list of signals that contributed to the score e.g.
    ["No lunch logged", "Past 2pm", "Glucose dip at midday"]
    """
    write_agent_action(
        patient_id=patient_id,
        action_type="meal_skip_detected",
        detail=(
            f"{meal_type.capitalize()} skip detected. "
            f"Confidence: {confidence_score}%. "
            f"Signals: {', '.join(signals)}"
        ),
        triggered_by="meal_skip_detection",
        silent=True,
        outcome="medications_held" if confidence_score >= 60 else "monitoring"
    )


def write_meal_skip_confirmed(patient_id: str, meal_type: str, skip_reason: str):
    """
    Writes a confirmed meal skip to agent_actions.
    Called when the patient explicitly taps 'skip' in the app
    via POST /meals/skip — this is the ground truth record.
    """
    write_agent_action(
        patient_id=patient_id,
        action_type="meal_skip_confirmed",
        detail=f"Patient confirmed {meal_type} skipped. Reason: {skip_reason}",
        triggered_by="patient_app",
        silent=True,
        outcome="logged"
    )


# ─────────────────────────────────────────────
# MEDICATION WRITES
# ─────────────────────────────────────────────

def write_medication_held(patient_id: str, med_name: str,
                           scheduled_time: str, reason: str,
                           rescheduled_to: str = None):
    """
    Updates dose_logs to held status and logs the agent action.
    Called when food-dependent medication is held due to no meal.
    """
    # Update the dose log status
    supabase.table("medication_dose_logs").update({
        "status":         "held",
        "held_reason":    reason,
        "rescheduled_to": rescheduled_to,
        "agent_action":   True,
        "updated_at":     datetime.now().isoformat()
    }).eq("patient_id", patient_id) \
      .eq("medication_name", med_name) \
      .eq("scheduled_time", scheduled_time) \
      .execute()

    # Log the agent action
    write_agent_action(
        patient_id=patient_id,
        action_type="medication_held",
        detail=f"{med_name} {scheduled_time} held. Reason: {reason}",
        triggered_by="medication_tracker",
        silent=True,
        outcome=f"rescheduled to {rescheduled_to}" if rescheduled_to else "pending meal"
    )


def write_medication_delayed(patient_id: str, med_name: str,
                              scheduled_time: str, delayed_to: str,
                              reason: str):
    """
    Updates dose_logs to delayed status.
    Called when medication reminder is delayed due to a meeting.
    """
    supabase.table("medication_dose_logs").update({
        "status":         "delayed",
        "held_reason":    reason,
        "rescheduled_to": delayed_to,
        "agent_action":   True,
        "updated_at":     datetime.now().isoformat()
    }).eq("patient_id", patient_id) \
      .eq("medication_name", med_name) \
      .eq("scheduled_time", scheduled_time) \
      .execute()

    write_agent_action(
        patient_id=patient_id,
        action_type="medication_delayed",
        detail=f"{med_name} {scheduled_time} delayed to {delayed_to}. Reason: {reason}",
        triggered_by="medication_tracker",
        silent=True,
        outcome=f"rescheduled to {delayed_to}"
    )


def write_medication_missed(patient_id: str, med_name: str, scheduled_time: str):
    """
    Updates dose_logs to missed and logs for doctor brief.
    Called when patient does not respond after both reminders.
    """
    supabase.table("medication_dose_logs").update({
        "status":       "missed",
        "actual_time":  None,
        "updated_at":   datetime.now().isoformat()
    }).eq("patient_id", patient_id) \
      .eq("medication_name", med_name) \
      .eq("scheduled_time", scheduled_time) \
      .execute()

    write_agent_action(
        patient_id=patient_id,
        action_type="medication_missed",
        detail=f"{med_name} {scheduled_time} auto-logged as missed — no patient response.",
        triggered_by="medication_tracker",
        silent=True,
        outcome="flagged_for_doctor_brief"
    )


def write_medication_taken(patient_id: str, med_name: str, scheduled_time: str):
    """
    Updates dose_logs to taken.
    Called when patient taps 'taken' in the app.
    """
    supabase.table("medication_dose_logs").update({
        "status":      "taken",
        "actual_time": datetime.now().isoformat(),
        "updated_at":  datetime.now().isoformat()
    }).eq("patient_id", patient_id) \
      .eq("medication_name", med_name) \
      .eq("scheduled_time", scheduled_time) \
      .execute()

    write_agent_action(
        patient_id=patient_id,
        action_type="medication_taken",
        detail=f"Patient confirmed {med_name} {scheduled_time} taken.",
        triggered_by="patient_app",
        silent=True,
        outcome="taken"
    )


# ─────────────────────────────────────────────
# GLUCOSE WRITE
# ─────────────────────────────────────────────

def write_glucose_flag(patient_id: str, value: float, flag_type: str):
    """
    Logs a glucose anomaly to agent_actions for the clinician.
    flag_type: "high" | "low" | "rising_sharply"
    """
    write_agent_action(
        patient_id=patient_id,
        action_type="glucose_flagged",
        detail=f"Glucose {flag_type}: {value} mmol/L at {datetime.now().strftime('%H:%M')}",
        triggered_by="glucose_monitor",
        silent=True,
        outcome="flagged_for_doctor_brief"
    )


# ─────────────────────────────────────────────
# EXERCISE WRITE
# ─────────────────────────────────────────────

def write_exercise_flag(patient_id: str, steps: int,
                         sitting_hours: float, glucose_value: float = None):
    """
    Logs a clinical exercise alert when low activity
    combines with high glucose.
    """
    detail = (
        f"Low activity: {steps} steps, {sitting_hours}h sitting."
    )
    if glucose_value:
        detail += f" Combined with high glucose: {glucose_value} mmol/L."

    write_agent_action(
        patient_id=patient_id,
        action_type="exercise_clinical_alert",
        detail=detail,
        triggered_by="exercise_monitor",
        silent=True,
        outcome="nudge_sent_to_patient"
    )