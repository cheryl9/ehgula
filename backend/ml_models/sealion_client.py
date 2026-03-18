from huggingface_hub import InferenceClient
from dotenv import load_dotenv
import os

load_dotenv()

client = InferenceClient(token=os.getenv("HF_TOKEN"))

MODEL = "aisingapore/Gemma-SEA-LION-v4-27B-IT"


# ─────────────────────────────────────────────
# SINGLE TURN — used by the agent internally
# ─────────────────────────────────────────────

def ask_sealion(system_prompt: str, user_message: str) -> str:
    try:
        response = client.chat_completion(
            model=MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_message}
            ],
            max_tokens=1000
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"SEA-LION error: {str(e)}"


# ─────────────────────────────────────────────
# MULTI TURN — used by the chat endpoint
# ─────────────────────────────────────────────

def ask_sealion_with_history(system_prompt: str, history: list) -> str:
    try:
        response = client.chat_completion(
            model=MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                *history
            ],
            max_tokens=300
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Sorry, I had trouble responding: {str(e)}"


# ─────────────────────────────────────────────
# DOCTOR BRIEF — structured clinical summary
# ─────────────────────────────────────────────

def generate_doctor_brief(patient_data: dict, agent_result: dict) -> str:
    observations = "\n".join(f"- {o}" for o in agent_result.get("observations", []))
    actions      = "\n".join(f"- {a}" for a in agent_result.get("actions_taken", []))
    alert_level  = agent_result.get("alert_level", "unknown")

    system_prompt = """You are a clinical documentation AI.
Generate a concise, professional pre-appointment health brief for a doctor.
Use clear medical language. Structure it with sections:
Patient Summary, Glucose Trends, Medication Adherence, AI Observations, Recommended Focus Areas."""

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
Steps today: {patient_data.get('wearable', {}).get('steps_today')}"""

    return ask_sealion(system_prompt, user_message)

## ─────────────────────────────────────────────
# APPOINTMENT BOOKING CONFIRMATION MESSAGES
# ─────────────────────────────────────────────

def generate_booking_confirmation_ask(patient_data: dict, slot: dict) -> str:
    """Asks the patient for confirmation before booking."""
    return ask_sealion(
        "You are a warm health companion. Ask the patient to confirm an appointment in friendly Singlish. Keep it to 3 sentences max.",
        f"""The AI has decided this patient needs an urgent clinic visit.
Patient: {patient_data['name']}
Suggested slot: {slot['date']} at {slot['time']} at {slot['clinic']}
Reason: Blood sugar has been unstable and medications have been missed.

Ask the patient warmly if it is okay to book this slot for them.
End with a simple yes/no question."""
    )

def generate_booking_confirmation(patient_data: dict, slot: dict) -> str:
    """Sends full appointment details after patient confirms."""
    return ask_sealion(
        "You are a warm health companion confirming an appointment. Be friendly and clear. Give all the details the patient needs.",
        f"""The patient has confirmed their appointment. Give them the full details.
Patient: {patient_data['name']}
Appointment: {slot['date']} at {slot['time']}
Clinic: {slot['clinic']}

Include:
1. Confirmed date and time clearly
2. Clinic name and that it is at the polyclinic
3. Remind them to bring their NRIC and medication list
4. Wish them well
Speak in warm Singlish-influenced English."""
    )