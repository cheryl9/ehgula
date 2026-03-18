from langgraph.graph import StateGraph, END
from typing import TypedDict, List
from datetime import datetime

from agent.tools import (
    tool_glucose_monitor,
    tool_medication_tracker,
    tool_meal_skip_detection,
    tool_exercise_monitor,
)
from ml_models.sealion_client import ask_sealion
from agent.writer import (
    write_agent_action,
    write_meal_skip_detected,
    write_glucose_flag
)
from config import PATIENT_ID as PATIENT_ID_FALLBACK


# ─────────────────────────────────────────────
# SHARED STATE
# ─────────────────────────────────────────────

class PatientState(TypedDict):
    patient_data:     dict
    observations:     List[str]
    reasoning:        str
    alert_level:      str           # "normal" | "watch" | "urgent"
    actions_taken:    List[str]
    notifications:    List[str]
    audit_log:        List[str]
    pending_booking:  dict          # holds slot details waiting for patient confirmation
    booking_status:   str           # "none" | "pending" | "confirmed" | "declined"
    in_app_reminders: List[dict]    # structured reminder objects for the frontend


# ─────────────────────────────────────────────
# NODE 1: OBSERVE
# ─────────────────────────────────────────────

def observe(state: PatientState) -> PatientState:
    data  = state["patient_data"]
    audit = state.get("audit_log", [])

    audit.append(f"[{datetime.now().strftime('%H:%M:%S')}] OBSERVE: Running all monitoring tools.")

    observations     = []
    in_app_reminders = []

    # Glucose monitor
    observations += tool_glucose_monitor(data)

    # Medication tracker — returns (findings, in_app_reminders)
    med_findings, med_reminders = tool_medication_tracker(data)
    observations     += med_findings
    in_app_reminders += med_reminders

    # Meal skip detection — also returns in_app_reminders
    meal_findings, meal_reminders = tool_meal_skip_detection(data)
    observations     += meal_findings
    in_app_reminders += meal_reminders

    # Exercise monitor — also returns in_app_reminders
    exercise_findings, exercise_reminders = tool_exercise_monitor(data)
    observations     += exercise_findings
    in_app_reminders += exercise_reminders

    state["observations"]     = observations
    state["in_app_reminders"] = in_app_reminders
    state["audit_log"]        = audit
    return state


# ─────────────────────────────────────────────
# NODE 2: REASON
# ─────────────────────────────────────────────

def reason(state: PatientState) -> PatientState:
    observations = state["observations"]
    audit        = state.get("audit_log", [])

    audit.append(f"[{datetime.now().strftime('%H:%M:%S')}] REASON: Sending observations to SEA-LION.")

    obs_text = "\n".join(f"- {o}" for o in observations)

    system_prompt = """You are a clinical AI reasoning engine for a Type 2 Diabetes patient management system.
Assess patient observations and determine urgency level.
Be concise and clinical. Always end with one of: URGENCY: normal | URGENCY: watch | URGENCY: urgent"""

    user_message = f"""Patient observations from today:
{obs_text}

Summarise the patient's current health situation in 2-3 sentences.
Then state the urgency on the last line as: URGENCY: normal / watch / urgent"""

    reasoning_text = ask_sealion(system_prompt, user_message)

    lower = reasoning_text.lower()
    if "urgency: urgent" in lower:
        alert_level = "urgent"
    elif "urgency: watch" in lower:
        alert_level = "watch"
    else:
        alert_level = "normal"

    audit.append(f"[{datetime.now().strftime('%H:%M:%S')}] REASON: Alert level = {alert_level}.")

    state["reasoning"]   = reasoning_text
    state["alert_level"] = alert_level
    state["audit_log"]   = audit
    return state


# ─────────────────────────────────────────────
# NODE 3: ACT
# ─────────────────────────────────────────────

def act(state: PatientState) -> PatientState:
    data            = state["patient_data"]
    observations    = state["observations"]
    alert_level     = state["alert_level"]
    audit           = state.get("audit_log", [])
    actions         = []
    notifications   = []
    pending_booking = None
    booking_status  = "none"

    audit.append(f"[{datetime.now().strftime('%H:%M:%S')}] ACT: Executing actions for '{alert_level}'.")

    # ── Appointment: flag as pending instead of auto-booking ──
    if alert_level == "urgent":
        available_slots = data.get("calendar", {}).get("available_clinic_slots", [])
        meetings        = data.get("calendar", {}).get("today_meetings", [])
        meeting_times   = [(m["start"], m["end"]) for m in meetings]

        booked_slot = None
        for slot in available_slots:
            clashes = any(
                m_start <= slot["time"] <= m_end
                for m_start, m_end in meeting_times
            )
            if not clashes:
                booked_slot = slot
                break

        if not booked_slot and available_slots:
            booked_slot = available_slots[0]

        if booked_slot:
            pending_booking = booked_slot
            booking_status  = "pending"
            actions.append(
                f"PENDING BOOKING: {booked_slot['clinic']} "
                f"{booked_slot['date']} {booked_slot['time']} — awaiting patient confirmation"
            )

    # ── Meal skip actions ─────────────────────────────────────
    if any("LIKELY SKIPPED LUNCH" in obs for obs in observations):
        actions.append("HOLD food-dependent medications until meal confirmed.")
        actions.append("SUGGEST nearest hawker centre to patient.")
        notifications.append(
            "Mr. Tan, look like you haven't eaten lunch yet. "
            "Got hawker centres nearby — try Bedok Interchange or Old Airport Road. "
            "Please eat first before taking your medication!"
        )

        # Extract signals that contributed to the skip detection
        skip_signals = [
            obs for obs in observations
            if any(kw in obs for kw in [
                "Lunch not logged", "Past 2pm", "Glucose dip",
                "calendar", "skipped", "breakfast not logged"
            ])
        ]

        # Extract confidence score from observations
        score_obs = next(
            (obs for obs in observations if "Meal skip confidence score" in obs), ""
        )
        score = int("".join(filter(str.isdigit, score_obs.split("%")[0][-3:]))) if score_obs else 60

        # Write meal skip prediction to audit log
        write_meal_skip_detected(
            patient_id=data.get("id", PATIENT_ID_FALLBACK),
            meal_type="lunch",
            confidence_score=score,
            signals=skip_signals[:3]
        )

    # ── High glucose notification ─────────────────────────────
    if any("HIGH glucose" in obs for obs in observations):
        actions.append("FLAG high glucose reading for doctor brief.")
        notifications.append(
            "Mr. Tan, your blood sugar is a bit high today. "
            "Try to avoid sugary drinks and go for a short walk if you can!"
        )
        # Write glucose flag to audit log
        glucose_readings = data.get("glucose_readings", [])
        if glucose_readings:
            latest_value = glucose_readings[-1]["value"]
            write_glucose_flag(
                patient_id=data.get("id", PATIENT_ID_FALLBACK),
                value=latest_value,
                flag_type="high"
            )

    # ── Exercise clinical connection ──────────────────────────
    # tool_exercise_monitor already handles nudges via in_app_reminders
    # act() only needs to log urgent clinical connections to actions
    steps         = data.get("wearable", {}).get("steps_today", 0)
    sitting_hours = data.get("wearable", {}).get("sitting_hours", 0)
 
    if any("CLINICAL CONNECTION" in obs for obs in observations):
        actions.append(
            f"CLINICAL ALERT: Low activity + high glucose detected — "
            f"walk strongly recommended. Logged for doctor brief."
        )
        # Write to audit log so clinician can see it
        write_agent_action(
            patient_id=data.get("id", PATIENT_ID_FALLBACK),
            action_type="exercise_clinical_alert",
            detail=(
                f"Low activity ({steps} steps, {sitting_hours}h sitting) combined with "
                f"high glucose — walk recommended to patient."
            ),
            triggered_by="exercise_monitor",
            silent=True,
            outcome="nudge_sent"
        )
    elif steps < 3000:
        actions.append(f"NUDGE: Only {steps} steps today — suggest walk.")
 
    audit.append(
        f"[{datetime.now().strftime('%H:%M:%S')}] ACT: "
        f"{len(actions)} actions, {len(notifications)} notifications, "
        f"booking_status={booking_status}."
    )

    state["actions_taken"]   = actions
    state["notifications"]   = notifications
    state["audit_log"]       = audit
    state["pending_booking"] = pending_booking
    state["booking_status"]  = booking_status
    return state


# ─────────────────────────────────────────────
# BUILD GRAPH
# ─────────────────────────────────────────────

def build_agent():
    graph = StateGraph(PatientState)
    graph.add_node("observe", observe)
    graph.add_node("reason",  reason)
    graph.add_node("act",     act)
    graph.add_edge("observe", "reason")
    graph.add_edge("reason",  "act")
    graph.add_edge("act",     END)
    graph.set_entry_point("observe")
    return graph.compile()

agent = build_agent()