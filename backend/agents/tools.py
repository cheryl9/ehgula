from datetime import datetime
from typing import List


# ─────────────────────────────────────────────
# TOOL 1: GLUCOSE MONITOR
# ─────────────────────────────────────────────

def tool_glucose_monitor(patient_data: dict) -> List[str]:
    findings = []
    readings = patient_data.get("glucose_readings", [])

    if not readings:
        findings.append("No glucose readings available today.")
        return findings

    latest = readings[-1]["value"]
    avg    = sum(r["value"] for r in readings) / len(readings)

    if latest > 10.0:
        findings.append(f"HIGH glucose: latest reading is {latest} mmol/L (above 10.0 threshold).")
    elif latest < 4.0:
        findings.append(f"LOW glucose: latest reading is {latest} mmol/L (below 4.0, hypoglycaemia risk).")
    else:
        findings.append(f"Glucose within range: latest {latest} mmol/L.")

    if len(readings) >= 2:
        if readings[-1]["value"] > readings[-2]["value"] + 2:
            findings.append("Glucose is rising sharply between last two readings.")

    findings.append(f"Daily average glucose: {avg:.1f} mmol/L.")
    return findings


# ─────────────────────────────────────────────
# TOOL 2: MEDICATION TRACKER
# ─────────────────────────────────────────────

def tool_medication_tracker(patient_data: dict) -> List[str]:
    findings     = []
    missed       = patient_data.get("missed_medications", [])
    meds         = patient_data.get("medications", [])
    meals_logged = patient_data.get("meals_logged", [])

    if missed:
        for m in missed:
            findings.append(f"MISSED medication: {m}")
    else:
        findings.append("All medications taken on schedule today.")

    if not meals_logged:
        food_meds = [m["name"] for m in meds if m.get("requires_food")]
        if food_meds:
            findings.append(
                f"Food-dependent medications {food_meds} cannot be safely given — no meals logged yet."
            )

    return findings


# ─────────────────────────────────────────────
# TOOL 3: MEAL SKIP DETECTION
# ─────────────────────────────────────────────

def tool_meal_skip_detection(patient_data: dict) -> List[str]:
    findings     = []
    meals_logged = patient_data.get("meals_logged", [])
    glucose      = patient_data.get("glucose_readings", [])
    current_hour = datetime.now().hour
    skip_confidence = 0

    if not meals_logged:
        skip_confidence += 40
        findings.append("No meals logged for today.")

    if current_hour >= 14:
        skip_confidence += 30
        findings.append(f"It is past 2pm ({current_hour}:00) with no meal recorded.")

    if len(glucose) >= 2:
        midday_readings = [
            r for r in glucose
            if 11 <= int(r["time"].split(":")[0]) <= 14
        ]
        if midday_readings:
            midday_avg = sum(r["value"] for r in midday_readings) / len(midday_readings)
            if midday_avg < 5.5:
                skip_confidence += 30
                findings.append(
                    f"Glucose dip at midday (avg {midday_avg:.1f} mmol/L) — possible skipped lunch."
                )

    findings.append(f"Meal skip confidence score: {min(skip_confidence, 100)}%.")

    if skip_confidence >= 60:
        findings.append("LIKELY SKIPPED LUNCH — holding food-dependent medications.")

    return findings


# ─────────────────────────────────────────────
# TOOL 4: APPOINTMENT SCHEDULER
# ─────────────────────────────────────────────

def tool_appointment_scheduler(patient_data: dict, observations: List[str]) -> List[str]:
    findings      = []
    urgency_score = 0

    readings = patient_data.get("glucose_readings", [])
    if readings and readings[-1]["value"] > 10.0:
        urgency_score += 30
        findings.append("Urgency +30: High glucose reading today.")

    missed = patient_data.get("missed_medications", [])
    urgency_score += len(missed) * 15
    if missed:
        findings.append(f"Urgency +{len(missed) * 15}: {len(missed)} missed medication(s).")

    last_visit_str = patient_data.get("last_clinic_visit")
    if last_visit_str:
        last_visit = datetime.strptime(last_visit_str, "%Y-%m-%d")
        days_since = (datetime.now() - last_visit).days
        if days_since > 90:
            urgency_score += 25
            findings.append(f"Urgency +25: Last clinic visit was {days_since} days ago.")
        elif days_since > 60:
            urgency_score += 10
            findings.append(f"Urgency +10: Last clinic visit was {days_since} days ago.")

    if any("rising sharply" in obs for obs in observations):
        urgency_score += 20
        findings.append("Urgency +20: Glucose rising sharply today.")

    findings.append(f"Total urgency score: {urgency_score}/100.")

    available_slots = patient_data.get("calendar", {}).get("available_clinic_slots", [
        {"date": "tomorrow",  "time": "09:00", "clinic": "Bedok Polyclinic"},
        {"date": "tomorrow",  "time": "14:30", "clinic": "Tampines Polyclinic"},
        {"date": "in 2 days", "time": "10:00", "clinic": "Bedok Polyclinic"},
    ])

    if urgency_score >= 60:
        findings.append("BOOK APPOINTMENT: High urgency — scheduling next available slot.")
        if available_slots:
            slot = available_slots[0]
            findings.append(f"Booked: {slot['date']} {slot['time']} at {slot['clinic']}")
    elif urgency_score >= 30:
        findings.append("WATCH: Moderate urgency — recommend booking within the week.")
    else:
        findings.append("No appointment needed right now — continue monitoring.")

    return findings