from datetime import datetime, timedelta
from math import sqrt
import os

from fastapi import APIRouter, HTTPException, Query

from supabase_client import supabase
from agents.memory import load_patient_data
from agents.core import agent
from ml_models.sealion_client import generate_doctor_brief

router = APIRouter(prefix="/clinician", tags=["clinician"])


def _to_number(value, fallback=0.0):
    try:
        parsed = float(value)
        return parsed
    except (TypeError, ValueError):
        return float(fallback)


def _derive_risk_score(adherence, glucose, meals_skipped):
    adherence_penalty = max(0.0, 100.0 - _to_number(adherence, 0.0))
    glucose_penalty = max(0.0, _to_number(glucose, 0.0) - 6.5) * 12.0
    meal_skip_penalty = max(0.0, _to_number(meals_skipped, 0.0)) * 3.0
    score = round(adherence_penalty + glucose_penalty + meal_skip_penalty)
    return max(0, min(100, score))


def _derive_risk_level(score):
    if score >= 85:
        return "CRITICAL"
    if score >= 65:
        return "HIGH"
    if score >= 45:
        return "MEDIUM"
    return "LOW"


def _get_current_clinician_id():
    clinician_user_id = os.getenv("CLINICIAN_USER_ID")
    if not clinician_user_id:
        raise HTTPException(status_code=500, detail="Missing CLINICIAN_USER_ID in backend environment")

    res = (
        supabase.table("clinicians")
        .select("id")
        .eq("user_id", clinician_user_id)
        .limit(1)
        .execute()
    )

    rows = res.data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Clinician not found for CLINICIAN_USER_ID")

    return rows[0]["id"]


def _get_assigned_patient_ids():
    clinician_id = _get_current_clinician_id()
    res = (
        supabase.table("clinician_patient_assignments")
        .select("patient_id")
        .eq("clinician_id", clinician_id)
        .execute()
    )
    return [row["patient_id"] for row in (res.data or [])]


def _get_assigned_patient_ids_safe():
    try:
        return _get_assigned_patient_ids()
    except Exception as exc:
        # Avoid hard-failing analytics endpoints during transient auth/env issues.
        print(f"[clinician] assignment lookup failed, falling back to all patients: {exc}")
        all_rows = supabase.table("patients").select("id").execute().data or []
        return [row.get("id") for row in all_rows if row.get("id")]


def _ensure_patient_assigned(patient_id):
    assigned_ids = set(_get_assigned_patient_ids_safe())
    if assigned_ids and patient_id not in assigned_ids:
        raise HTTPException(status_code=404, detail="Patient not assigned to current clinician")


def _invoke_agent(patient_data):
    return agent.invoke(
        {
            "patient_data": patient_data,
            "observations": [],
            "reasoning": "",
            "alert_level": "normal",
            "actions_taken": [],
            "notifications": [],
            "audit_log": [],
            "pending_booking": None,
            "booking_status": "none",
            "in_app_reminders": [],
        }
    )


@router.get("/patients")
def get_assigned_patients(skip: int = Query(default=0, ge=0), limit: int = Query(default=20, ge=1, le=200)):
    assigned_patient_ids = _get_assigned_patient_ids_safe()
    if not assigned_patient_ids:
        return {"total": 0, "patients": []}

    patients_rows = (
        supabase.table("patients")
        .select("id,user_id,patient_code,name,age,gender,ethnicity,condition,diagnosis_date,emergency_contact")
        .in_("id", assigned_patient_ids)
        .execute()
    ).data or []

    if not patients_rows:
        return {"total": 0, "patients": []}

    # Apply pagination server-side after assignment filtering.
    paged_rows = patients_rows[skip: skip + limit]
    if not paged_rows:
        return {"total": len(patients_rows), "patients": []}

    user_ids = [row.get("user_id") for row in paged_rows if row.get("user_id")]
    patient_ids = [row.get("id") for row in paged_rows if row.get("id")]

    profile_rows = (
        supabase.table("profiles")
        .select("id,full_name,language_preference")
        .in_("id", user_ids)
        .execute()
    ).data or []
    profile_by_user_id = {row.get("id"): row for row in profile_rows}

    glucose_rows = (
        supabase.table("glucose_readings")
        .select("patient_id,value_mmol,timestamp")
        .in_("patient_id", patient_ids)
        .order("timestamp", desc=True)
        .execute()
    ).data or []

    last_glucose_by_patient_id = {}
    for row in glucose_rows:
        pid = row.get("patient_id")
        if pid and pid not in last_glucose_by_patient_id:
            last_glucose_by_patient_id[pid] = row.get("value_mmol")

    appt_rows = (
        supabase.table("appointments")
        .select("patient_id,date,status")
        .in_("patient_id", patient_ids)
        .eq("status", "scheduled")
        .order("date")
        .execute()
    ).data or []

    next_appt_by_patient_id = {}
    for row in appt_rows:
        pid = row.get("patient_id")
        if pid and pid not in next_appt_by_patient_id:
            next_appt_by_patient_id[pid] = row.get("date")

    digest_rows = (
        supabase.table("weekly_health_digests")
        .select("patient_id,medication_adherence_pct,avg_fasting_glucose,meals_skipped,skip_pattern,avg_steps,week_start")
        .in_("patient_id", patient_ids)
        .order("week_start", desc=True)
        .execute()
    ).data or []

    digest_by_patient_id = {}
    for row in digest_rows:
        pid = row.get("patient_id")
        if pid and pid not in digest_by_patient_id:
            digest_by_patient_id[pid] = row

    result_patients = []
    for patient in paged_rows:
        pid = patient.get("id")
        digest = digest_by_patient_id.get(pid) or {}
        adherence = digest.get("medication_adherence_pct") or 0
        risk_level = "low" if adherence >= 80 else "medium" if adherence >= 60 else "high"
        digest_glucose = digest.get("avg_fasting_glucose")

        profile = profile_by_user_id.get(patient.get("user_id")) or {}
        name = patient.get("name") or profile.get("full_name") or patient.get("patient_code")

        result_patients.append(
            {
                "patient_id": pid,
                "patient_code": patient.get("patient_code"),
                "name": name,
                "age": patient.get("age"),
                "gender": patient.get("gender"),
                "ethnicity": patient.get("ethnicity"),
                "condition": patient.get("condition"),
                "diagnosis_date": patient.get("diagnosis_date"),
                "emergency_contact": patient.get("emergency_contact"),
                "language_preference": profile.get("language_preference"),
                "last_glucose": digest_glucose if digest_glucose is not None else last_glucose_by_patient_id.get(pid),
                "adherence_pct": adherence,
                "risk_level": risk_level,
                "meals_skipped": digest.get("meals_skipped"),
                "skip_pattern": digest.get("skip_pattern"),
                "avg_steps": digest.get("avg_steps"),
                "next_appointment_date": next_appt_by_patient_id.get(pid) or "N/A",
            }
        )

    return {
        "total": len(patients_rows),
        "patients": result_patients,
    }


@router.get("/patients/{patient_id}")
def get_patient_detail(patient_id: str):
    _ensure_patient_assigned(patient_id)

    patient_res = (
        supabase.table("patients")
        .select("*")
        .eq("id", patient_id)
        .single()
        .execute()
    )
    patient = patient_res.data
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    profile = (
        supabase.table("profiles")
        .select("full_name,language_preference")
        .eq("id", patient["user_id"])
        .limit(1)
        .execute()
    ).data or []

    return {
        "patient_id": patient["id"],
        "patient_code": patient.get("patient_code"),
        "name": patient.get("name") or (profile[0].get("full_name") if profile else None),
        "age": patient.get("age"),
        "gender": patient.get("gender"),
        "ethnicity": patient.get("ethnicity"),
        "condition": patient.get("condition"),
        "diagnosis_date": patient.get("diagnosis_date"),
        "emergency_contact": patient.get("emergency_contact"),
        "language_preference": (profile[0].get("language_preference") if profile else None),
    }


@router.get("/patients/{patient_id}/glucose")
def get_glucose_trend(patient_id: str, days: int = Query(default=30, ge=1, le=365)):
    _ensure_patient_assigned(patient_id)

    cutoff = (datetime.utcnow() - timedelta(days=days)).isoformat()
    res = (
        supabase.table("glucose_readings")
        .select("timestamp,value_mmol,reading_type")
        .eq("patient_id", patient_id)
        .gte("timestamp", cutoff)
        .order("timestamp")
        .execute()
    )

    readings = [
        {
            "timestamp": row.get("timestamp"),
            "value_mmol": row.get("value_mmol"),
            "type": row.get("reading_type"),
        }
        for row in (res.data or [])
    ]

    values = [
        _to_number(r.get("value_mmol"), 0.0)
        for r in readings
        if r.get("value_mmol") is not None
    ]

    avg = sum(values) / len(values) if values else 0.0
    min_v = min(values) if values else 0.0
    max_v = max(values) if values else 0.0
    std = sqrt(sum((x - avg) ** 2 for x in values) / len(values)) if values else 0.0

    return {
        "patient_id": patient_id,
        "period_days": days,
        "avg_glucose": round(avg, 1),
        "avg_glucose_7day": round(avg, 1),
        "avg_glucose_30day": round(avg, 1),
        "min_glucose": round(min_v, 1),
        "max_glucose": round(max_v, 1),
        "std_dev": round(std, 1),
        "readings_below_3_8": len([v for v in values if v < 3.8]),
        "readings_above_9": len([v for v in values if v > 9.0]),
        "readings": readings,
    }


@router.get("/patients/{patient_id}/medication")
def get_medication_data(patient_id: str, days: int = Query(default=30, ge=1, le=365)):
    _ensure_patient_assigned(patient_id)

    cutoff_date = (datetime.utcnow() - timedelta(days=days)).date().isoformat()

    plans_res = (
        supabase.table("medication_plans")
        .select("id,name,dose,frequency")
        .eq("patient_id", patient_id)
        .execute()
    )
    plans = plans_res.data or []

    logs_res = (
        supabase.table("medication_dose_logs")
        .select("id,medication_plan_id,dose_date,scheduled_time,actual_time,status,held_reason,rescheduled_to,agent_action")
        .eq("patient_id", patient_id)
        .gte("dose_date", cutoff_date)
        .order("dose_date", desc=True)
        .execute()
    )
    logs = logs_res.data or []

    digest_res = (
        supabase.table("weekly_health_digests")
        .select("medication_adherence_pct,week_start")
        .eq("patient_id", patient_id)
        .order("week_start", desc=True)
        .limit(1)
        .execute()
    )
    latest_digest = (digest_res.data or [None])[0]

    logs_by_plan = {plan["id"]: [] for plan in plans}
    for row in logs:
        logs_by_plan.setdefault(row.get("medication_plan_id"), []).append(row)

    medications = []
    for plan in plans:
        med_logs = logs_by_plan.get(plan["id"], [])
        total_doses = len(med_logs)
        doses_taken = len([l for l in med_logs if l.get("status") == "taken"])
        doses_missed = len([l for l in med_logs if l.get("status") == "missed"])
        doses_held_by_agent = len([l for l in med_logs if l.get("agent_action") or l.get("held_reason")])

        halfway = max(1, len(med_logs) // 2)
        recent = med_logs[:halfway]
        previous = med_logs[halfway:]

        recent_pct = (len([l for l in recent if l.get("status") == "taken"]) / len(recent)) if recent else None
        previous_pct = (len([l for l in previous if l.get("status") == "taken"]) / len(previous)) if previous else None

        trend = "stable"
        if recent_pct is not None and previous_pct is not None:
            if (recent_pct - previous_pct) > 0.1:
                trend = "up"
            elif (previous_pct - recent_pct) > 0.1:
                trend = "down"

        last_taken_row = next((l for l in med_logs if l.get("status") == "taken"), None)
        if last_taken_row:
            last_taken = f"{last_taken_row.get('dose_date')} {last_taken_row.get('actual_time') or last_taken_row.get('scheduled_time') or ''}".strip()
        else:
            last_taken = "N/A"

        adherence_pct = round((doses_taken / total_doses) * 100) if total_doses else 0

        medications.append(
            {
                "medication_id": plan.get("id"),
                "name": plan.get("name"),
                "dose": plan.get("dose"),
                "frequency": plan.get("frequency"),
                "adherence_pct": adherence_pct,
                "trend": trend,
                "total_doses": total_doses,
                "doses_taken": doses_taken,
                "doses_missed": doses_missed,
                "doses_held_by_agent": doses_held_by_agent,
                "last_taken": last_taken,
                "next_due": "N/A",
            }
        )

    overall_from_meds = round(sum(m["adherence_pct"] for m in medications) / len(medications)) if medications else 0

    dose_logs = []
    name_by_plan_id = {p["id"]: p for p in plans}
    for log in logs:
        plan = name_by_plan_id.get(log.get("medication_plan_id"), {})
        dose_logs.append(
            {
                "id": log.get("id"),
                "timestamp": f"{log.get('dose_date')}T{log.get('actual_time') or log.get('scheduled_time') or '00:00'}",
                "medication_name": plan.get("name", "Unknown"),
                "dose": plan.get("dose", "N/A"),
                "status": log.get("status"),
                "notes": log.get("held_reason") or (f"Rescheduled to {log.get('rescheduled_to')}" if log.get("rescheduled_to") else ""),
            }
        )

    overall_adherence = latest_digest.get("medication_adherence_pct") if latest_digest else None

    return {
        "patient_id": patient_id,
        "period_days": days,
        "overall_adherence_pct": float(overall_adherence) if overall_adherence is not None else overall_from_meds,
        "medications": medications,
        "dose_logs": dose_logs,
    }


@router.get("/patients/{patient_id}/meals")
def get_meal_data(patient_id: str, days: int = Query(default=30, ge=1, le=365)):
    _ensure_patient_assigned(patient_id)

    cutoff_date = (datetime.utcnow() - timedelta(days=days)).date().isoformat()
    res = (
        supabase.table("meal_logs")
        .select("id,date,meal_type,time,logged,skipped,skip_reason,description")
        .eq("patient_id", patient_id)
        .gte("date", cutoff_date)
        .order("date", desc=True)
        .execute()
    )

    rows = res.data or []

    return {
        "patient_id": patient_id,
        "period_days": days,
        "rows": rows,
    }


@router.get("/patients/{patient_id}/exercise")
def get_exercise_data(patient_id: str, days: int = Query(default=30, ge=1, le=365)):
    _ensure_patient_assigned(patient_id)

    cutoff_date = (datetime.utcnow() - timedelta(days=days)).date().isoformat()
    res = (
        supabase.table("exercise_logs")
        .select("id,date,steps,step_goal,sitting_episodes,heart_rate")
        .eq("patient_id", patient_id)
        .gte("date", cutoff_date)
        .order("date")
        .execute()
    )

    rows = res.data or []
    latest7 = rows[-7:]

    steps = []
    for row in latest7:
        step_goal = int(row.get("step_goal") or 10000)
        step_val = int(row.get("steps") or 0)
        achievement = round((step_val / max(1, step_goal)) * 100)
        steps.append(
            {
                "date": row.get("date"),
                "steps": step_val,
                "goal": step_goal,
                "achievement": achievement,
            }
        )

    sitting = []
    for idx, row in enumerate(latest7):
        episodes = row.get("sitting_episodes") or []
        for ep_idx, episode in enumerate(episodes):
            duration = int(_to_number(episode.get("duration_mins") or episode.get("duration"), 0))
            sitting.append(
                {
                    "id": f"{row.get('id') or idx}-{ep_idx}",
                    "startTime": episode.get("start") or "N/A",
                    "endTime": episode.get("end") or "N/A",
                    "duration": duration,
                    "location": episode.get("location") or "Daily routine",
                    "exceedsLimit": bool(episode.get("flagged")) or duration > 60,
                    "date": row.get("date"),
                }
            )

    heart_rate = []
    for row in latest7:
        for item in (row.get("heart_rate") or []):
            bpm = int(_to_number(item.get("bpm") or item.get("hr"), 0))
            if bpm <= 0:
                continue

            zone = item.get("zone")
            if not zone:
                if bpm <= 60:
                    zone = "Resting"
                elif bpm <= 100:
                    zone = "Light"
                elif bpm <= 140:
                    zone = "Moderate"
                elif bpm <= 170:
                    zone = "Vigorous"
                else:
                    zone = "Maximum"

            heart_rate.append(
                {
                    "time": item.get("time") or row.get("date"),
                    "hr": bpm,
                    "zone": zone,
                    "date": row.get("date"),
                }
            )

    return {
        "patient_id": patient_id,
        "period_days": days,
        "steps": steps,
        "sitting": sitting,
        "heartRate": heart_rate,
    }


@router.get("/patients/{patient_id}/appointments")
def get_patient_appointments(patient_id: str, status: str = Query(default="all")):
    _ensure_patient_assigned(patient_id)

    query = (
        supabase.table("appointments")
        .select("id,patient_id,date,time,clinic,clinician_name,type,auto_booked,booking_reason,urgency_score,status")
        .eq("patient_id", patient_id)
        .order("date")
    )

    if status != "all":
        query = query.eq("status", status)

    res = query.execute()
    return res.data or []


@router.get("/appointments")
def get_all_appointments(status: str = Query(default="all")):
    assigned_patient_ids = _get_assigned_patient_ids()
    if not assigned_patient_ids:
        return []

    query = (
        supabase.table("appointments")
        .select("id,patient_id,date,time,clinic,clinician_name,type,auto_booked,booking_reason,urgency_score,status")
        .in_("patient_id", assigned_patient_ids)
        .order("date")
    )

    if status != "all":
        query = query.eq("status", status)

    res = query.execute()
    return res.data or []


@router.get("/patients/{patient_id}/weekly-digests")
def get_weekly_digests_by_patient(patient_id: str):
    _ensure_patient_assigned(patient_id)

    res = (
        supabase.table("weekly_health_digests")
        .select("*")
        .eq("patient_id", patient_id)
        .order("week_start", desc=True)
        .execute()
    )
    return {"digests": res.data or []}


@router.get("/weekly-digests")
def get_all_weekly_digests():
    assigned_patient_ids = _get_assigned_patient_ids()
    if not assigned_patient_ids:
        return {"digests": []}

    res = (
        supabase.table("weekly_health_digests")
        .select("*")
        .in_("patient_id", assigned_patient_ids)
        .order("week_start", desc=True)
        .execute()
    )
    return {"digests": res.data or []}


@router.get("/analytics/at-risk")
def get_at_risk_patients():
    try:
        assigned_patient_ids = _get_assigned_patient_ids_safe()
        if not assigned_patient_ids:
            return []

        digest_rows = (
            supabase.table("weekly_health_digests")
            .select("*")
            .in_("patient_id", assigned_patient_ids)
            .order("week_start", desc=True)
            .execute()
        ).data or []

        patient_rows = (
            supabase.table("patients")
            .select("id,name,condition")
            .in_("id", assigned_patient_ids)
            .execute()
        ).data or []
        patient_by_id = {row["id"]: row for row in patient_rows}

        latest_by_patient = []
        seen = set()
        for row in digest_rows:
            pid = row.get("patient_id")
            if pid in seen:
                continue
            seen.add(pid)
            latest_by_patient.append(row)

        action_rows = (
            supabase.table("agent_actions")
            .select("patient_id,detail,timestamp")
            .in_("patient_id", [row.get("patient_id") for row in latest_by_patient])
            .order("timestamp", desc=True)
            .execute()
        ).data or []

        latest_action_by_patient = {}
        for row in action_rows:
            pid = row.get("patient_id")
            if pid not in latest_action_by_patient:
                latest_action_by_patient[pid] = row.get("detail")

        mapped = []
        for row in latest_by_patient:
            pid = row.get("patient_id")
            patient = patient_by_id.get(pid, {})

            adherence = _to_number(row.get("medication_adherence_pct"), 0.0)
            glucose = _to_number(row.get("avg_fasting_glucose"), 0.0)
            meals_skipped = _to_number(row.get("meals_skipped"), 0.0)
            concern = ((row.get("highlights") or {}).get("concern") or "").strip()

            risk_score = _derive_risk_score(adherence, glucose, meals_skipped)
            risk_level = _derive_risk_level(risk_score)
            primary_concern = concern or "Needs review"
            alerts = [primary_concern] if (concern and concern.lower() != "no major concerns") else []

            mapped.append(
                {
                    "id": row.get("id"),
                    "patientId": pid,
                    "patientName": patient.get("name"),
                    "patientCondition": patient.get("condition"),
                    "weekStart": row.get("week_start"),
                    "weekEnd": row.get("week_end"),
                    "avgFastingGlucose": row.get("avg_fasting_glucose"),
                    "avgPostMealGlucose": row.get("avg_post_meal_glucose"),
                    "medicationAdherencePct": row.get("medication_adherence_pct"),
                    "mealsSkipped": row.get("meals_skipped"),
                    "skipPattern": row.get("skip_pattern"),
                    "avgSteps": row.get("avg_steps"),
                    "stepGoalMetDays": row.get("step_goal_met_days"),
                    "sittingEpisodesFlagged": row.get("sitting_episodes_flagged"),
                    "agentActionsTaken": row.get("agent_actions_taken"),
                    "agentActionsSilent": row.get("agent_actions_silent"),
                    "worstDay": row.get("worst_day"),
                    "highlights": row.get("highlights"),
                    "createdAt": row.get("created_at"),
                    "name": patient.get("name") or "Unknown Patient",
                    "riskScore": risk_score,
                    "riskLevel": risk_level,
                    "primaryConcern": primary_concern,
                    "adherence": adherence,
                    "glucose": glucose,
                    "mealsSkipped": meals_skipped,
                    "alerts": alerts,
                    "action": latest_action_by_patient.get(pid),
                }
            )

        mapped.sort(key=lambda item: item.get("riskScore", 0), reverse=True)
        for idx, row in enumerate(mapped):
            row["rank"] = idx + 1

        return mapped
    except Exception as exc:
        print(f"[clinician] get_at_risk_patients failed: {exc}")
        return []


@router.get("/analytics/cohort-overview")
def get_cohort_overview():
    try:
        assigned_patient_ids = _get_assigned_patient_ids_safe()
        if not assigned_patient_ids:
            return {"totalPatients": 0, "avgAdherence": 0, "avgGlucose": 0}

        rows = (
            supabase.table("weekly_health_digests")
            .select("patient_id,medication_adherence_pct,avg_fasting_glucose")
            .in_("patient_id", assigned_patient_ids)
            .execute()
        ).data or []

        if not rows:
            return {"totalPatients": 0, "avgAdherence": 0, "avgGlucose": 0}

        total_patients = len(set(row.get("patient_id") for row in rows if row.get("patient_id")))
        avg_adherence = sum(_to_number(row.get("medication_adherence_pct"), 0) for row in rows) / len(rows)
        avg_glucose = sum(_to_number(row.get("avg_fasting_glucose"), 0) for row in rows) / len(rows)

        return {
            "totalPatients": total_patients,
            "avgAdherence": round(avg_adherence, 1),
            "avgGlucose": round(avg_glucose, 1),
        }
    except Exception as exc:
        print(f"[clinician] get_cohort_overview failed: {exc}")
        return {"totalPatients": 0, "avgAdherence": 0, "avgGlucose": 0}


@router.get("/analytics/trends")
def get_trends():
    try:
        assigned_patient_ids = _get_assigned_patient_ids_safe()
        if not assigned_patient_ids:
            return {"trends": []}

        rows = (
            supabase.table("weekly_health_digests")
            .select("*")
            .in_("patient_id", assigned_patient_ids)
            .order("week_start")
            .execute()
        ).data or []

        return {"trends": rows}
    except Exception as exc:
        print(f"[clinician] get_trends failed: {exc}")
        return {"trends": []}


@router.get("/analytics")
def get_analytics(days: int = Query(default=30, ge=1, le=365)):
    # Keep a combined endpoint for clients that expect /clinician/analytics.
    del days
    return {
        "cohortOverview": get_cohort_overview(),
        "atRiskPatients": get_at_risk_patients(),
        "trends": get_trends().get("trends", []),
    }


@router.patch("/patients/{patient_id}/appointments/{appointment_id}")
def update_appointment(patient_id: str, appointment_id: str, payload: dict):
    _ensure_patient_assigned(patient_id)

    action = payload.get("action")
    if action != "reschedule":
        raise HTTPException(status_code=400, detail="Only reschedule action is supported")

    new_date = payload.get("new_date")
    new_time = payload.get("new_time")
    reason = payload.get("reason")

    if not new_date or not new_time:
        raise HTTPException(status_code=400, detail="new_date and new_time are required")

    update_res = (
        supabase.table("appointments")
        .update(
            {
                "date": new_date,
                "time": new_time,
                "status": "scheduled",
                "booking_reason": reason,
            }
        )
        .eq("id", appointment_id)
        .eq("patient_id", patient_id)
        .execute()
    )

    return {
        "status": "rescheduled",
        "appointment": (update_res.data or [None])[0],
    }


@router.delete("/patients/{patient_id}/appointments/{appointment_id}")
def cancel_appointment(patient_id: str, appointment_id: str, payload: dict | None = None):
    _ensure_patient_assigned(patient_id)

    reason = (payload or {}).get("reason")

    update_res = (
        supabase.table("appointments")
        .update(
            {
                "status": "cancelled",
                "booking_reason": reason,
            }
        )
        .eq("id", appointment_id)
        .eq("patient_id", patient_id)
        .execute()
    )

    return {
        "status": "cancelled",
        "appointment": (update_res.data or [None])[0],
    }


@router.get("/patients/{patient_id}/brief")
def get_patient_brief(patient_id: str):
    _ensure_patient_assigned(patient_id)

    patient_data = load_patient_data(patient_id=patient_id)

    try:
        agent_result = _invoke_agent(patient_data)
        brief = generate_doctor_brief(patient_data, agent_result)
        alert_level = agent_result.get("alert_level")
    except Exception as exc:
        # Keep patient profile pages usable even if LLM/agent dependencies fail.
        print(f"[clinician] brief generation fallback for patient {patient_id}: {exc}")
        name = patient_data.get("name") or "Patient"
        condition = patient_data.get("condition") or "condition under review"
        brief = (
            f"{name} is being monitored for {condition}. "
            "Automated brief generation is temporarily unavailable; please review recent glucose, medication, and meal logs directly."
        )
        alert_level = "normal"

    return {
        "brief": brief,
        "alert_level": alert_level,
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }
