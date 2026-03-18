from fastapi import APIRouter
from agents.core import agent
from agents.memory import load_patient_data
from ml_models.sealion_client import generate_doctor_brief
import datetime

router = APIRouter()


def invoke_agent(patient_data: dict) -> dict:
    """Helper — single place to call agent.invoke with all required fields."""
    return agent.invoke({
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


@router.post("/agent/run")
def run_agent(payload: dict = {}):
    patient_id = payload.get("patient_id")

    if not patient_id:
        return {"error": "patient_id is required"}

    patient_data = load_patient_data(patient_id=patient_id)
    result       = invoke_agent(patient_data)

    return {
        "alert_level":      result["alert_level"],
        "observations":     result["observations"],
        "reasoning":        result["reasoning"],
        "actions_taken":    result["actions_taken"],
        "notifications":    result["notifications"],
        "audit_log":        result["audit_log"],
        "in_app_reminders": result["in_app_reminders"],
        "pending_booking":  result["pending_booking"],
        "booking_status":   result["booking_status"]
    }


@router.get("/brief")
def get_doctor_brief(patient_id: str = None):
    if not patient_id:
        return {"error": "patient_id is required"}

    patient_data = load_patient_data(patient_id=patient_id)
    agent_result = invoke_agent(patient_data)
    brief        = generate_doctor_brief(patient_data, agent_result)

    return {
        "brief":        brief,
        "alert_level":  agent_result["alert_level"],
        "generated_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }