from huggingface_hub import InferenceClient
from langgraph.graph import StateGraph, END
from typing import TypedDict, List
from dotenv import load_dotenv
from datetime import datetime
import os

load_dotenv()

# ─────────────────────────────────────────────
# SEA-LION CLIENT
# ─────────────────────────────────────────────

client = InferenceClient(token=os.getenv("HF_TOKEN"))

def ask_sealion_with_history(system_prompt: str, history: list) -> str:
    """Call SEA-LION with full conversation history for multi-turn chat."""
    try:
        response = client.chat_completion(
            model="aisingapore/Gemma-SEA-LION-v4-27B-IT",
            messages=[
                {"role": "system", "content": system_prompt},
                *history  # full conversation history passed in
            ],
            max_tokens=300  # keep replies short for chat
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Sorry, I had trouble responding: {str(e)}"


# ─────────────────────────────────────────────
# PATIENT STATE
# Shared data bag that flows through every node
# ─────────────────────────────────────────────

class PatientState(TypedDict):
    patient_data:    dict        # raw patient JSON loaded from mock data
    observations:    List[str]   # what the agent noticed (Observe step)
    reasoning:       str         # SEA-LION's reasoning summary (Reason step)
    alert_level:     str         # "normal" | "watch" | "urgent"
    actions_taken:   List[str]   # list of actions decided (Act step)
    notifications:   List[str]   # plain-language messages to send the patient
    audit_log:       List[str]   # timestamped record of every action


# ─────────────────────────────────────────────
# TOOL: GLUCOSE MONITOR
# Checks glucose readings for dangerous trends
# ─────────────────────────────────────────────

def tool_glucose_monitor(patient_data: dict) -> List[str]:
    findings = []
    readings = patient_data.get("glucose_readings", [])

    if not readings:
        findings.append("No glucose readings available today.")
        return findings

    latest = readings[-1]["value"]
    times  = [r["value"] for r in readings]
    avg    = sum(times) / len(times)

    # High glucose threshold for T2D patients
    if latest > 10.0:
        findings.append(f"HIGH glucose: latest reading is {latest} mmol/L (above 10.0 threshold).")
    elif latest < 4.0:
        findings.append(f"LOW glucose: latest reading is {latest} mmol/L (below 4.0, hypoglycaemia risk).")
    else:
        findings.append(f"Glucose is within range: latest {latest} mmol/L.")

    # Check if trend is rising across the day
    if len(readings) >= 2:
        if readings[-1]["value"] > readings[-2]["value"] + 2:
            findings.append("Glucose is rising sharply between last two readings.")

    findings.append(f"Daily average glucose: {avg:.1f} mmol/L.")
    return findings


# ─────────────────────────────────────────────
# TOOL: MEDICATION TRACKER
# Checks which medications were missed
# ─────────────────────────────────────────────

def tool_medication_tracker(patient_data: dict) -> List[str]:
    findings = []
    missed   = patient_data.get("missed_medications", [])
    meds     = patient_data.get("medications", [])

    if missed:
        for m in missed:
            findings.append(f"MISSED medication: {m}")
    else:
        findings.append("All medications taken on schedule today.")

    # Flag food-dependent meds if no meals logged
    meals_logged = patient_data.get("meals_logged", [])
    if not meals_logged:
        food_meds = [m["name"] for m in meds if m.get("requires_food")]
        if food_meds:
            findings.append(
                f"Food-dependent medications {food_meds} cannot be safely given — no meals logged yet."
            )

    return findings


# ─────────────────────────────────────────────
# TOOL: MEAL SKIP DETECTION
# Detects whether the patient has skipped a meal
# ─────────────────────────────────────────────

def tool_meal_skip_detection(patient_data: dict) -> List[str]:
    findings      = []
    meals_logged  = patient_data.get("meals_logged", [])
    glucose       = patient_data.get("glucose_readings", [])
    current_hour  = datetime.now().hour

    # Build a confidence score for skipped lunch
    skip_confidence = 0

    if not meals_logged:
        skip_confidence += 40
        findings.append("No meals logged for today.")

    if current_hour >= 14:
        skip_confidence += 30
        findings.append(f"It is past 2pm ({current_hour}:00) with no meal recorded.")

    # Glucose dip mid-day can indicate no food intake
    if len(glucose) >= 2:
        midday_readings = [r for r in glucose if 11 <= int(r["time"].split(":")[0]) <= 14]
        if midday_readings:
            midday_avg = sum(r["value"] for r in midday_readings) / len(midday_readings)
            if midday_avg < 5.5:
                skip_confidence += 30
                findings.append(f"Glucose dip detected at midday (avg {midday_avg:.1f} mmol/L) — possible skipped lunch.")

    findings.append(f"Meal skip confidence score: {min(skip_confidence, 100)}%.")

    if skip_confidence >= 60:
        findings.append("LIKELY SKIPPED LUNCH — holding food-dependent medications until meal is confirmed.")

    return findings


# ─────────────────────────────────────────────
# TOOL: APPOINTMENT SCHEDULER
# Scores urgency and decides if a clinic visit is needed
# ─────────────────────────────────────────────

def tool_appointment_scheduler(patient_data: dict, observations: List[str]) -> List[str]:
    findings       = []
    urgency_score  = 0

    # Factor 1: High glucose
    readings = patient_data.get("glucose_readings", [])
    if readings and readings[-1]["value"] > 10.0:
        urgency_score += 30
        findings.append("Urgency +30: High glucose reading today.")

    # Factor 2: Missed medications
    missed = patient_data.get("missed_medications", [])
    urgency_score += len(missed) * 15
    if missed:
        findings.append(f"Urgency +{len(missed) * 15}: {len(missed)} missed medication(s).")

    # Factor 3: Time since last clinic visit
    last_visit_str = patient_data.get("last_clinic_visit", None)
    if last_visit_str:
        last_visit = datetime.strptime(last_visit_str, "%Y-%m-%d")
        days_since = (datetime.now() - last_visit).days
        if days_since > 90:
            urgency_score += 25
            findings.append(f"Urgency +25: Last clinic visit was {days_since} days ago.")
        elif days_since > 60:
            urgency_score += 10
            findings.append(f"Urgency +10: Last clinic visit was {days_since} days ago.")

    # Factor 4: Rising glucose trend
    if any("rising sharply" in obs for obs in observations):
        urgency_score += 20
        findings.append("Urgency +20: Glucose rising sharply today.")

    findings.append(f"Total urgency score: {urgency_score}/100.")

    # Decide action based on score
    if urgency_score >= 60:
        findings.append("BOOK APPOINTMENT: High urgency — scheduling next available clinic slot.")
        # Mock available slots (in a real system this calls a calendar API)
        available_slots = [
            "Tomorrow 9:00 AM — Polyclinic A",
            "Tomorrow 2:30 PM — Polyclinic B",
            "Day after 10:00 AM — Polyclinic A"
        ]
        findings.append(f"Next available slot: {available_slots[0]}")
    elif urgency_score >= 30:
        findings.append("WATCH: Moderate urgency — recommend booking within the week.")
    else:
        findings.append("No appointment needed right now — continue monitoring.")

    return findings


# ─────────────────────────────────────────────
# NODE 1: OBSERVE
# Runs all tools and collects raw observations
# ─────────────────────────────────────────────

def observe(state: PatientState) -> PatientState:
    data         = state["patient_data"]
    observations = []
    audit        = state.get("audit_log", [])

    audit.append(f"[{datetime.now().strftime('%H:%M:%S')}] OBSERVE: Running all monitoring tools.")

    # Run each tool and collect findings
    observations += tool_glucose_monitor(data)
    observations += tool_medication_tracker(data)
    observations += tool_meal_skip_detection(data)

    state["observations"] = observations
    state["audit_log"]    = audit
    return state


# ─────────────────────────────────────────────
# NODE 2: REASON
# Sends all observations to SEA-LION to decide urgency
# ─────────────────────────────────────────────

def reason(state: PatientState) -> PatientState:
    observations = state["observations"]
    audit        = state.get("audit_log", [])

    audit.append(f"[{datetime.now().strftime('%H:%M:%S')}] REASON: Sending observations to SEA-LION.")

    obs_text = "\n".join(f"- {o}" for o in observations)

    system_prompt = """You are a clinical AI reasoning engine for a Type 2 Diabetes patient management system.
    Your job is to assess patient observations and determine the urgency level.
    Be concise and clinical. Always end your response with one of: URGENCY: normal | URGENCY: watch | URGENCY: urgent"""

    user_message = f"""Patient observations from today:
{obs_text}

Based on these observations, summarise the patient's current health situation in 2-3 sentences.
Then state the urgency level on the last line as: URGENCY: normal / watch / urgent"""

    reasoning_text = ask_sealion(system_prompt, user_message)

    # Extract urgency level from SEA-LION's response
    alert_level = "normal"
    lower = reasoning_text.lower()
    if "urgency: urgent" in lower:
        alert_level = "urgent"
    elif "urgency: watch" in lower:
        alert_level = "watch"
    else:
        alert_level = "normal"

    audit.append(f"[{datetime.now().strftime('%H:%M:%S')}] REASON: SEA-LION determined alert level = {alert_level}.")

    state["reasoning"]   = reasoning_text
    state["alert_level"] = alert_level
    state["audit_log"]   = audit
    return state


# ─────────────────────────────────────────────
# NODE 3: ACT
# Executes actions based on reasoning output
# ─────────────────────────────────────────────

def act(state: PatientState) -> PatientState:
    data          = state["patient_data"]
    observations  = state["observations"]
    alert_level   = state["alert_level"]
    actions       = []
    notifications = []
    audit         = state.get("audit_log", [])

    audit.append(f"[{datetime.now().strftime('%H:%M:%S')}] ACT: Executing actions for alert level '{alert_level}'.")

    # Run appointment scheduler (uses observations to score urgency)
    appointment_findings = tool_appointment_scheduler(data, observations)
    actions += appointment_findings

    # Medication actions
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
            "Got a few hawker centres nearby — Old Airport Road or Bedok Interchange. "
            "Please eat first before taking your medication!"
        )

    # High glucose actions
    if any("HIGH glucose" in obs for obs in observations):
        actions.append("FLAG high glucose reading for doctor brief.")
        notifications.append(
            "Mr. Tan, your blood sugar is a bit high today. "
            "Try to avoid sugary drinks and go for a short walk if you can!"
        )

    # Urgent — appointment booking notification
    if alert_level == "urgent":
        notifications.append(
            "Mr. Tan, based on your readings today we have booked you an appointment "
            "at Polyclinic A tomorrow at 9:00 AM. Please remember to go!"
        )

    # Low steps nudge
    steps = data.get("steps_today", 0)
    if steps < 3000:
        actions.append(f"NUDGE: Patient only has {steps} steps today — suggest short walk.")
        notifications.append(
            f"Mr. Tan, you only walked {steps} steps today. "
            f"Try to walk a bit more — even 10 minutes around the block helps your sugar levels!"
        )

    audit.append(f"[{datetime.now().strftime('%H:%M:%S')}] ACT: {len(actions)} actions taken, {len(notifications)} notifications queued.")

    state["actions_taken"] = actions
    state["notifications"] = notifications
    state["audit_log"]     = audit
    return state


# ─────────────────────────────────────────────
# BUILD THE LANGGRAPH
# Observe → Reason → Act → END
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


# ─────────────────────────────────────────────
# DOCTOR BRIEF GENERATOR
# Summarises everything into a pre-appointment brief
# ─────────────────────────────────────────────

def generate_doctor_brief(patient_data: dict, agent_result: dict) -> str:
    observations = "\n".join(f"- {o}" for o in agent_result.get("observations", []))
    actions      = "\n".join(f"- {a}" for a in agent_result.get("actions_taken", []))
    alert_level  = agent_result.get("alert_level", "unknown")

    system_prompt = """You are a clinical documentation AI. 
    Generate a concise, professional pre-appointment health brief for a doctor.
    Use clear medical language. Structure it with sections: Patient Summary, 
    Glucose Trends, Medication Adherence, AI Observations, Recommended Focus Areas."""

    user_message = f"""Generate a doctor brief for this patient:

Patient: {patient_data.get('name')}, Age {patient_data.get('age')}
Conditions: {patient_data.get('conditions')}
Last clinic visit: {patient_data.get('last_clinic_visit')}
Alert level today: {alert_level}

AI Observations:
{observations}

Actions taken by AI:
{actions}

Glucose readings today: {patient_data.get('glucose_readings')}
Missed medications: {patient_data.get('missed_medications')}
Steps today: {patient_data.get('steps_today')}"""

    return ask_sealion(system_prompt, user_message)


# ─────────────────────────────────────────────
# QUICK TEST (run this file directly to test)
# ─────────────────────────────────────────────

if __name__ == "__main__":
    import json

    # Load mock patient data
    mock_path = os.path.join(os.path.dirname(__file__), "data", "mock_patient.json")
    with open(mock_path) as f:
        patient_data = json.load(f)

    print("=" * 50)
    print("Running ChronicCompanion Agent...")
    print("=" * 50)

    # Run the agent
    result = agent.invoke({
        "patient_data":  patient_data,
        "observations":  [],
        "reasoning":     "",
        "alert_level":   "normal",
        "actions_taken": [],
        "notifications": [],
        "audit_log":     []
    })

    print(f"\n ALERT LEVEL: {result['alert_level'].upper()}")

    print("\n OBSERVATIONS:")
    for obs in result["observations"]:
        print(f"  - {obs}")

    print(f"\n SEA-LION REASONING:\n{result['reasoning']}")

    print("\n ACTIONS TAKEN:")
    for action in result["actions_taken"]:
        print(f"  - {action}")

    print("\n PATIENT NOTIFICATIONS:")
    for notif in result["notifications"]:
        print(f"  → {notif}")

    print("\n AUDIT LOG:")
    for log in result["audit_log"]:
        print(f"  {log}")

    print("\n" + "=" * 50)
    print("Generating Doctor Brief...")
    print("=" * 50)
    brief = generate_doctor_brief(patient_data, result)
    print(brief)

    