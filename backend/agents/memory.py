from database.supabase_client import supabase


def load_patient_data(patient_id: str) -> dict:
    """
    Fetches all patient data from Supabase and assembles it into
    a unified dict that the agent tools can consume.
    """

    # ── Core profile ──────────────────────────────────────────
    profile = supabase.table("patients") \
        .select("*, profiles(*)") \
        .eq("id", patient_id) \
        .single() \
        .execute().data

    # ── Glucose readings ──────────────────────────────────────
    glucose = supabase.table("glucose_readings") \
        .select("*") \
        .eq("patient_id", patient_id) \
        .order("recorded_at") \
        .execute().data

    glucose_readings = [
        {
            "time":  r["recorded_at"][11:16],
            "value": r["value"],
            "note":  r.get("note", "")
        }
        for r in glucose
    ]

    # ── Medications ───────────────────────────────────────────
    med_plans = supabase.table("medication_plans") \
        .select("*") \
        .eq("patient_id", patient_id) \
        .execute().data

    medications = [
        {
            "name":            m["medication_name"],
            "dosage":          m["dosage"],
            "frequency":       m["frequency"],
            "scheduled_times": m["scheduled_times"],
            "requires_food":   m["requires_food"]
        }
        for m in med_plans
    ]

    # ── Missed medications ────────────────────────────────────
    dose_logs = supabase.table("medication_dose_logs") \
        .select("*") \
        .eq("patient_id", patient_id) \
        .eq("status", "missed") \
        .execute().data

    missed_medications = [
        f"{log['medication_name']} {log['scheduled_time']}"
        for log in dose_logs
    ]

    # ── Meals logged ──────────────────────────────────────────
    meals = supabase.table("meal_logs") \
        .select("*") \
        .eq("patient_id", patient_id) \
        .execute().data

    meals_logged = [
        {
            "time":        m["logged_at"][11:16],
            "description": m.get("description", ""),
            "meal_type":   m.get("meal_type", "")
        }
        for m in meals
    ]

    # ── Exercise / wearable ───────────────────────────────────
    exercise = supabase.table("exercise_logs") \
        .select("*") \
        .eq("patient_id", patient_id) \
        .execute().data

    steps_today   = sum(e.get("steps", 0) for e in exercise)
    sitting_hours = sum(e.get("sitting_minutes", 0) for e in exercise) / 60

    # ── Calendar events ───────────────────────────────────────
    calendar = supabase.table("calendar_events") \
        .select("*") \
        .eq("patient_id", patient_id) \
        .execute().data

    today_meetings = [
        {
            "title": e["title"],
            "start": e["start_time"][11:16],
            "end":   e["end_time"][11:16]
        }
        for e in calendar
    ]

    # ── Weekly digest ─────────────────────────────────────────
    digest = supabase.table("weekly_health_digests") \
        .select("*") \
        .eq("patient_id", patient_id) \
        .order("created_at", desc=True) \
        .limit(1) \
        .execute().data

    weekly_summary = digest[0] if digest else {}

    # ── Assemble ──────────────────────────────────────────────
    return {
        "name":               profile["profiles"]["full_name"],
        "age":                profile.get("age"),
        "conditions":         profile.get("conditions", []),
        "allergies":          profile.get("allergies", []),
        "medications":        medications,
        "missed_medications": missed_medications,
        "glucose_readings":   glucose_readings,
        "glucose_target": {
            "fasting_min":   4.0,
            "fasting_max":   7.0,
            "post_meal_max": 10.0
        },
        "meals_logged":       meals_logged,
        "last_clinic_visit":  profile.get("last_clinic_visit"),
        "wearable": {
            "steps_today":   steps_today,
            "steps_goal":    8000,
            "sitting_hours": round(sitting_hours, 1),
        },
        "calendar": {
            "today_meetings":         today_meetings,
            "available_clinic_slots": []
        },
        "weekly_summary": weekly_summary
    }