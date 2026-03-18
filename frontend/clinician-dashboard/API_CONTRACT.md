# API Contract: Clinician Portal Endpoints

**Status:** Awaiting confirmation from Xavier (Backend Lead)  
**Last Updated:** March 18, 2026  
**Target Response:** Required by end of Week 1

---

## Overview

This document specifies all API endpoints needed by the Clinician Portal (React frontend). The backend team (Xavier) will implement these endpoints with the following response shapes.

**Base URL:** `http://localhost:8000/api` (dev) or production URL

---

## Authentication

All endpoints require a JWT token in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

---

## Clinician Endpoints

### 1. Get All Assigned Patients

**Endpoint:** `GET /api/clinician/patients`

**Query Parameters:**

- `skip` (int): Pagination offset (default: 0)
- `limit` (int): Number of results (default: 20)
- `search` (str): Filter by patient name
- `sort_by` (str): 'name', 'risk_level', 'last_visit' (default: 'risk_level')

**Response (200 OK):**

```json
{
  "total": 4,
  "patients": [
    {
      "patient_id": "P001",
      "name": "David Tan",
      "age": 45,
      "photo_url": null,
      "risk_level": "HIGH",
      "risk_score": 85,
      "condition": "Type 2 Diabetes",
      "last_glucose": 7.2,
      "adherence_pct": 73,
      "next_appointment_date": "2026-03-20",
      "unreviewed_briefs_count": 1,
      "last_updated": "2026-03-17T10:45:00Z"
    }
  ]
}
```

---

### 2. Get Single Patient Details

**Endpoint:** `GET /api/clinician/patients/:patient_id`

**Response (200 OK):**

```json
{
  "patient_id": "P001",
  "name": "David Tan",
  "age": 45,
  "gender": "Male",
  "language_preference": "English",
  "ethnicity": "Chinese",
  "condition": "Type 2 Diabetes",
  "diagnosis_date": "2021-03-15",
  "clinician_id": "C001",
  "emergency_contact": "Wife — +65 9123 4567",
  "photo_url": null,
  "risk_level": "HIGH",
  "risk_score": 85,
  "last_visit_date": "2025-12-10",
  "days_since_last_visit": 98,
  "alert_count": 3
}
```

---

### 3. Get Patient Glucose Trends

**Endpoint:** `GET /api/clinician/patients/:patient_id/glucose`

**Query Parameters:**

- `days` (int): 7, 14, or 30 (default: 30)

**Response (200 OK):**

```json
{
  "patient_id": "P001",
  "period_days": 30,
  "avg_glucose": 7.2,
  "avg_glucose_7day": 7.1,
  "avg_glucose_30day": 7.2,
  "min_glucose": 3.8,
  "max_glucose": 10.2,
  "std_dev": 1.8,
  "readings_below_3_8": 2,
  "readings_above_9": 4,
  "readings": [
    {
      "timestamp": "2026-03-17T08:00:00Z",
      "value_mmol": 7.2,
      "type": "fasting"
    }
  ]
}
```

---

### 4. Get Medication Adherence

**Endpoint:** `GET /api/clinician/patients/:patient_id/medication`

**Query Parameters:**

- `days` (int): 7, 14, or 30 (default: 30)

**Response (200 OK):**

```json
{
  "patient_id": "P001",
  "period_days": 30,
  "overall_adherence_pct": 73,
  "medications": [
    {
      "medication_id": "M001",
      "name": "Metformin",
      "dose": "500mg",
      "frequency": "Twice daily",
      "adherence_pct": 73,
      "trend": "declining",
      "total_doses": 60,
      "doses_taken": 44,
      "doses_missed": 10,
      "doses_held_by_agent": 6,
      "held_reason_counts": {
        "no_meal_detected": 6
      }
    }
  ],
  "dose_logs": [
    {
      "date": "2026-03-17",
      "medication": "Metformin",
      "scheduled_time": "08:00",
      "actual_time": "08:05",
      "status": "taken"
    }
  ]
}
```

---

### 5. Get Meal Logs

**Endpoint:** `GET /api/clinician/patients/:patient_id/meals`

**Query Parameters:**

- `days` (int): 7, 14, or 30 (default: 30)

**Response (200 OK):**

```json
{
  "patient_id": "P001",
  "period_days": 30,
  "skipped_meals_count": 4,
  "meals": [
    {
      "date": "2026-03-17",
      "breakfast": {
        "logged": true,
        "time": "07:30",
        "description": "Kaya toast + coffee"
      },
      "lunch": {
        "logged": false,
        "time": null,
        "skipped": true,
        "skip_reason": "back_to_back_meetings"
      },
      "dinner": {
        "logged": true,
        "time": "19:30",
        "description": "Chicken rice"
      }
    }
  ],
  "patterns": {
    "lunch_skip_pattern": ["Tuesday", "Thursday"],
    "typical_breakfast_time": "07:30",
    "typical_dinner_time": "19:30"
  }
}
```

---

### 6. Get Exercise & Activity Data

**Endpoint:** `GET /api/clinician/patients/:patient_id/exercise`

**Query Parameters:**

- `days` (int): 7, 14, or 30 (default: 30)

**Response (200 OK):**

```json
{
  "patient_id": "P001",
  "period_days": 7,
  "avg_steps": 6200,
  "step_goal": 10000,
  "days_goal_met": 2,
  "longest_sitting_episode": 190,
  "avg_sitting_hours_per_day": 7.5,
  "exercise_logs": [
    {
      "date": "2026-03-17",
      "steps": 6842,
      "active_minutes": 37,
      "sitting_episodes": [
        {
          "start": "09:00",
          "end": "12:10",
          "duration_mins": 190,
          "flagged": true
        }
      ]
    }
  ],
  "heart_rate": [
    {
      "timestamp": "2026-03-17T09:00:00Z",
      "bpm": 71,
      "zone": "resting"
    }
  ]
}
```

---

### 7. Get Appointments

**Endpoint:** `GET /api/clinician/patients/:patient_id/appointments`

**Query Parameters:**

- `status` (str): 'upcoming', 'completed', 'all' (default: 'all')

**Response (200 OK):**

```json
{
  "patient_id": "P001",
  "appointments": [
    {
      "appointment_id": "A001",
      "date": "2026-03-20",
      "time": "14:00",
      "clinic": "NUH Diabetes Centre",
      "clinician": "Dr Tan Wei Ming",
      "type": "urgent",
      "auto_booked": true,
      "booking_reason": "Glucose unstable 5 consecutive days",
      "urgency_score": 4,
      "status": "confirmed"
    }
  ]
}
```

---

### 8. Get Pre-Appointment Doctor Brief

**Endpoint:** `GET /api/clinician/patients/:patient_id/brief`

**Query Parameters:**

- `appointment_id` (str): Optional - get brief for specific appointment

**Response (200 OK):**

```json
{
  "brief_id": "B001",
  "patient_id": "P001",
  "appointment_id": "A001",
  "generated_timestamp": "2026-03-17T11:30:00Z",
  "executive_summary": "Patient's glucose control has become unstable over the past 5 days...",
  "glucose_trends": {
    "last_30_days_avg": 7.2,
    "instability_score": "HIGH",
    "pattern": "Fasting normal, post-lunch dips below 4.5 on Tue/Thu",
    "concern": "2 readings <3.8 this week (risk of hypoglycemia)"
  },
  "medication_adherence": {
    "overall_pct": 73,
    "by_medication": [
      {
        "name": "Metformin",
        "adherence_pct": 73,
        "trend": "declining",
        "note": "3 missed doses this week"
      }
    ]
  },
  "meal_patterns": {
    "breakfast_logged_pct": 90,
    "lunch_logged_pct": 43,
    "pattern": "Pattern of skip on Tue/Thu — overlaps with 12:30-2pm meetings",
    "assessment": "HIGH CONFIDENCE lunch being skipped"
  },
  "key_concerns": [
    {
      "priority": 1,
      "concern": "Glucose instability + fasting <3.8 risk",
      "details": "2 readings <3.8 mmol/L this week"
    }
  ],
  "recommended_agenda": [
    "Discuss Tuesday/Thursday schedule — can meetings be moved?",
    "Explore alternative medication timing if lunch immovable"
  ],
  "alerts": [
    {
      "level": "danger",
      "title": "Hypoglycemia Risk",
      "message": "2 readings <3.8 mmol/L this week — counsel on pre-meeting snacks"
    }
  ],
  "generated_by": "ehgula AI",
  "last_data_sync": "2026-03-17T10:45:00Z"
}
```

---

### 9. Reschedule Appointment

**Endpoint:** `PATCH /api/clinician/patients/:patient_id/appointments/:appointment_id`

**Request Body:**

```json
{
  "action": "reschedule",
  "new_date": "2026-03-27",
  "new_time": "10:00",
  "reason": "Patient requested new time"
}
```

**Response (200 OK):**

```json
{
  "appointment_id": "A001",
  "status": "rescheduled",
  "old_date": "2026-03-20",
  "new_date": "2026-03-27",
  "patient_notified": true,
  "notification_sent_at": "2026-03-17T12:00:00Z"
}
```

---

### 10. Cancel Appointment

**Endpoint:** `DELETE /api/clinician/patients/:patient_id/appointments/:appointment_id`

**Request Body:**

```json
{
  "reason": "Patient rescheduled with external clinic"
}
```

**Response (200 OK):**

```json
{
  "appointment_id": "A001",
  "status": "cancelled",
  "cancelled_at": "2026-03-17T12:00:00Z",
  "patient_notified": true
}
```

---

### 11. Get Population-Level Analytics

**Endpoint:** `GET /api/clinician/analytics`

**Query Parameters:**

- `days` (int): 7, 14, or 30 (default: 30)

**Response (200 OK):**

```json
{
  "cohort_size": 4,
  "period_days": 30,
  "overall_adherence_pct": 76,
  "avg_glucose": 7.1,
  "patients_meeting_step_goal": 2,
  "urgent_appointments_booked": 1,
  "at_risk_patients": [
    {
      "patient_id": "P001",
      "name": "David Tan",
      "risk_level": "HIGH",
      "risk_score": 85,
      "primary_concern": "Glucose instability"
    }
  ],
  "trends": {
    "adherence_trend": "stable",
    "glucose_trend": "worsening"
  }
}
```

---

## Questions for Xavier

1. **Authentication:** Will you provide a `/api/auth/login` endpoint, or should we use Supabase SDK directly?
2. **Real-time Updates:** Do you plan WebSocket support for real-time alerts, or should we poll?
3. **Brief Generation:** Will SEA-LION brief be synchronous or async? If async, what's the polling mechanism?
4. **Pagination:** Should all list endpoints support `skip/limit` or is that only for `/clinician/patients`?
5. **Error Handling:** Standard error response format? (e.g., `{error: "...", code: "..."}`)

---

## Status Checklist

- [ ] Xavier confirms endpoint structure
- [ ] Xavier provides OpenAPI spec / Postman collection
- [ ] Backend routes implemented
- [ ] Frontend validates against real API
