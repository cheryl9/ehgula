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