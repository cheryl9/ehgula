from fastapi import APIRouter
from database.supabase_client import supabase
from agent.writer import write_agent_action, write_meal_skip_confirmed
from config import PATIENT_ID
from datetime import datetime

router = APIRouter()


@router.post("/meals/log")
def log_meal(payload: dict):
    """
    Called by the frontend when the patient logs a meal.
    Writes one row per meal to meal_logs table.
    """
    meal_type   = payload.get("meal_type")
    description = payload.get("description", "")
    skipped     = payload.get("skipped", False)

    if not meal_type:
        return {"error": "meal_type is required (breakfast | lunch | dinner)"}

    if meal_type not in ["breakfast", "lunch", "dinner", "snack"]:
        return {"error": "meal_type must be breakfast, lunch, dinner, or snack"}

    supabase.table("meal_logs").insert({
        "patient_id":  PATIENT_ID,
        "logged_at":   datetime.now().isoformat(),
        "meal_type":   meal_type,
        "description": description,
        "skipped":     skipped,
        "skip_reason": payload.get("skip_reason", None)
    }).execute()

    # Log the action for audit trail
    write_agent_action(
        patient_id=PATIENT_ID,
        action_type="meal_logged",
        detail=f"Patient logged {meal_type}: {description or 'no description'}",
        triggered_by="patient_app",
        silent=True,
        outcome="logged"
    )

    return {
        "status":    "meal logged",
        "meal_type": meal_type,
        "logged_at": datetime.now().isoformat()
    }


@router.post("/meals/skip")
def skip_meal(payload: dict):
    """
    Called when the patient explicitly marks a meal as skipped.
    """
    meal_type   = payload.get("meal_type")
    skip_reason = payload.get("skip_reason", "not_specified")

    if not meal_type:
        return {"error": "meal_type is required"}

    supabase.table("meal_logs").insert({
        "patient_id":  PATIENT_ID,
        "logged_at":   datetime.now().isoformat(),
        "meal_type":   meal_type,
        "description": None,
        "skipped":     True,
        "skip_reason": skip_reason
    }).execute()

    write_meal_skip_confirmed(
        patient_id=PATIENT_ID,
        meal_type=meal_type,
        skip_reason=skip_reason
    )

    return {
        "status":      "meal skip logged",
        "meal_type":   meal_type,
        "skip_reason": skip_reason
    }


@router.get("/meals/today")
def get_today_meals():
    """
    Returns all meal logs for today.
    Frontend uses this to show what has been logged.
    """
    today = datetime.now().strftime("%Y-%m-%d")

    meals = supabase.table("meal_logs") \
        .select("*") \
        .eq("patient_id", PATIENT_ID) \
        .gte("logged_at", f"{today}T00:00:00") \
        .lte("logged_at", f"{today}T23:59:59") \
        .order("logged_at") \
        .execute().data

    # Build a structured summary the frontend can easily render
    summary = {
        "breakfast": None,
        "lunch":     None,
        "dinner":    None,
        "snack":     None
    }

    for meal in meals:
        meal_type = meal.get("meal_type")
        if meal_type in summary:
            summary[meal_type] = {
                "logged":      not meal.get("skipped", False),
                "skipped":     meal.get("skipped", False),
                "description": meal.get("description"),
                "logged_at":   meal.get("logged_at"),
                "skip_reason": meal.get("skip_reason")
            }

    return {
        "date":   today,
        "meals":  summary,
        "total_logged":  sum(1 for m in summary.values() if m and m["logged"]),
        "total_skipped": sum(1 for m in summary.values() if m and m["skipped"])
    }