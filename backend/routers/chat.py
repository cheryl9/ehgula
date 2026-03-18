from fastapi import APIRouter
from agent.core import agent
from agent.memory import load_patient_data
from agent.writer import write_appointment, write_agent_action, write_appointment_reminder
from ml_models.sealion_client import (
    ask_sealion_with_history,
    generate_booking_confirmation_ask,
    generate_booking_confirmation
)
from config import PATIENT_ID
from datetime import datetime, timedelta

router = APIRouter()

# In-memory conversation history per session
conversation_histories = {}

# Tracks booking state per session
# Structure: { session_id: { "pending_slot": slot, "alternatives": [slot2, slot3], "awaiting": "confirmation" | "alternative_choice" } }
booking_sessions = {}


def detect_intent(message: str) -> str:
    """Detects patient's intent from their reply."""
    msg = message.lower().strip()
    if any(w in msg for w in ["yes", "ok", "okay", "confirm", "sure", "book", "ya", "yah", "can", "go ahead"]):
        return "confirmed"
    if any(w in msg for w in ["no", "nope", "don't", "dont", "cancel", "later", "nah", "cannot", "busy"]):
        return "declined"
    if msg in ["1", "2", "3", "one", "two", "three", "first", "second", "third"]:
        return "alternative_selected"
    return "unknown"


def parse_alternative_choice(message: str) -> int:
    """Returns 0, 1, or 2 as index into alternatives list."""
    msg = message.lower().strip()
    if msg in ["1", "one", "first"]:
        return 0
    if msg in ["2", "two", "second"]:
        return 1
    if msg in ["3", "three", "third"]:
        return 2
    return 0


@router.post("/chat")
def chat(payload: dict):
    session_id   = payload.get("session_id", "default")
    user_message = payload.get("message", "").strip()

    if not user_message:
        return {"error": "No message provided"}

    patient_data = load_patient_data(patient_id=PATIENT_ID)

    if session_id not in conversation_histories:
        conversation_histories[session_id] = []
    history = conversation_histories[session_id]

    booking = booking_sessions.get(session_id, {})

    # ── CASE 1: Patient is responding to initial confirmation prompt ──────
    if booking.get("awaiting") == "confirmation":
        intent = detect_intent(user_message)
        pending_slot  = booking["pending_slot"]
        alternatives  = booking["alternatives"]

        if intent == "confirmed":
            # Book the pending slot
            write_appointment(patient_data, pending_slot, urgency_score=booking.get("urgency_score", 65))
            write_agent_action(
                patient_id=PATIENT_ID,
                action_type="appointment_confirmed",
                detail=f"Patient confirmed: {pending_slot['clinic']} {pending_slot['date']} {pending_slot['time']}",
                triggered_by="chat_confirmation",
                silent=False,
                outcome="confirmed"
            )

            # Clear booking session
            booking_sessions.pop(session_id, None)

            reply = generate_booking_confirmation(patient_data, pending_slot)

        elif intent == "declined" and alternatives:
            # Patient said no — offer alternatives
            booking_sessions[session_id] = {
                **booking,
                "awaiting": "alternative_choice"
            }

            alt_lines = "\n".join(
                f"{i+1}. {s['date']} at {s['time']} — {s['clinic']}"
                for i, s in enumerate(alternatives)
            )
            reply = (
                f"No problem Mr. Tan! Here are a few other slots that work around your schedule:\n\n"
                f"{alt_lines}\n\n"
                f"Just reply 1, 2, or 3 and I'll book it for you!"
            )

        elif intent == "declined" and not alternatives:
            # No alternatives available
            write_agent_action(
                patient_id=PATIENT_ID,
                action_type="appointment_declined",
                detail="Patient declined — no alternatives available",
                triggered_by="chat_confirmation",
                silent=False,
                outcome="declined"
            )
            booking_sessions.pop(session_id, None)
            reply = (
                f"Okay Mr. Tan, I understand. Please try to book an appointment "
                f"yourself soon though — your readings have been a bit unstable lately. "
                f"You can call Bedok Polyclinic at 6443 4056. Take care!"
            )

        else:
            # Unclear reply — ask again
            reply = (
                f"Sorry Mr. Tan, I didn't quite catch that! "
                f"Can I go ahead and book {pending_slot['clinic']} on "
                f"{pending_slot['date']} at {pending_slot['time']} for you? "
                f"Just say yes or no!"
            )

        history.append({"role": "user",      "content": user_message})
        history.append({"role": "assistant", "content": reply})
        conversation_histories[session_id] = history

        return {
            "reply":          reply,
            "booking_status": "confirmed" if intent == "confirmed" else "pending",
            "pending_slot":   None if intent == "confirmed" else pending_slot,
            "alternatives":   alternatives
        }

    # ── CASE 2: Patient is choosing from alternatives ─────────────────────
    if booking.get("awaiting") == "alternative_choice":
        intent      = detect_intent(user_message)
        alternatives = booking["alternatives"]

        if intent == "alternative_selected":
            idx           = parse_alternative_choice(user_message)
            chosen_slot   = alternatives[idx] if idx < len(alternatives) else alternatives[0]

            write_appointment(patient_data, chosen_slot, urgency_score=booking.get("urgency_score", 65))
            write_agent_action(
                patient_id=PATIENT_ID,
                action_type="appointment_confirmed",
                detail=f"Patient chose alternative: {chosen_slot['clinic']} {chosen_slot['date']} {chosen_slot['time']}",
                triggered_by="chat_alternative_choice",
                silent=False,
                outcome="confirmed"
            )

            booking_sessions.pop(session_id, None)
            reply = generate_booking_confirmation(patient_data, chosen_slot)

        elif intent == "declined":
            # Patient declined all alternatives — write reminder for 2 days later
            remind_days = 2
            remind_date      = (datetime.now() + timedelta(days=remind_days)).strftime("%Y-%m-%d")
            remind_date_nice = (datetime.now() + timedelta(days=remind_days)).strftime("%A, %d %B")

            write_agent_action(
                patient_id=PATIENT_ID,
                action_type="appointment_declined_all",
                detail=f"Patient declined all slots — reminder written for {remind_date}",
                triggered_by="chat_alternative_choice",
                silent=True,
                outcome=f"remind_on:{remind_date}"
            )

            write_appointment_reminder(
                patient_id=PATIENT_ID,
                remind_on=remind_date,
                reason="Patient declined all suggested appointment slots",
                urgency_score=booking.get("urgency_score", 65)
            )

            booking_sessions.pop(session_id, None)

            reply = (
                f"Okay Mr. Tan, no worries! I will check in with you again "
                f"on {remind_date_nice} about booking an appointment. "
                f"In the meantime, please take your medication on time "
                f"and monitor your sugar levels. Take care!"
            )

        else:
            # Unclear — remind them of the options
            alt_lines = "\n".join(
                f"{i+1}. {s['date']} at {s['time']} — {s['clinic']}"
                for i, s in enumerate(alternatives)
            )
            reply = (
                f"Sorry Mr. Tan! Just reply 1, 2, or 3 to choose a slot:\n\n{alt_lines}"
            )

        history.append({"role": "user",      "content": user_message})
        history.append({"role": "assistant", "content": reply})
        conversation_histories[session_id] = history

        return {
            "reply":          reply,
            "booking_status": "confirmed" if intent == "alternative_selected" else "pending",
        }

    # ── CASE 3: Normal chat — run agent and check for new pending booking ─
    agent_result = agent.invoke({
        "patient_data":     patient_data,
        "observations":     [],
        "reasoning":        "",
        "alert_level":      "normal",
        "actions_taken":    [],
        "notifications":    [],
        "audit_log":        [],
        "pending_booking":  None,
        "booking_status":   "none",
        "in_app_reminders": []
    })

    pending      = agent_result.get("pending_booking")
    alert_level  = agent_result.get("alert_level", "normal")
    obs_summary  = "\n".join(agent_result["observations"][:5])

    if pending and alert_level == "urgent":
        # Get all available slots from patient data
        all_slots    = patient_data.get("calendar", {}).get("available_clinic_slots", [])
        alternatives = [s for s in all_slots if s != pending][:3]

        # Save booking state for this session
        booking_sessions[session_id] = {
            "awaiting":      "confirmation",
            "pending_slot":  pending,
            "alternatives":  alternatives,
            "urgency_score": 65
        }

        # Ask patient to confirm
        reply = generate_booking_confirmation_ask(patient_data, pending)

    else:
        # Normal conversational reply
        system_prompt = f"""You are a warm, friendly AI health companion for {patient_data['name']},
a {patient_data['age']}-year-old patient with {', '.join(patient_data['conditions'])}.

Speak in friendly Singlish-influenced English. Be conversational, not clinical.
Keep replies short — 2 to 3 sentences max unless the patient asks for more detail.
Never dump all information at once. Respond naturally to what the patient just said.

Current health context (use to inform replies, do not recite):
{obs_summary}

Alert level: {alert_level}"""

        history.append({"role": "user", "content": user_message})
        reply = ask_sealion_with_history(system_prompt, history)
        history.append({"role": "assistant", "content": reply})
        conversation_histories[session_id] = history

    return {
        "reply":            reply,
        "alert_level":      alert_level,
        "booking_status":   "pending" if pending else "none",
        "pending_slot":     pending,
        "notifications":    agent_result.get("notifications", []),
        "in_app_reminders": agent_result.get("in_app_reminders", [])
    }


@router.delete("/chat/{session_id}")
def clear_chat(session_id: str):
    conversation_histories.pop(session_id, None)
    booking_sessions.pop(session_id, None)
    return {"status": f"Session {session_id} cleared"}