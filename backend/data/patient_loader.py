from backend.supabase_client import supabase


def load_patient_data(patient_id: str) -> dict:
    """
    Fetches all patient data from Supabase and assembles it into
    a frontend-friendly structure similar to the old mock format.
    """

    # ── Patient row ───────────────────────────────────────────
    patient_res = (
        supabase.table("patients")
        .select("*")
        .eq("id", patient_id)
        .single()
        .execute()
    )
    patient = patient_res.data

    # ── Profile row ───────────────────────────────────────────
    profile_res = (
        supabase.table("profiles")
        .select("*")
        .eq("id", patient["user_id"])
        .single()
        .execute()
    )
    profile = profile_res.data

    # ── Glucose readings ──────────────────────────────────────
    glucose_res = (
        supabase.table("glucose_readings")
        .select("*")
        .eq("patient_id", patient_id)
        .order("timestamp")
        .execute()
    )
    glucose = glucose_res.data or []

    glucose_readings = [
        {
            "time": r["timestamp"][11:16],   # HH:MM
            "value": r["value_mmol"],
            "reading_type": r.get("reading_type"),
            "source": r.get("source", "cgm"),
        }
        for r in glucose
    ]

    # ── Medication plans ──────────────────────────────────────
    med_res = (
        supabase.table("medication_plans")
        .select("*")
        .eq("patient_id", patient_id)
        .execute()
    )
    med_plans = med_res.data or []

    medications = [
        {
            "name": m["name"],
            "dosage": m.get("dose"),
            "frequency": m.get("frequency"),
            "scheduled_times": m.get("scheduled_times", []),
            "requires_food": m.get("requires_food", False),
            "min_food_gap_mins": m.get("min_food_gap_mins"),
            "take_before_meal_mins": m.get("take_before_meal_mins"),
            "side_effects_if_empty": m.get("side_effects_if_empty"),
        }
        for m in med_plans
    ]

    # Build lookup for dose-log name resolution
    med_name_by_id = {m["id"]: m["name"] for m in med_plans}

    # ── Dose logs ─────────────────────────────────────────────
    dose_res = (
        supabase.table("medication_dose_logs")
        .select("*")
        .eq("patient_id", patient_id)
        .order("dose_date")
        .execute()
    )
    dose_logs = dose_res.data or []

    missed_medications = [
        f"{med_name_by_id.get(log.get('medication_plan_id'), 'Unknown')} {log.get('scheduled_time')}"
        for log in dose_logs
        if log.get("status") == "missed"
    ]

    # ── Meal logs ─────────────────────────────────────────────
    meal_res = (
        supabase.table("meal_logs")
        .select("*")
        .eq("patient_id", patient_id)
        .order("date")
        .execute()
    )
    meals = meal_res.data or []

    meals_logged = [
        {
            "date": m["date"],
            "time": m.get("time"),
            "description": m.get("description", ""),
            "meal_type": m.get("meal_type", ""),
            "logged": m.get("logged", True),
            "skipped": m.get("skipped", False),
            "skip_reason": m.get("skip_reason"),
        }
        for m in meals
    ]

    # ── Exercise logs ─────────────────────────────────────────
    exercise_res = (
        supabase.table("exercise_logs")
        .select("*")
        .eq("patient_id", patient_id)
        .order("date")
        .execute()
    )
    exercise = exercise_res.data or []

    steps_today = sum((e.get("steps") or 0) for e in exercise)

    sitting_minutes = 0
    for e in exercise:
        for ep in e.get("sitting_episodes", []) or []:
            sitting_minutes += ep.get("duration_mins", 0)

    sitting_hours = sitting_minutes / 60 if sitting_minutes else 0

    latest_step_goal = exercise[-1].get("step_goal", 8000) if exercise else 8000

    # ── Calendar events ───────────────────────────────────────
    calendar_res = (
        supabase.table("calendar_events")
        .select("*")
        .eq("patient_id", patient_id)
        .order("event_date")
        .order("start_time")
        .execute()
    )
    calendar = calendar_res.data or []

    today_meetings = [
        {
            "date": e["event_date"],
            "title": e["title"],
            "start": str(e["start_time"])[:5] if e.get("start_time") else None,
            "end": str(e["end_time"])[:5] if e.get("end_time") else None,
            "type": e.get("type"),
            "audio_only": e.get("audio_only", False),
        }
        for e in calendar
    ]

    # ── Weekly digest ─────────────────────────────────────────
    digest_res = (
        supabase.table("weekly_health_digests")
        .select("*")
        .eq("patient_id", patient_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    digest_rows = digest_res.data or []
    weekly_summary = digest_rows[0] if digest_rows else {}

    # ── Agent actions ─────────────────────────────────────────
    agent_res = (
        supabase.table("agent_actions")
        .select("*")
        .eq("patient_id", patient_id)
        .order("timestamp", desc=True)
        .limit(10)
        .execute()
    )
    agent_actions = agent_res.data or []

    # ── Assemble final object ─────────────────────────────────
    return {
        "name": profile.get("full_name"),
        "age": patient.get("age"),
        "gender": patient.get("gender"),
        "ethnicity": patient.get("ethnicity"),
        "condition": patient.get("condition"),
        "diagnosis_date": patient.get("diagnosis_date"),
        "emergency_contact": patient.get("emergency_contact"),

        "medications": medications,
        "missed_medications": missed_medications,

        "glucose_readings": glucose_readings,
        "glucose_target": {
            "fasting_min": 4.0,
            "fasting_max": 7.0,
            "post_meal_max": 10.0
        },

        "meals_logged": meals_logged,

        "wearable": {
            "steps_today": steps_today,
            "steps_goal": latest_step_goal,
            "sitting_hours": round(sitting_hours, 1),
        },

        "calendar": {
            "today_meetings": today_meetings,
            "available_clinic_slots": []
        },

        "weekly_summary": weekly_summary,
        "agent_actions": agent_actions,
    }