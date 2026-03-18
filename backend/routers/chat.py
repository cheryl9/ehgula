from fastapi import APIRouter
from agent.core import agent
from agent.memory import load_patient_data
from ml_models.sealion_client import ask_sealion_with_history
from config import PATIENT_ID

router = APIRouter()

# In-memory conversation history (one list per session_id)
conversation_histories = {}


@router.post("/chat")
def chat(payload: dict):
    session_id   = payload.get("session_id", "default")
    user_message = payload.get("message")

    if not user_message:
        return {"error": "No message provided"}

    patient_data = load_patient_data(patient_id=PATIENT_ID)

    if session_id not in conversation_histories:
        conversation_histories[session_id] = []

    history = conversation_histories[session_id]

    # Run agent silently to get current health context
    agent_result = agent.invoke({
        "patient_data":  patient_data,
        "observations":  [],
        "reasoning":     "",
        "alert_level":   "normal",
        "actions_taken": [],
        "notifications": [],
        "audit_log":     []
    })

    obs_summary = "\n".join(agent_result["observations"][:5])

    system_prompt = f"""You are a warm, friendly AI health companion for {patient_data['name']},
a {patient_data['age']}-year-old patient with {', '.join(patient_data['conditions'])}.

Speak in friendly Singlish-influenced English. Be conversational, not clinical.
Keep replies short — 2 to 3 sentences max unless the patient asks for more detail.
Never dump all information at once. Respond naturally to what the patient just said.

Current health context (use this to inform replies, do not recite everything):
{obs_summary}

Alert level right now: {agent_result['alert_level']}"""

    history.append({"role": "user", "content": user_message})
    reply = ask_sealion_with_history(system_prompt, history)
    history.append({"role": "assistant", "content": reply})
    conversation_histories[session_id] = history

    return {
        "reply":         reply,
        "alert_level":   agent_result["alert_level"],
        "notifications": agent_result["notifications"]
    }


@router.delete("/chat/{session_id}")
def clear_chat(session_id: str):
    if session_id in conversation_histories:
        del conversation_histories[session_id]
        return {"status": f"Conversation cleared for session {session_id}"}
    return {"status": "Session not found"}