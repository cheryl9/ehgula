from datetime import datetime, timedelta
from typing import List, Tuple


# ─────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────

def parse_time(time_str: str) -> datetime:
    """Converts HH:MM string to today's datetime for comparison."""
    now = datetime.now()
    t   = datetime.strptime(time_str, "%H:%M")
    return now.replace(hour=t.hour, minute=t.minute, second=0, microsecond=0)


def is_currently_in_meeting(meetings: list) -> Tuple[bool, dict | None]:
    """Returns True and the meeting dict if patient is in a meeting right now."""
    now = datetime.now()
    for meeting in meetings:
        start = parse_time(meeting["start"])
        end   = parse_time(meeting["end"])
        if start <= now <= end:
            return True, meeting
    return False, None


def next_meeting_end(meetings: list) -> str | None:
    """Returns HH:MM of when the current meeting ends, or None."""
    in_meeting, meeting = is_currently_in_meeting(meetings)
    if in_meeting and meeting:
        end_dt = parse_time(meeting["end"])
        # Add 10 min buffer after meeting ends
        remind_at = end_dt + timedelta(minutes=10)
        return remind_at.strftime("%H:%M")
    return None


def get_dose_status(dose_logs: list, med_name: str, scheduled_time: str) -> str | None:
    """
    Looks up today's dose log for a specific medication and scheduled time.
    dose_logs rows have: scheduled_time (time), status, medication_plans (joined name)
    Returns status string or None if no log entry exists yet.
    """
    for log in dose_logs:
        # medication name comes from joined medication_plans
        log_med_name = ""
        if log.get("medication_plans"):
            log_med_name = log["medication_plans"].get("name", "")
        
        log_scheduled = str(log.get("scheduled_time", ""))[:5]  # HH:MM
        check_time    = str(scheduled_time)[:5]

        if log_med_name.lower() == med_name.lower() and log_scheduled == check_time:
            return log.get("status")
    return None


def build_in_app_reminder(med_name: str, dosage: str, message: str,
                           reminder_type: str, rescheduled_to: str = None) -> dict:
    """
    Builds a structured in-app reminder object for the frontend to display.
    reminder_type: "reminder_1" | "reminder_2" | "held" | "delayed" | "missed"
    """
    return {
        "type":           "medication_reminder",
        "reminder_type":  reminder_type,
        "medication":     med_name,
        "dosage":         dosage,
        "message":        message,
        "timestamp":      datetime.now().isoformat(),
        "rescheduled_to": rescheduled_to,
        "requires_action": reminder_type in ["reminder_1", "reminder_2"],
        "action_options":  ["taken", "skip"] if reminder_type in ["reminder_1", "reminder_2"] else []
    }


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
# Full logic: time-aware, meeting-aware,
# food-aware, two-reminder, in-app reminders
# ─────────────────────────────────────────────

def tool_medication_tracker(patient_data: dict) -> Tuple[List[str], List[dict]]:
    """
    Returns:
        findings    — list of strings for the agent's observe node
        in_app_reminders — list of structured reminder objects for the frontend
    """
    findings         = []
    in_app_reminders = []
    now              = datetime.now()
    current_time_str = now.strftime("%H:%M")

    meds         = patient_data.get("medications", [])
    meals_logged = patient_data.get("meals_logged", [])
    dose_logs    = patient_data.get("dose_logs", [])
    meetings     = patient_data.get("calendar", {}).get("today_meetings", [])

    in_meeting, current_meeting = is_currently_in_meeting(meetings)
    meeting_end_time            = next_meeting_end(meetings) if in_meeting else None

    for med in meds:
        med_name      = med["name"]
        dosage        = med.get("dosage", "")
        requires_food = med.get("requires_food", False)
        pre_meal_mins = med.get("take_before_meal_mins")
        scheduled_times = med.get("scheduled_times", [])

        for scheduled_time in scheduled_times:
            scheduled_dt = parse_time(scheduled_time)

            # Only process if scheduled time has passed
            if now < scheduled_dt:
                continue

            # Check current dose status from dose_logs
            status = get_dose_status(dose_logs, med_name, scheduled_time)

            # Already taken — nothing to do
            if status == "taken":
                findings.append(f"{med_name} {scheduled_time} — already taken.")
                continue

            # Already missed — already logged
            if status == "missed":
                findings.append(f"MISSED medication: {med_name} {scheduled_time}.")
                continue

            # ── Check if patient is in a meeting right now ──────────
            if in_meeting:
                remind_after = meeting_end_time or (
                    parse_time(current_meeting["end"]) + timedelta(minutes=10)
                ).strftime("%H:%M")

                findings.append(
                    f"{med_name} {scheduled_time} delayed — patient in meeting until "
                    f"{current_meeting['end']}. Will remind at {remind_after}."
                )

                # Silent in-app reminder scheduled for after meeting
                in_app_reminders.append(build_in_app_reminder(
                    med_name      = med_name,
                    dosage        = dosage,
                    message       = (
                        f"Your {med_name} reminder was delayed while you were in your meeting. "
                        f"Time to take your {med_name} {dosage}!"
                    ),
                    reminder_type = "delayed",
                    rescheduled_to = remind_after
                ))
                continue

            # ── Check food requirement ───────────────────────────────
            if requires_food and not meals_logged:
                findings.append(
                    f"{med_name} {scheduled_time} HELD — requires food but no meal logged yet."
                )

                in_app_reminders.append(build_in_app_reminder(
                    med_name      = med_name,
                    dosage        = dosage,
                    message       = (
                        f"Time for your {med_name} {dosage}, but I noticed you haven't eaten yet! "
                        f"Please have a meal first — taking {med_name} on an empty stomach "
                        f"can cause nausea. I'll remind you again after you eat okay?"
                    ),
                    reminder_type = "held"
                ))
                continue

            # ── Pre-meal medication (e.g. Glipizide) ────────────────
            if pre_meal_mins and meals_logged:
                next_meal_time = meals_logged[0].get("time") if meals_logged else None
                if next_meal_time:
                    next_meal_dt   = parse_time(next_meal_time)
                    remind_at_dt   = next_meal_dt - timedelta(minutes=pre_meal_mins)
                    remind_at      = remind_at_dt.strftime("%H:%M")

                    if now < remind_at_dt:
                        findings.append(
                            f"{med_name} {scheduled_time} — remind at {remind_at} "
                            f"({pre_meal_mins} mins before meal)."
                        )
                        in_app_reminders.append(build_in_app_reminder(
                            med_name      = med_name,
                            dosage        = dosage,
                            message       = (
                                f"Take your {med_name} {dosage} now — your meal is in "
                                f"{pre_meal_mins} minutes!"
                            ),
                            reminder_type  = "reminder_1",
                            rescheduled_to = remind_at
                        ))
                        continue

            # ── Two-reminder logic ───────────────────────────────────
            minutes_overdue = (now - scheduled_dt).total_seconds() / 60

            if status is None and minutes_overdue < 30:
                # Reminder 1 — scheduled time just passed
                findings.append(
                    f"{med_name} {scheduled_time} — Reminder 1 sent."
                )

                food_note = " Take it with food!" if requires_food else " You can take this without food."
                in_app_reminders.append(build_in_app_reminder(
                    med_name      = med_name,
                    dosage        = dosage,
                    message       = (
                        f"Time to take your {med_name} {dosage}!{food_note}"
                    ),
                    reminder_type = "reminder_1"
                ))

            elif status == "reminder_1_sent" and 30 <= minutes_overdue < 60:
                # Reminder 2 — no response after 30 mins
                findings.append(
                    f"{med_name} {scheduled_time} — no response to Reminder 1. Reminder 2 sent."
                )

                in_app_reminders.append(build_in_app_reminder(
                    med_name      = med_name,
                    dosage        = dosage,
                    message       = (
                        f"Mr. Tan, just checking — did you take your {med_name} {dosage}? "
                        f"Please tap 'taken' or 'skip' to let me know!"
                    ),
                    reminder_type = "reminder_2"
                ))

            elif status in [None, "reminder_1_sent", "reminder_2_sent"] and minutes_overdue >= 60:
                # Auto-missed — no response after both reminders
                findings.append(
                    f"MISSED medication: {med_name} {scheduled_time} — "
                    f"no response after {int(minutes_overdue)} minutes. Auto-logged as missed."
                )

                in_app_reminders.append(build_in_app_reminder(
                    med_name      = med_name,
                    dosage        = dosage,
                    message       = (
                        f"Looks like {med_name} at {scheduled_time} was missed today. "
                        f"I've noted this for your doctor. Try not to miss it next time okay!"
                    ),
                    reminder_type = "missed"
                ))

    if not findings:
        findings.append("All medications on schedule — no action needed right now.")

    return findings, in_app_reminders


# ─────────────────────────────────────────────
# TOOL 3: MEAL SKIP DETECTION
# Reads directly from patient meal logs
# logged via the frontend app
# ─────────────────────────────────────────────

def tool_meal_skip_detection(patient_data: dict) -> Tuple[List[str], List[dict]]:
    """
    Detects whether the patient has skipped a meal.
    Reads meal_logs written by the frontend app via /meals/log.

    Returns:
        findings         — strings for the agent observations
        in_app_reminders — structured reminder objects for the frontend
    """
    findings         = []
    in_app_reminders = []
    meals_logged     = patient_data.get("meals_logged", [])
    glucose          = patient_data.get("glucose_readings", [])
    calendar         = patient_data.get("calendar", {})
    today_meetings   = calendar.get("today_meetings", [])
    now              = datetime.now()
    current_hour     = now.hour
    skip_confidence  = 0

    # ── Step 1: Check what meal types have been logged today ──
    logged_types  = {m.get("meal_type") for m in meals_logged if not m.get("skipped", False)}
    skipped_types = {m.get("meal_type") for m in meals_logged if m.get("skipped", False)}

    # ── Step 2: Breakfast check (before 11am) ─────────────────
    if current_hour >= 9 and "breakfast" not in logged_types:
        if "breakfast" not in skipped_types:
            skip_confidence += 20
            findings.append("Breakfast not logged by 9am.")

    # ── Step 3: Lunch check (after 2pm) ───────────────────────
    if current_hour >= 14 and "lunch" not in logged_types:
        if "lunch" in skipped_types:
            # Patient explicitly marked lunch as skipped
            skip_reason = next(
                (m.get("skip_reason") for m in meals_logged
                 if m.get("meal_type") == "lunch" and m.get("skipped")),
                "not specified"
            )
            skip_confidence += 50
            findings.append(f"Lunch explicitly skipped by patient. Reason: {skip_reason}.")
        else:
            # Lunch not logged and not explicitly skipped
            skip_confidence += 40
            findings.append(f"Lunch not logged — it is past 2pm ({current_hour}:00).")

    # ── Step 4: Check if calendar blocked lunchtime ───────────
    lunch_blocked = calendar.get("lunch_blocked", False)
    if not lunch_blocked:
        # Infer from meetings — check if 12:00-14:00 is covered by meetings
        lunch_meetings = [
            m for m in today_meetings
            if parse_time(m["start"]) <= parse_time("13:00") <= parse_time(m["end"])
        ]
        if lunch_meetings:
            lunch_blocked = True

    if lunch_blocked and "lunch" not in logged_types:
        skip_confidence += 20
        findings.append("Calendar shows lunchtime was blocked by meetings.")

    # ── Step 5: Glucose dip at midday ─────────────────────────
    if len(glucose) >= 2:
        midday_readings = [
            r for r in glucose
            if 11 <= int(r["time"].split(":")[0]) <= 14
        ]
        if midday_readings:
            midday_avg = sum(r["value"] for r in midday_readings) / len(midday_readings)
            if midday_avg < 5.5:
                skip_confidence += 20
                findings.append(
                    f"Glucose dip at midday (avg {midday_avg:.1f} mmol/L) — supports lunch skip."
                )

    # ── Step 6: Score and decide ──────────────────────────────
    score = min(skip_confidence, 100)
    findings.append(f"Meal skip confidence score: {score}%.")

    if score >= 60:
        findings.append("LIKELY SKIPPED LUNCH — holding food-dependent medications.")

        # In-app reminder to eat
        in_app_reminders.append({
            "type":            "meal_reminder",
            "reminder_type":   "lunch_skip",
            "message":         (
                "Mr. Tan, looks like you haven't had lunch yet! "
                "Please eat something before taking your medication. "
                "There are hawker centres nearby — Bedok Interchange or Old Airport Road!"
            ),
            "timestamp":       now.isoformat(),
            "requires_action":  True,
            "action_options":   ["logged_meal", "skip_meal"]
        })

    elif score >= 30:
        findings.append("Possible meal skip — monitoring.")

        in_app_reminders.append({
            "type":            "meal_reminder",
            "reminder_type":   "lunch_check",
            "message":         "Mr. Tan, have you had lunch today? Tap to log your meal!",
            "timestamp":       now.isoformat(),
            "requires_action":  True,
            "action_options":   ["logged_meal", "skip_meal"]
        })

    return findings, in_app_reminders


# ─────────────────────────────────────────────
# TOOL 4: EXERCISE MONITOR
# Monitors steps, sitting hours, and activity
# Cross-references with glucose for clinical
# connections
# ─────────────────────────────────────────────

def tool_exercise_monitor(patient_data: dict) -> Tuple[List[str], List[dict]]:
    """
    Monitors physical activity and generates findings + in-app reminders.
    Makes clinical connections between low activity and high glucose.

    Returns:
        findings         — strings for agent observations
        in_app_reminders — structured reminder objects for the frontend
    """
    findings         = []
    in_app_reminders = []
    now              = datetime.now()
    wearable         = patient_data.get("wearable", {})

    steps_today      = wearable.get("steps_today", 0)
    steps_goal       = wearable.get("steps_goal", 8000)
    active_minutes   = wearable.get("active_minutes", 0)
    sitting_hours    = wearable.get("sitting_hours", 0)
    sitting_episodes = wearable.get("sitting_episodes", [])
    heart_rate       = wearable.get("heart_rate", [])

    # Latest glucose reading for cross-referencing
    glucose_readings = patient_data.get("glucose_readings", [])
    latest_glucose   = glucose_readings[-1]["value"] if glucose_readings else None
    glucose_high     = latest_glucose and latest_glucose > 10.0

    steps_remaining  = max(steps_goal - steps_today, 0)
    steps_pct        = round((steps_today / steps_goal) * 100) if steps_goal else 0

    # ── Step count analysis ───────────────────────────────────
    findings.append(f"Steps today: {steps_today} / {steps_goal} ({steps_pct}% of goal).")

    if steps_today >= steps_goal:
        findings.append("Daily step goal met — great activity today!")
        in_app_reminders.append({
            "type":            "exercise_update",
            "reminder_type":   "goal_met",
            "message":         (
                f"Well done Mr. Tan! You've hit your {steps_goal:,} step goal today. "
                f"Keep it up — your sugar levels will thank you!"
            ),
            "timestamp":       now.isoformat(),
            "requires_action": False,
            "action_options":  []
        })

    elif steps_today < 3000:
        findings.append(f"LOW activity: only {steps_today} steps — significantly below goal.")

        # Level 3 — strongest message: low steps + high glucose
        if glucose_high:
            findings.append(
                f"CLINICAL CONNECTION: Low activity ({steps_today} steps) + "
                f"high glucose ({latest_glucose} mmol/L) — walk recommended to lower glucose naturally."
            )
            in_app_reminders.append({
                "type":            "exercise_nudge",
                "reminder_type":   "glucose_walk",
                "message":         (
                    f"Mr. Tan, your blood sugar is {latest_glucose} mmol/L and you've only walked "
                    f"{steps_today} steps today. A 15-minute walk right now can help bring "
                    f"your sugar down naturally — even a slow stroll helps!"
                ),
                "timestamp":       now.isoformat(),
                "requires_action": False,
                "action_options":  []
            })
        else:
            in_app_reminders.append({
                "type":            "exercise_nudge",
                "reminder_type":   "low_steps",
                "message":         (
                    f"Mr. Tan, only {steps_today} steps so far today! "
                    f"You're {steps_remaining:,} steps away from your daily goal. "
                    f"Even a short walk after your next meal makes a big difference!"
                ),
                "timestamp":       now.isoformat(),
                "requires_action": False,
                "action_options":  []
            })

    elif steps_remaining > 0:
        findings.append(f"Steps remaining to hit daily goal: {steps_remaining}.")
        in_app_reminders.append({
            "type":            "exercise_update",
            "reminder_type":   "steps_remaining",
            "message":         (
                f"Good progress Mr. Tan! {steps_today} steps done, "
                f"just {steps_remaining:,} more to hit your goal. "
                f"A walk after dinner will get you there!"
            ),
            "timestamp":       now.isoformat(),
            "requires_action": False,
            "action_options":  []
        })

    # ── Sitting episode analysis ──────────────────────────────
    if sitting_hours >= 3:
        # Find the longest sitting episode
        longest = max(
            sitting_episodes,
            key=lambda e: e.get("duration_mins", 0),
            default=None
        )

        findings.append(
            f"PROLONGED SITTING: {sitting_hours} hours today. "
            f"Threshold of 3 hours exceeded."
        )

        if longest:
            findings.append(
                f"Longest sitting episode: {longest.get('duration_mins')} mins "
                f"({longest.get('start')} — {longest.get('end')})."
            )

        # Combined with high glucose
        if glucose_high:
            findings.append(
                f"CLINICAL CONNECTION: Prolonged sitting ({sitting_hours}h) + "
                f"high glucose ({latest_glucose} mmol/L) — movement strongly recommended."
            )
            in_app_reminders.append({
                "type":            "exercise_nudge",
                "reminder_type":   "sitting_glucose",
                "message":         (
                    f"Mr. Tan, you've been sitting for {sitting_hours} hours "
                    f"and your sugar is {latest_glucose} mmol/L. "
                    f"Please stand up and walk around for 10 minutes — "
                    f"it will help your body process the sugar!"
                ),
                "timestamp":       now.isoformat(),
                "requires_action": False,
                "action_options":  []
            })
        else:
            in_app_reminders.append({
                "type":            "exercise_nudge",
                "reminder_type":   "prolonged_sitting",
                "message":         (
                    f"Mr. Tan, you've been sitting for {sitting_hours} hours straight! "
                    f"Time to get up and move around — even a short walk helps your health."
                ),
                "timestamp":       now.isoformat(),
                "requires_action": False,
                "action_options":  []
            })

    # ── Heart rate summary ────────────────────────────────────
    if heart_rate:
        resting_readings = [r["bpm"] for r in heart_rate if r.get("zone") == "resting"]
        if resting_readings:
            avg_resting = round(sum(resting_readings) / len(resting_readings))
            findings.append(f"Average resting heart rate: {avg_resting} bpm.")
            if avg_resting > 100:
                findings.append(f"ELEVATED resting heart rate: {avg_resting} bpm — flag for doctor.")

    # ── Active minutes ────────────────────────────────────────
    if active_minutes > 0:
        findings.append(f"Active minutes today: {active_minutes} mins.")
    else:
        findings.append("No active minutes recorded today.")

    return findings, in_app_reminders