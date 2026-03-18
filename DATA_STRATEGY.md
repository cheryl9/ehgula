# 📊 Data Strategy Plan

## 1. Overview

Our system is designed to support intelligent diabetes management by integrating multi-modal patient data, including physiological readings, medication adherence, behavioural patterns, and contextual calendar information.

The platform integrates:
- physiological data (glucose readings)
- behavioural data (meals, exercise, medication adherence)
- contextual data (calendar, routines)
- clinical data (history, clinician input)

Using an Agentic AI architecture, the system continuously observes patient context, reasons over multiple signals, and takes proactive actions to improve health outcomes.

---

## 2. Alignment with Problem Statement

### Proactive Patient Engagement

The system moves beyond passive reminders by:
- continuously monitoring real-time data streams
- detecting patterns (e.g., skipped meals, unstable glucose)
- triggering context-aware actions (e.g., delaying medication, suggesting food or exercise)

This is enabled by:
- structured time-series data (glucose, activity)
- contextual data (calendar events)
- agent action logs (for feedback loops)

---

### Hyper Personalisation of Care

The system synthesises multiple data sources:

| Data Type | Source |
|------|--------|
| Clinical history | NEHR (simulated via Synapxe APIs) |
| Physiological data | CGM / simulated wearable |
| Behavioural data | Patient logs |
| Contextual data | Calendar events |
| Agent memory | Historical patterns |

This enables:
- personalised medication timing
- culturally relevant dietary recommendations (e.g., hawker food context)
- adaptive behaviour modelling (e.g., detecting recurring skipped lunches)

---

### Bridging Patient–Clinician Gap

The system reduces clinician burden by:

- automatically generating:
  - weekly health digests
  - pre-appointment summaries
- logging all agent decisions in:
  - `agent_actions`

This allows clinicians to:
- quickly assess patient condition
- identify risk patterns
- make informed decisions without manual data aggregation

---

### Measuring Real-World Impact

The system tracks:

| Metric | Source |
|------|--------|
| Medication adherence | medication_dose_logs |
| Glucose stability | glucose_readings |
| Lifestyle behaviour | meal_logs, exercise_logs |
| Engagement | agent_actions |
| Outcomes | weekly_health_digests |

These metrics support:
- outcome evaluation
- longitudinal tracking
- healthcare efficiency analysis

---

## 3. Data Collection

### Types of Data

#### Personal & Demographic
- Name, age, gender, ethnicity, language preference

#### Clinical
- Diagnosis, medications, clinician assignment

#### Physiological
- Glucose readings (time-series)

#### Behavioural
- Meals (including skipped meals)
- Exercise and activity
- Medication adherence

#### Contextual
- Calendar events (work schedule)

#### Derived / AI-generated
- Agent actions
- Weekly summaries
- Risk signals (e.g., skipped lunch detection)

---

## 4. Data Storage & Architecture

- Built on **PostgreSQL (Supabase)**
- Structured into relational tables:

Core:
- `profiles`, `patients`, `clinicians`, `clinician_patient_assignments`

Feature:
- `glucose_readings`
- `medication_plans`, `medication_dose_logs`
- `meal_logs`, `exercise_logs`
- `calendar_events`
- `agent_actions`
- `weekly_health_digests`

---

### Design Principles

- **Relational integrity** via foreign keys
- **Efficient access** via indexing
- **Separation of concerns**:
  - Auth → Supabase Auth
  - Data → public schema
  - Secure logic → private schema

---

## 5. Privacy Protection

### Core Principles

- Data minimisation
- Purpose limitation (healthcare only)
- No cross-user visibility

---

### Enforcement via RLS

#### Patients:
```sql
user_id = auth.uid()