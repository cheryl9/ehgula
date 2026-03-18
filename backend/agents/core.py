from langgraph.graph import StateGraph, END
from typing import TypedDict, List
from datetime import datetime

from agent.tools import (
    tool_glucose_monitor,
    tool_medication_tracker,
    tool_meal_skip_detection,
    tool_appointment_scheduler,
)
from ml_models.sealion_client import ask_sealion


# ─────────────────────────────────────────────
# SHARED STATE
# ─────────────────────────────────────────────

class PatientState(TypedDict):
    patient_data:  dict
    observations:  List[str]
    reasoning:     str
    alert_level:   str        # "normal" | "watch" | "urgent"
    actions_taken: List[str]
    notifications: List[str]
    audit_log:     List[str]


# ─────────────────────────────────────────────
# NODE 1: OBSERVE
# ─────────────────────────────────────────────

def observe(state: PatientState) -> PatientState:
    data  = state["patient_data"]
    audit = state.get("audit_log", [])

    audit.append(f"[{datetime.now().strftime('%H:%M:%S')}] OBSERVE: Running all monitoring tools.")

    observations = []
    observations += tool_glucose_monitor(data)
    observations += tool_medication_tracker(data)
    observations += tool_meal_skip_detection(data)

    state["observations"] = observations
    state["audit_log"]    = audit
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
    data          = state["patient_data"]
    observations  = state["observations"]
    alert_level   = state["alert_level"]
    audit         = state.get("audit_log", [])
    actions       = []
    notifications = []

    audit.append(f"[{datetime.now().strftime('%H:%M:%S')}] ACT: Executing actions for '{alert_level}'.")

    # Appointment scheduling
    actions += tool_appointment_scheduler(data, observations)

    # Missed medication notification
    missed = data.get("missed_medications", [])
    if missed:
        actions.append(f"NOTIFY patient about missed medications: {missed}")
        notifications.append(
            f"Eh Mr. Tan, you never take your {missed[0]} today leh. "
            f"Remember to take it after your next meal okay?"
        )

    # Meal skip actions
    if any("LIKELY SKIPPED LUNCH" in obs for obs in observations):
        actions.append("HOLD food-dependent medications until meal confirmed.")
        actions.append("SUGGEST nearest hawker centre to patient.")
        notifications.append(
            "Mr. Tan, look like you haven't eaten lunch yet. "
            "Got hawker centres nearby — try Bedok Interchange or Old Airport Road. "
            "Please eat first before taking your medication!"
        )

    # High glucose notification
    if any("HIGH glucose" in obs for obs in observations):
        actions.append("FLAG high glucose reading for doctor brief.")
        notifications.append(
            "Mr. Tan, your blood sugar is a bit high today. "
            "Try to avoid sugary drinks and go for a short walk if you can!"
        )

    # Urgent appointment notification
    if alert_level == "urgent":
        notifications.append(
            "Mr. Tan, based on your readings today we have booked you an appointment "
            "at Bedok Polyclinic tomorrow at 9:00 AM. Please remember to go!"
        )

    # Low steps nudge
    steps = data.get("wearable", {}).get("steps_today", 0)
    if steps < 3000:
        actions.append(f"NUDGE: Only {steps} steps today — suggest walk.")
        notifications.append(
            f"Mr. Tan, you only walked {steps} steps today. "
            f"Try to walk a bit more — even 10 minutes helps your sugar levels!"
        )

    audit.append(
        f"[{datetime.now().strftime('%H:%M:%S')}] ACT: "
        f"{len(actions)} actions, {len(notifications)} notifications."
    )

    state["actions_taken"] = actions
    state["notifications"] = notifications
    state["audit_log"]     = audit
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
