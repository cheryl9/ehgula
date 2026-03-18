from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from agents.healthAgent import agent, ask_sealion_with_history, generate_doctor_brief

# NEW — reading from Supabase
from data.patient_loader import load_patient_data

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory conversation history store (one per session)
conversation_histories = {}


# ─────────────────────────────────────────────
# HEALTH CHECK
# ─────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "ChronicCompanion backend running"}


# ─────────────────────────────────────────────
# AGENT RUN
# Runs the full Observe → Reason → Act loop
# and returns observations, actions, alert level
# ─────────────────────────────────────────────

@app.post("/agent/run")
def run_agent():
    # Use the loaded patient data instead of reading from a JSON file
    # patient_data = json.load(f)
    patient_data = load_patient_data(patient_id="your-patient-uuid-here")

    result = agent.invoke({
        "patient_data":  patient_data,
        "observations":  [],
        "reasoning":     "",
        "alert_level":   "normal",
        "actions_taken": [],
        "notifications": [],
        "audit_log":     []
    })

    return {
        "alert_level":   result["alert_level"],
        "observations":  result["observations"],
        "reasoning":     result["reasoning"],
        "actions_taken": result["actions_taken"],
        "notifications": result["notifications"],
        "audit_log":     result["audit_log"]
    }


# ─────────────────────────────────────────────
# CHAT
# Multi-turn conversational chat with SEA-LION
# Runs the agent silently for context on each message
# ─────────────────────────────────────────────

@app.post("/chat")
def chat(payload: dict):
    patient_data = load_patient_data(patient_id="your-patient-uuid-here")
    session_id   = payload.get("session_id", "default")
    user_message = payload.get("message")

    if not user_message:
        return {"error": "No message provided"}

    # Load patient data
    # with open("data/mock_patient.json") as f:
    #     patient_data = json.load(f)

    # Get or create conversation history for this session
    if session_id not in conversation_histories:
        conversation_histories[session_id] = []

    history = conversation_histories[session_id]

    # Run agent silently in background to get current health context
    agent_result = agent.invoke({
        "patient_data":  patient_data,
        "observations":  [],
        "reasoning":     "",
        "alert_level":   "normal",
        "actions_taken": [],
        "notifications": [],
        "audit_log":     []
    })

    # Use only top 5 observations to keep prompt concise
    obs_summary = "\n".join(agent_result["observations"][:5])

    # System prompt injects patient context so SEA-LION replies are aware
    system_prompt = f"""You are a warm, friendly AI health companion for {patient_data['name']}, 
a {patient_data['age']}-year-old patient with {', '.join(patient_data['conditions'])}.

Speak in friendly Singlish-influenced English. Be conversational, not clinical.
Keep replies short — 2 to 3 sentences max unless the patient asks for more detail.
Never dump all information at once. Respond naturally to what the patient just said.

Current health context (use this to inform your replies, do not recite everything):
{obs_summary}

Alert level right now: {agent_result['alert_level']}"""

    # Add user message to history
    history.append({"role": "user", "content": user_message})

    # Call SEA-LION with full conversation history for multi-turn awareness
    reply = ask_sealion_with_history(system_prompt, history)

    # Save assistant reply to history
    history.append({"role": "assistant", "content": reply})
    conversation_histories[session_id] = history

    return {
        "reply":         reply,
        "alert_level":   agent_result["alert_level"],
        "notifications": agent_result["notifications"]
    }


# ─────────────────────────────────────────────
# DOCTOR BRIEF
# Generates a pre-appointment clinical summary
# ─────────────────────────────────────────────

@app.get("/brief")
def get_doctor_brief():
    patient_data = load_patient_data(patient_id="your-patient-uuid-here")
    # with open("data/mock_patient.json") as f:
    #        patient_data = json.load(f)

    # Run agent to get latest observations to include in the brief
    agent_result = agent.invoke({
        "patient_data":  patient_data,
        "observations":  [],
        "reasoning":     "",
        "alert_level":   "normal",
        "actions_taken": [],
        "notifications": [],
        "audit_log":     []
    })

    brief = generate_doctor_brief(patient_data, agent_result)

    return {
        "brief":       brief,
        "alert_level": agent_result["alert_level"],
        "generated_at": __import__("datetime").datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }


# ─────────────────────────────────────────────
# CLEAR CHAT HISTORY
# Resets conversation for a given session
# ─────────────────────────────────────────────

@app.delete("/chat/{session_id}")
def clear_chat(session_id: str):
    if session_id in conversation_histories:
        del conversation_histories[session_id]
        return {"status": f"Conversation history cleared for session {session_id}"}
    return {"status": "Session not found"}