import os
import random
from datetime import date, datetime, time, timedelta
from typing import Any

from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
CLINICIAN_USER_ID = os.getenv("CLINICIAN_USER_ID")  # auth/profiles UUID for the clinician

if not SUPABASE_URL:
    raise ValueError("Missing SUPABASE_URL in .env")
if not SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError("Missing SUPABASE_SERVICE_ROLE_KEY in .env")
if not CLINICIAN_USER_ID:
    raise ValueError("Missing CLINICIAN_USER_ID in .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Replace these with real Supabase Auth UUIDs after creating the 4 patient users.
PATIENT_USER_IDS = {
    "P001": "e62fd147-c7cc-45d2-b86c-629970ec9d7c",
    "P002": "90dcf887-375a-4048-880c-ee52641a4551",
    "P003": "115eb0bb-5682-4174-9f94-0e7100001b42",
    "P004": "31002861-9585-4db0-8631-1e49a34e27a9",
}

PATIENTS = [
    {
        "patient_code": "P001",
        "full_name": "David Tan",
        "age": 45,
        "gender": "Male",
        "ethnicity": "Chinese",
        "condition": "Type 2 Diabetes",
        "diagnosis_date": "2021-03-15",
        "emergency_contact": "Wife — +65 9123 4567",
        "language_preference": "English",
        "risk_profile": "high_lunch_skip",
        "medications": [
            {"name": "Metformin", "dose": "500mg", "frequency": "Twice daily", "scheduled_times": ["08:00", "13:00"], "requires_food": True, "min_food_gap_mins": 0, "take_before_meal_mins": None, "side_effects_if_empty": "Nausea, vomiting"},
            {"name": "Glipizide", "dose": "5mg", "frequency": "Once daily", "scheduled_times": ["12:30"], "requires_food": True, "min_food_gap_mins": None, "take_before_meal_mins": 30, "side_effects_if_empty": None},
            {"name": "Rosuvastatin", "dose": "10mg", "frequency": "Once daily", "scheduled_times": ["21:00"], "requires_food": False, "min_food_gap_mins": None, "take_before_meal_mins": None, "side_effects_if_empty": None},
        ],
        "appointments": [
            {
                "date": "2026-03-25",
                "time": "09:00",
                "clinic": "City Diabetes Center",
                "clinician_name": "Dr. Sarah Johnson",
                "type": "routine",
                "auto_booked": False,
                "booking_reason": "Regular follow-up",
                "urgency_score": 35,
                "status": "scheduled",
            },
            {
                "date": "2026-03-20",
                "time": "14:30",
                "clinic": "Downtown Clinic",
                "clinician_name": "Dr. Michael Chen",
                "type": "urgent",
                "auto_booked": True,
                "booking_reason": "Glucose unstable 5 days",
                "urgency_score": 82,
                "status": "scheduled",
            },
        ],
        "weekly_digests": [
            {
                "week_start": "2026-03-09",
                "week_end": "2026-03-15",
                "avg_fasting_glucose": 7.3,
                "avg_post_meal_glucose": 8.2,
                "medication_adherence_pct": 72,
                "meals_skipped": 3,
                "skip_pattern": ["Tuesday", "Thursday"],
                "avg_steps": 4500,
                "step_goal_met_days": 1,
                "sitting_episodes_flagged": 6,
                "agent_actions_taken": 12,
                "agent_actions_silent": 8,
                "worst_day": "Thursday",
                "highlights": {
                    "positive": "Glipizide adherence remains strong",
                    "concern": "Lunch skip pattern continues"
                },
            },
            {
                "week_start": "2026-03-02",
                "week_end": "2026-03-08",
                "avg_fasting_glucose": 7.0,
                "avg_post_meal_glucose": 7.8,
                "medication_adherence_pct": 75,
                "meals_skipped": 2,
                "skip_pattern": ["Tuesday"],
                "avg_steps": 5200,
                "step_goal_met_days": 2,
                "sitting_episodes_flagged": 5,
                "agent_actions_taken": 9,
                "agent_actions_silent": 6,
                "worst_day": "Tuesday",
                "highlights": {
                    "positive": "Activity improved slightly",
                    "concern": "Medication adherence trending down"
                },
            },
        ],
    },
    {
        "patient_code": "P002",
        "full_name": "Mary Lim",
        "age": 58,
        "gender": "Female",
        "ethnicity": "Chinese",
        "condition": "Type 2 Diabetes",
        "diagnosis_date": "2018-07-21",
        "emergency_contact": "Daughter — +65 9876 5432",
        "language_preference": "English",
        "risk_profile": "excellent_control",
        "medications": [
            {"name": "Metformin", "dose": "500mg", "frequency": "Twice daily", "scheduled_times": ["08:00", "20:00"], "requires_food": True, "min_food_gap_mins": 0, "take_before_meal_mins": None, "side_effects_if_empty": None},
            {"name": "Lisinopril", "dose": "10mg", "frequency": "Once daily", "scheduled_times": ["08:00"], "requires_food": False, "min_food_gap_mins": None, "take_before_meal_mins": None, "side_effects_if_empty": None},
            {"name": "Atorvastatin", "dose": "20mg", "frequency": "Once daily", "scheduled_times": ["21:00"], "requires_food": False, "min_food_gap_mins": None, "take_before_meal_mins": None, "side_effects_if_empty": None},
        ],
        "appointments": [
            {
                "date": "2026-03-22",
                "time": "10:30",
                "clinic": "City Diabetes Center",
                "clinician_name": "Dr. Sarah Johnson",
                "type": "routine",
                "auto_booked": False,
                "booking_reason": "Routine check-in",
                "urgency_score": 28,
                "status": "scheduled",
            }
        ],
        "weekly_digests": [
            {
                "week_start": "2026-03-09",
                "week_end": "2026-03-15",
                "avg_fasting_glucose": 6.2,
                "avg_post_meal_glucose": 6.6,
                "medication_adherence_pct": 100,
                "meals_skipped": 0,
                "skip_pattern": [],
                "avg_steps": 11500,
                "step_goal_met_days": 7,
                "sitting_episodes_flagged": 1,
                "agent_actions_taken": 2,
                "agent_actions_silent": 1,
                "worst_day": "None",
                "highlights": {
                    "positive": "Excellent glucose control",
                    "concern": "No major concerns"
                },
            }
        ],
    },
    {
        "patient_code": "P003",
        "full_name": "Ahmad Razif",
        "age": 39,
        "gender": "Male",
        "ethnicity": "Malay",
        "condition": "Type 2 Diabetes",
        "diagnosis_date": "2026-01-10",
        "emergency_contact": "Brother — +65 9011 2233",
        "language_preference": "English",
        "risk_profile": "low_engagement",
        "medications": [
            {"name": "Metformin", "dose": "500mg", "frequency": "Twice daily", "scheduled_times": ["08:00", "20:00"], "requires_food": True, "min_food_gap_mins": 0, "take_before_meal_mins": None, "side_effects_if_empty": None},
            {"name": "Glipizide", "dose": "5mg", "frequency": "Once daily", "scheduled_times": ["12:30"], "requires_food": True, "min_food_gap_mins": None, "take_before_meal_mins": 30, "side_effects_if_empty": None},
        ],
        "appointments": [],
        "weekly_digests": [
            {
                "week_start": "2026-03-09",
                "week_end": "2026-03-15",
                "avg_fasting_glucose": 8.4,
                "avg_post_meal_glucose": 8.9,
                "medication_adherence_pct": 38,
                "meals_skipped": 5,
                "skip_pattern": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                "avg_steps": 1800,
                "step_goal_met_days": 0,
                "sitting_episodes_flagged": 10,
                "agent_actions_taken": 4,
                "agent_actions_silent": 2,
                "worst_day": "Friday",
                "highlights": {
                    "positive": "Recently diagnosed and reachable for follow-up",
                    "concern": "Poor adherence and minimal engagement"
                },
            }
        ],
    },
    {
        "patient_code": "P004",
        "full_name": "Priya Nair",
        "age": 33,
        "gender": "Female",
        "ethnicity": "Indian",
        "condition": "Diabetes in Pregnancy",
        "diagnosis_date": "2025-11-03",
        "emergency_contact": "Husband — +65 9555 1212",
        "language_preference": "English",
        "risk_profile": "pregnancy_high_risk",
        "medications": [
            {"name": "Insulin (NPH)", "dose": "10 units", "frequency": "Twice daily", "scheduled_times": ["08:00", "20:00"], "requires_food": False, "min_food_gap_mins": None, "take_before_meal_mins": None, "side_effects_if_empty": None},
            {"name": "Metformin", "dose": "500mg", "frequency": "Twice daily", "scheduled_times": ["08:00", "20:00"], "requires_food": True, "min_food_gap_mins": 0, "take_before_meal_mins": None, "side_effects_if_empty": None},
        ],
        "appointments": [],
        "weekly_digests": [
            {
                "week_start": "2026-03-09",
                "week_end": "2026-03-15",
                "avg_fasting_glucose": 6.8,
                "avg_post_meal_glucose": 7.2,
                "medication_adherence_pct": 94,
                "meals_skipped": 1,
                "skip_pattern": [],
                "avg_steps": 4000,
                "step_goal_met_days": 4,
                "sitting_episodes_flagged": 3,
                "agent_actions_taken": 5,
                "agent_actions_silent": 3,
                "worst_day": "Wednesday",
                "highlights": {
                    "positive": "Good meal timing and strong adherence",
                    "concern": "Glucose above pregnancy target"
                },
            }
        ],
    },
]


def upsert_profile(user_id: str, full_name: str, language_preference: str) -> None:
    supabase.table("profiles").upsert(
        {
            "id": user_id,
            "role": "patient",
            "full_name": full_name,
            "language_preference": language_preference,
        }
    ).execute()


def get_clinician_id() -> str:
    print("CLINICIAN_USER_ID from env:", repr(CLINICIAN_USER_ID))

    all_clinicians = supabase.table("clinicians").select("*").execute()
    print("All clinicians rows:", all_clinicians.data)

    res = (
        supabase.table("clinicians")
        .select("*")
        .eq("user_id", CLINICIAN_USER_ID)
        .execute()
    )

    print("Matched clinician rows:", res.data)

    if not res.data:
        raise ValueError(
            f"No clinician row found for CLINICIAN_USER_ID={CLINICIAN_USER_ID}"
        )

    return res.data[0]["id"]

def upsert_patient(patient: dict[str, Any], clinician_id: str) -> str:
    user_id = PATIENT_USER_IDS[patient["patient_code"]]
    res = (
        supabase.table("patients")
        .upsert(
            {
                "user_id": user_id,
                "patient_code": patient["patient_code"],
                "age": patient["age"],
                "gender": patient["gender"],
                "ethnicity": patient["ethnicity"],
                "condition": patient["condition"],
                "diagnosis_date": patient["diagnosis_date"],
                "emergency_contact": patient["emergency_contact"],
                "primary_clinician_id": clinician_id,
            },
            on_conflict="user_id",
        )
        .execute()
    )
    patient_row = (
        supabase.table("patients")
        .select("id")
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    return patient_row.data["id"]


def ensure_assignment(clinician_id: str, patient_id: str) -> None:
    supabase.table("clinician_patient_assignments").upsert(
        {
            "clinician_id": clinician_id,
            "patient_id": patient_id,
        },
        on_conflict="clinician_id,patient_id",
    ).execute()


def insert_medication_plans(patient_id: str, medications: list[dict[str, Any]]) -> dict[str, str]:
    existing = (
        supabase.table("medication_plans")
        .select("id,name")
        .eq("patient_id", patient_id)
        .execute()
    ).data or []

    if existing:
        return {m["name"]: m["id"] for m in existing}

    rows = []
    for med in medications:
        rows.append(
            {
                "patient_id": patient_id,
                "name": med["name"],
                "dose": med["dose"],
                "frequency": med["frequency"],
                "scheduled_times": med["scheduled_times"],
                "requires_food": med["requires_food"],
                "min_food_gap_mins": med["min_food_gap_mins"],
                "take_before_meal_mins": med["take_before_meal_mins"],
                "side_effects_if_empty": med["side_effects_if_empty"],
            }
        )

    inserted = supabase.table("medication_plans").insert(rows).execute().data or []
    return {m["name"]: m["id"] for m in inserted}


def daterange(start: date, days: int):
    for i in range(days):
        yield start + timedelta(days=i)


def generate_glucose_rows(patient_code: str, patient_id: str, start_date: date, days: int) -> list[dict[str, Any]]:
    rows = []
    rng = random.Random(patient_code)

    for d in daterange(start_date, days):
        weekday = d.weekday()  # Mon=0
        times = [time(8, 0), time(10, 0), time(12, 0), time(13, 0), time(15, 0), time(17, 0), time(19, 0), time(21, 0)]

        for t in times:
            ts = datetime.combine(d, t).isoformat()

            if patient_code == "P001":
                if weekday in [1, 3] and t in [time(12, 0), time(13, 0)]:
                    val = round(rng.uniform(3.8, 4.5), 1)
                    reading_type = "lunch_window"
                elif t == time(8, 0):
                    val = round(rng.uniform(6.5, 7.5), 1)
                    reading_type = "fasting"
                elif t in [time(10, 0), time(15, 0)]:
                    val = round(rng.uniform(8.0, 9.3), 1)
                    reading_type = "post_meal"
                else:
                    val = round(rng.uniform(5.2, 7.0), 1)
                    reading_type = "normal"

            elif patient_code == "P002":
                if t == time(8, 0):
                    val = round(rng.uniform(5.8, 6.5), 1)
                    reading_type = "fasting"
                elif t in [time(10, 0), time(15, 0)]:
                    val = round(rng.uniform(6.2, 7.0), 1)
                    reading_type = "post_meal"
                else:
                    val = round(rng.uniform(5.5, 6.6), 1)
                    reading_type = "normal"

            elif patient_code == "P003":
                # low engagement: only some days, fewer rows
                if weekday in [0, 2, 4] and t not in [time(8, 0), time(15, 0)]:
                    continue
                if t == time(8, 0):
                    val = round(rng.uniform(7.6, 8.8), 1)
                    reading_type = "fasting"
                else:
                    val = round(rng.uniform(7.8, 9.4), 1)
                    reading_type = "post_meal"

            else:  # P004
                if t == time(8, 0):
                    val = round(rng.uniform(6.2, 7.0), 1)
                    reading_type = "fasting"
                elif t in [time(10, 0), time(15, 0)]:
                    val = round(rng.uniform(6.8, 7.8), 1)
                    reading_type = "post_meal"
                else:
                    val = round(rng.uniform(6.0, 7.2), 1)
                    reading_type = "normal"

            rows.append(
                {
                    "patient_id": patient_id,
                    "timestamp": ts,
                    "value_mmol": val,
                    "reading_type": reading_type,
                    "source": "cgm",
                }
            )
    return rows


def generate_meal_rows(patient_code: str, patient_id: str, start_date: date, days: int) -> list[dict[str, Any]]:
    rows = []
    rng = random.Random(f"meal-{patient_code}")

    for d in daterange(start_date, days):
        weekday = d.weekday()

        # Breakfast
        breakfast_logged = rng.random() < (0.90 if patient_code != "P003" else 0.20)
        rows.append(
            {
                "patient_id": patient_id,
                "date": d.isoformat(),
                "meal_type": "breakfast",
                "time": "07:30" if breakfast_logged else None,
                "logged": breakfast_logged,
                "skipped": not breakfast_logged,
                "skip_reason": None if breakfast_logged else "not_logged",
                "description": "Breakfast" if breakfast_logged else None,
            }
        )

        # Lunch
        if patient_code == "P001":
            skipped = weekday in [1, 3]  # Tue/Thu
            reason = "back_to_back_meetings" if skipped else None
        elif patient_code == "P002":
            skipped = False
            reason = None
        elif patient_code == "P003":
            skipped = rng.random() < 0.85
            reason = "low_engagement" if skipped else None
        else:
            skipped = rng.random() < 0.10
            reason = "irregular_schedule" if skipped else None

        rows.append(
            {
                "patient_id": patient_id,
                "date": d.isoformat(),
                "meal_type": "lunch",
                "time": None if skipped else "12:30",
                "logged": not skipped,
                "skipped": skipped,
                "skip_reason": reason,
                "description": None if skipped else "Lunch",
            }
        )

        # Dinner
        dinner_logged = (
            rng.random() < 0.85 if patient_code == "P001"
            else rng.random() < 0.98 if patient_code == "P002"
            else rng.random() < 0.18 if patient_code == "P003"
            else rng.random() < 0.92
        )
        rows.append(
            {
                "patient_id": patient_id,
                "date": d.isoformat(),
                "meal_type": "dinner",
                "time": "19:00" if dinner_logged else None,
                "logged": dinner_logged,
                "skipped": not dinner_logged,
                "skip_reason": None if dinner_logged else "not_logged",
                "description": "Dinner" if dinner_logged else None,
            }
        )
    return rows


def generate_exercise_rows(patient_code: str, patient_id: str, start_date: date, days: int) -> list[dict[str, Any]]:
    rows = []
    rng = random.Random(f"exercise-{patient_code}")

    for d in daterange(start_date, days):
        if patient_code == "P001":
            steps = rng.randint(4000, 6500)
            step_goal = 10000
            sitting_episodes = [{"start": "09:00", "end": "12:10", "duration_mins": 190, "flagged": True}]
        elif patient_code == "P002":
            steps = rng.randint(10000, 12500)
            step_goal = 10000
            sitting_episodes = [{"start": "14:00", "end": "14:40", "duration_mins": 40, "flagged": False}]
        elif patient_code == "P003":
            steps = rng.randint(1200, 2500)
            step_goal = 10000
            sitting_episodes = [{"start": "09:00", "end": "16:00", "duration_mins": 420, "flagged": True}]
        else:
            steps = rng.randint(3200, 4800)
            step_goal = 6000
            sitting_episodes = [{"start": "10:00", "end": "11:30", "duration_mins": 90, "flagged": True}]

        rows.append(
            {
                "patient_id": patient_id,
                "date": d.isoformat(),
                "steps": steps,
                "step_goal": step_goal,
                "active_minutes": max(15, steps // 200),
                "sitting_episodes": sitting_episodes,
                "walking_sessions": [],
                "heart_rate": [{"time": "09:00", "bpm": 72, "zone": "resting"}],
            }
        )
    return rows


def generate_calendar_rows(patient_code: str, patient_id: str, start_date: date, days: int) -> list[dict[str, Any]]:
    rows = []
    for d in daterange(start_date, days):
        weekday = d.weekday()
        if patient_code == "P001" and weekday in [1, 3]:
            rows.extend(
                [
                    {"patient_id": patient_id, "event_date": d.isoformat(), "title": "Client presentation", "start_time": "11:00", "end_time": "12:00", "type": "external", "audio_only": False},
                    {"patient_id": patient_id, "event_date": d.isoformat(), "title": "Strategy sync", "start_time": "12:30", "end_time": "14:00", "type": "internal", "audio_only": True},
                ]
            )
        elif patient_code == "P004":
            rows.append(
                {"patient_id": patient_id, "event_date": d.isoformat(), "title": "OB/GYN follow-up", "start_time": "15:00", "end_time": "15:30", "type": "medical", "audio_only": False}
            )
    return rows


def generate_dose_logs(patient_code: str, patient_id: str, med_map: dict[str, str], start_date: date, days: int) -> list[dict[str, Any]]:
    rows = []
    rng = random.Random(f"dose-{patient_code}")

    for d in daterange(start_date, days):
        for med_name, med_id in med_map.items():
            if patient_code == "P001":
                miss_prob = 0.15 if med_name == "Metformin" else 0.02
            elif patient_code == "P002":
                miss_prob = 0.01
            elif patient_code == "P003":
                miss_prob = 0.55
            else:
                miss_prob = 0.06

            status = "missed" if rng.random() < miss_prob else "taken"
            rows.append(
                {
                    "patient_id": patient_id,
                    "medication_plan_id": med_id,
                    "dose_date": d.isoformat(),
                    "scheduled_time": "08:00",
                    "actual_time": None if status == "missed" else "08:05",
                    "status": status,
                    "held_reason": None,
                    "rescheduled_to": None,
                    "agent_action": False,
                }
            )
    return rows


def generate_agent_actions(patient_code: str, patient_id: str) -> list[dict[str, Any]]:
    if patient_code == "P001":
        return [
            {
                "patient_id": patient_id,
                "timestamp": "2026-03-17T13:02:00+08:00",
                "action_type": "medication_held",
                "detail": "Metformin held — no meal detected since 10:30 AM",
                "triggered_by": "lunch_intelligence",
                "silent": True,
                "outcome": "rescheduled to 14:45",
            },
            {
                "patient_id": patient_id,
                "timestamp": "2026-03-17T13:05:00+08:00",
                "action_type": "appointment_booked",
                "detail": "Urgent booking — glucose unstable 5 days",
                "triggered_by": "appointment_agent",
                "silent": False,
                "outcome": "confirmed",
            },
        ]
    if patient_code == "P003":
        return [
            {
                "patient_id": patient_id,
                "timestamp": "2026-03-17T09:00:00+08:00",
                "action_type": "engagement_nudge",
                "detail": "Reminder to log breakfast and take medication",
                "triggered_by": "engagement_agent",
                "silent": False,
                "outcome": "ignored",
            }
        ]
    return []


def clear_existing_patient_data(patient_id: str) -> None:
    # Child tables first
    for table in [
        "appointments",
        "weekly_health_digests",
        "agent_actions",
        "calendar_events",
        "exercise_logs",
        "meal_logs",
        "medication_dose_logs",
        "glucose_readings",
        "medication_plans",
    ]:
        supabase.table(table).delete().eq("patient_id", patient_id).execute()


def seed_patient(patient: dict[str, Any], clinician_id: str) -> None:
    patient_code = patient["patient_code"]
    user_id = PATIENT_USER_IDS[patient_code]

    upsert_profile(user_id, patient["full_name"], patient["language_preference"])
    patient_id = upsert_patient(patient, clinician_id)
    ensure_assignment(clinician_id, patient_id)

    clear_existing_patient_data(patient_id)

    med_map = insert_medication_plans(patient_id, patient["medications"])

    start = date(2026, 2, 15)
    days = 30

    supabase.table("glucose_readings").insert(
        generate_glucose_rows(patient_code, patient_id, start, days)
    ).execute()

    supabase.table("meal_logs").insert(
        generate_meal_rows(patient_code, patient_id, start, days)
    ).execute()

    supabase.table("exercise_logs").insert(
        generate_exercise_rows(patient_code, patient_id, start, days)
    ).execute()

    cal_rows = generate_calendar_rows(patient_code, patient_id, start, days)
    if cal_rows:
        supabase.table("calendar_events").insert(cal_rows).execute()

    dose_rows = generate_dose_logs(patient_code, patient_id, med_map, start, days)
    if dose_rows:
        supabase.table("medication_dose_logs").insert(dose_rows).execute()

    agent_rows = generate_agent_actions(patient_code, patient_id)
    if agent_rows:
        supabase.table("agent_actions").insert(agent_rows).execute()

    if patient["appointments"]:
        appt_rows = []
        for a in patient["appointments"]:
            appointment_patient_id = a.get("patient_id", patient_id)
            if appointment_patient_id != patient_id:
                raise ValueError(
                    f"Appointment patient_id mismatch for {patient_code}: "
                    f"expected {patient_id}, got {appointment_patient_id}"
                )

            appt_rows.append(
                {
                    "patient_id": appointment_patient_id,
                    "date": a["date"],
                    "time": a["time"],
                    "clinic": a["clinic"],
                    "clinician_name": a["clinician_name"],
                    "type": a["type"],
                    "auto_booked": a["auto_booked"],
                    "booking_reason": a["booking_reason"],
                    "urgency_score": a["urgency_score"],
                    "status": a["status"],
                }
            )
        supabase.table("appointments").insert(appt_rows).execute()

    if patient["weekly_digests"]:
        digest_rows = [
            {
                "patient_id": patient_id,
                "week_start": d["week_start"],
                "week_end": d["week_end"],
                "avg_fasting_glucose": d["avg_fasting_glucose"],
                "avg_post_meal_glucose": d["avg_post_meal_glucose"],
                "medication_adherence_pct": d["medication_adherence_pct"],
                "meals_skipped": d["meals_skipped"],
                "skip_pattern": d["skip_pattern"],
                "avg_steps": d["avg_steps"],
                "step_goal_met_days": d["step_goal_met_days"],
                "sitting_episodes_flagged": d["sitting_episodes_flagged"],
                "agent_actions_taken": d["agent_actions_taken"],
                "agent_actions_silent": d["agent_actions_silent"],
                "worst_day": d["worst_day"],
                "highlights": d["highlights"],
            }
            for d in patient["weekly_digests"]
        ]
        supabase.table("weekly_health_digests").insert(digest_rows).execute()

    print(f"Seeded {patient_code} - {patient['full_name']}")


def main() -> None:
    clinician_id = get_clinician_id()

    for patient in PATIENTS:
        seed_patient(patient, clinician_id)

    print("Done seeding 4 sample patients.")


if __name__ == "__main__":
    main()