from database.supabase_client import supabase
from datetime import datetime


def load_patient_data(patient_id: str) -> dict:
    """
    Fetches all patient data from Supabase and assembles it into
    a unified dict that the agent tools can consume.
    All time-sensitive tables are filtered to today only.
    """
    today = datetime.now().strftime("%Y-%m-%d")

    # ── Core profile ──────────────────────────────────────────
    profile = supabase.table("patients") \
        .select("*, profiles(*)") \
        .eq("id", patient_id) \
        .single() \
        .execute().data

    # ── Glucose readings (today only) ─────────────────────────
    glucose = supabase.table("glucose_readings") \
        .select("*") \
        .eq("patient_id", patient_id) \
        .gte("recorded_at", f"{today}T00:00:00") \
        .lte("recorded_at", f"{today}T23:59:59") \
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
            "name":                  m["medication_name"],
            "dosage":                m["dosage"],
            "frequency":             m["frequency"],
            "scheduled_times":       m["scheduled_times"],
            "requires_food":         m["requires_food"],
            "take_before_meal_mins": m.get("take_before_meal_mins", None)
        }
        for m in med_plans
    ]

    # ── Dose logs (today — all statuses) ─────────────────────
    # Fetches all statuses so tool_medication_tracker can run
    # the two-reminder logic correctly
    dose_logs_raw = supabase.table("medication_dose_logs") \
        .select("*") \
        .eq("patient_id", patient_id) \
        .gte("scheduled_time", f"{today}T00:00:00") \
        .execute().data

    # Separate missed list for urgency scoring
    missed_medications = [
        f"{log['medication_name']} {log['scheduled_time']}"
        for log in dose_logs_raw
        if log.get("status") == "missed"
    ]

    # ── Meals logged (today only) ─────────────────────────────
    meals = supabase.table("meal_logs") \
        .select("*") \
        .eq("patient_id", patient_id) \
        .gte("logged_at", f"{today}T00:00:00") \
        .lte("logged_at", f"{today}T23:59:59") \
        .order("logged_at") \
        .execute().data

    meals_logged = [
        {
            "time":        m["logged_at"][11:16],
            "meal_type":   m.get("meal_type", ""),
            "description": m.get("description", ""),
            "skipped":     m.get("skipped", False),
            "skip_reason": m.get("skip_reason", None)
        }
        for m in meals
    ]

    # ── Exercise / wearable (today only) ─────────────────────
    exercise = supabase.table("exercise_logs") \
        .select("*") \
        .eq("patient_id", patient_id) \
        .gte("date", today) \
        .execute().data

    steps_today   = sum(e.get("steps", 0) for e in exercise)
    sitting_hours = sum(e.get("sitting_minutes", 0) for e in exercise) / 60

    # ── Calendar events (today only) ──────────────────────────
    calendar_events = supabase.table("calendar_events") \
        .select("*") \
        .eq("patient_id", patient_id) \
        .gte("start_time", f"{today}T00:00:00") \
        .lte("start_time", f"{today}T23:59:59") \
        .order("start_time") \
        .execute().data

    today_meetings = [
        {
            "title": e["title"],
            "start": e["start_time"][11:16],
            "end":   e["end_time"][11:16]
        }
        for e in calendar_events
    ]

    # Infer lunch_blocked from meetings or explicit flag
    lunch_blocked = any(e.get("lunch_blocked", False) for e in calendar_events)
    if not lunch_blocked:
        # Also infer if any meeting spans 12:00-14:00
        for e in calendar_events:
            start = e["start_time"][11:16]
            end   = e["end_time"][11:16]
            if start <= "13:00" <= end:
                lunch_blocked = True
                break

    # ── Available clinic slots ────────────────────────────────
    clinic_slots_raw = supabase.table("appointments") \
        .select("*") \
        .eq("patient_id", patient_id) \
        .eq("status", "available") \
        .execute().data

    available_clinic_slots = [
        {
            "date":   s["date"],
            "time":   s["time"],
            "clinic": s["clinic"]
        }
        for s in clinic_slots_raw
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
        "id":                 patient_id,
        "name":               profile["profiles"]["full_name"],
        "age":                profile.get("age"),
        "conditions":         profile.get("conditions", []),
        "allergies":          profile.get("allergies", []),
        "last_clinic_visit":  profile.get("last_clinic_visit"),
        "medications":        medications,
        "missed_medications": missed_medications,
        "dose_logs":          dose_logs_raw,
        "glucose_readings":   glucose_readings,
        "glucose_target": {
            "fasting_min":   4.0,
            "fasting_max":   7.0,
            "post_meal_max": 10.0
        },
        "meals_logged":  meals_logged,
        "wearable": {
            "steps_today":       steps_today,
            "steps_goal":        8000,
            "active_minutes":    active_minutes,
            "sitting_hours":     sitting_hours,
            "sitting_episodes":  sitting_episodes,
            "heart_rate":        heart_rate,
        },
        "calendar": {
            "today_meetings":         today_meetings,
            "lunch_blocked":          lunch_blocked,
            "available_clinic_slots": available_clinic_slots
        },
        "weekly_summary": weekly_summary
    }