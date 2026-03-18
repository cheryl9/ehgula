from supabase_client import supabase
from datetime import datetime


def load_patient_data(patient_id: str) -> dict:
    """
    Fetches all patient data from Supabase.
    Column names match confirmed schema from screenshots.
    """
    today = datetime.now().strftime("%Y-%m-%d")

    # ── Step 1: Patient row ───────────────────────────────────
    patient = supabase.table("patients") \
        .select("*") \
        .eq("id", patient_id) \
        .single() \
        .execute().data

    # ── Step 2: Profile via patients.user_id ─────────────────
    profile = supabase.table("profiles") \
        .select("*") \
        .eq("id", patient["user_id"]) \
        .single() \
        .execute().data

    # ── Glucose readings (today only) ─────────────────────────
    # column: timestamp (timestamptz), value_mmol (numeric)
    glucose = supabase.table("glucose_readings") \
        .select("*") \
        .eq("patient_id", patient_id) \
        .gte("timestamp", f"{today}T00:00:00") \
        .lte("timestamp", f"{today}T23:59:59") \
        .order("timestamp") \
        .execute().data

    glucose_readings = [
        {
            "time":         r["timestamp"][11:16],
            "value":        float(r["value_mmol"]),
            "reading_type": r.get("reading_type", ""),
            "source":       r.get("source", "")
        }
        for r in glucose
    ]

    # ── Medications ───────────────────────────────────────────
    # columns: name, dose, frequency, scheduled_times (jsonb),
    #          requires_food, take_before_meal_mins
    med_plans = supabase.table("medication_plans") \
        .select("*") \
        .eq("patient_id", patient_id) \
        .execute().data

    medications = [
        {
            "id":                    m["id"],
            "name":                  m["name"],
            "dosage":                m["dose"],
            "frequency":             m["frequency"],
            "scheduled_times":       m["scheduled_times"],
            "requires_food":         m["requires_food"],
            "take_before_meal_mins": m.get("take_before_meal_mins", None),
            "min_food_gap_mins":     m.get("min_food_gap_mins", None),
            "side_effects_if_empty": m.get("side_effects_if_empty", "")
        }
        for m in med_plans
    ]

    # ── Dose logs (today — all statuses) ─────────────────────
    # columns: medication_plan_id, dose_date (date),
    #          scheduled_time (time), actual_time (time), status
    dose_logs_raw = supabase.table("medication_dose_logs") \
        .select("*, medication_plans(name, dose)") \
        .eq("patient_id", patient_id) \
        .eq("dose_date", today) \
        .execute().data

    missed_medications = [
        f"{log['medication_plans']['name']} {log['scheduled_time']}"
        for log in dose_logs_raw
        if log.get("status") == "missed" and log.get("medication_plans")
    ]

    # ── Meals logged (today only) ─────────────────────────────
    # columns: date (date), time (time), meal_type, logged (bool),
    #          skipped (bool), skip_reason, description
    meals = supabase.table("meal_logs") \
        .select("*") \
        .eq("patient_id", patient_id) \
        .eq("date", today) \
        .order("time") \
        .execute().data

    meals_logged = [
        {
            "time":        m.get("time", ""),
            "meal_type":   m.get("meal_type", ""),
            "description": m.get("description", ""),
            "skipped":     m.get("skipped", False),
            "skip_reason": m.get("skip_reason", None),
            "logged":      m.get("logged", True)
        }
        for m in meals
    ]

    # ── Exercise / wearable (today only) ─────────────────────
    # columns: date, steps, step_goal, active_minutes,
    #          sitting_episodes (jsonb), walking_sessions (jsonb),
    #          heart_rate (jsonb)
    exercise = supabase.table("exercise_logs") \
        .select("*") \
        .eq("patient_id", patient_id) \
        .eq("date", today) \
        .execute().data

    steps_today      = sum(e.get("steps", 0) for e in exercise)
    steps_goal       = exercise[0].get("step_goal", 8000) if exercise else 8000
    active_minutes   = sum(e.get("active_minutes", 0) for e in exercise)
    sitting_episodes = []
    walking_sessions = []
    heart_rate       = []
    for e in exercise:
        sitting_episodes += e.get("sitting_episodes", []) or []
        walking_sessions += e.get("walking_sessions", []) or []
        heart_rate       += e.get("heart_rate", []) or []

    # Calculate sitting hours from episodes
    sitting_mins  = sum(ep.get("duration_mins", 0) for ep in sitting_episodes)
    sitting_hours = round(sitting_mins / 60, 1)

    # ── Calendar events (today only) ──────────────────────────
    # columns: event_date (date), title, start_time (time),
    #          end_time (time), type, audio_only
    calendar_events = supabase.table("calendar_events") \
        .select("*") \
        .eq("patient_id", patient_id) \
        .eq("event_date", today) \
        .order("start_time") \
        .execute().data

    today_meetings = [
        {
            "title":      e["title"],
            "start":      e["start_time"],   # already HH:MM:SS time type
            "end":        e["end_time"],
            "type":       e.get("type", ""),
            "audio_only": e.get("audio_only", False)
        }
        for e in calendar_events
    ]

    # Infer lunch_blocked from meetings spanning 12:00-14:00
    lunch_blocked = False
    for e in calendar_events:
        start = e["start_time"][:5]  # HH:MM
        end   = e["end_time"][:5]
        if start <= "13:00" <= end:
            lunch_blocked = True
            break

    # ── Available clinic slots ────────────────────────────────
    # appointments with status = "available"
    clinic_slots_raw = supabase.table("appointments") \
        .select("*") \
        .eq("patient_id", patient_id) \
        .eq("status", "available") \
        .execute().data

    available_clinic_slots = [
        {
            "date":           str(s["date"]),
            "time":           str(s["time"]),
            "clinic":         s["clinic"],
            "clinician_name": s.get("clinician_name", "")
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
        "id":                   patient_id,
        "name":                 patient.get("name") or profile.get("full_name", "Unknown"),
        "age":                  patient.get("age"),
        "gender":               patient.get("gender"),
        "ethnicity":            patient.get("ethnicity"),
        "condition":            patient.get("condition", ""),
        "conditions":           [patient["condition"]] if patient.get("condition") else [],
        "diagnosis_date":       patient.get("diagnosis_date"),
        "emergency_contact":    patient.get("emergency_contact"),
        "primary_clinician_id": patient.get("primary_clinician_id"),
        "language_preference":  profile.get("language_preference", "English"),
        "full_name":            profile.get("full_name", ""),
        "allergies":            patient.get("allergies", []),
        "last_clinic_visit":    patient.get("last_clinic_visit", None),
        "medications":          medications,
        "missed_medications":   missed_medications,
        "dose_logs":            dose_logs_raw,
        "glucose_readings":     glucose_readings,
        "glucose_target": {
            "fasting_min":      4.0,
            "fasting_max":      7.0,
            "post_meal_max":    10.0
        },
        "meals_logged": meals_logged,
        "wearable": {
            "steps_today":      steps_today,
            "steps_goal":       steps_goal,
            "active_minutes":   active_minutes,
            "sitting_hours":    sitting_hours,
            "sitting_episodes": sitting_episodes,
            "walking_sessions": walking_sessions,
            "heart_rate":       heart_rate,
        },
        "calendar": {
            "today_meetings":         today_meetings,
            "lunch_blocked":          lunch_blocked,
            "available_clinic_slots": available_clinic_slots
        },
        "weekly_summary": weekly_summary
    }