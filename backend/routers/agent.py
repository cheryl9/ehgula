from fastapi import APIRouter
from agent.core import agent
from agent.memory import load_patient_data
from ml_models.sealion_client import generate_doctor_brief
from config import PATIENT_ID
import datetime

router = APIRouter()


@router.post("/agent/run")
def run_agent():
    patient_data = load_patient_data(patient_id=PATIENT_ID)

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


@router.get("/brief")
def get_doctor_brief():
    patient_data = load_patient_data(patient_id=PATIENT_ID)

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
        "brief":        brief,
        "alert_level":  agent_result["alert_level"],
        "generated_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }