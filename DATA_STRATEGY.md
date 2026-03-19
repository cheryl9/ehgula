# Data Strategy

## 1. Purpose

This project supports diabetes care workflows by combining clinical, behavioral, and physiological data into actionable views for patients and clinicians.

Primary goals:

- support proactive interventions from changing trends
- improve clinician visibility without manual data stitching
- keep runtime access secure and auditable through backend mediation

## 2. Current Architecture

### Runtime Data Path

For the clinician dashboard in real-data mode:

1. Browser app calls backend API.
2. Backend validates scope (assigned patients, clinician context).
3. Backend reads/writes Supabase.
4. Backend returns normalized payloads to frontend.

The frontend no longer performs direct database fallback queries for clinician runtime data.

### Authentication Split

- Clinician dashboard authentication currently uses Supabase auth client-side.
- Clinical data reads/writes for dashboard views go through backend routes under `/api/clinician/...`.

### Mock Mode

- `VITE_USE_MOCK_DATA` controls mock data usage in frontend APIs.
- Production-like local testing should use `VITE_USE_MOCK_DATA=false`.

## 3. Data Domains

### Patient and Identity

- demographics and profile metadata
- patient-clinician assignment mapping

### Clinical and Treatment

- diagnosis context
- medication plans and dose logs
- appointment schedule and status

### Physiological and Behavior

- glucose readings (time series)
- meal logs, including skipped meal patterns
- exercise/activity signals (steps, sitting, heart rate)

### Derived and Agent Outputs

- weekly health digests
- risk indicators and prioritization fields
- pre-appointment brief generation support
- agent action traces used for explainability and review

## 4. Storage Model

Data is stored in Supabase Postgres with relational tables.

Core entities:

- `profiles`
- `patients`
- `clinicians`
- `clinician_patient_assignments`

Operational entities:

- `glucose_readings`
- `medication_plans`
- `medication_dose_logs`
- `meal_logs`
- `exercise_logs`
- `appointments`
- `agent_actions`
- `weekly_health_digests`
- `calendar_events`

Design principles:

- keep canonical source data normalized
- derive UI-ready summaries at backend API boundaries
- enforce assignment-aware filtering on clinician-facing endpoints

## 5. Access and Security Strategy

### Access Layers

- Browser layer: request/response only, no privileged DB access for clinician data paths.
- API layer: authorization checks, assignment checks, data shaping.
- DB layer: Supabase policies and table-level controls.

### Current Enforcement

- clinician endpoints identify current clinician context via configured environment value (`CLINICIAN_USER_ID`) and assignment tables
- patient detail and trend endpoints enforce assignment membership
- analytics endpoints prefer graceful degradation over hard crash when upstream data is incomplete

### Privacy Principles

- least privilege by role
- minimum necessary data exposure per view
- explicit patient-to-clinician scope checks

### Row Level Security (RLS)

RLS is enabled on patient-linked tables in Supabase. Access is scoped by `auth.uid()` and clinician assignment.

#### RLS access model

- patient users can access only their own records
- clinician users can access only records for patients assigned to them
- unauthenticated users have no access to clinical data tables

#### Policy mapping by table

- `profiles`:
	- user can read/update own profile where `profiles.id = auth.uid()`
- `clinicians`:
	- clinician can read own clinician row where `clinicians.user_id = auth.uid()`
- `patients`:
	- patient can read own row where `patients.user_id = auth.uid()`
	- clinician can read patient rows linked through `clinician_patient_assignments`
- `clinician_patient_assignments`:
	- clinician can read rows where assignment clinician maps to `auth.uid()`
- `glucose_readings`, `medication_plans`, `medication_dose_logs`, `meal_logs`, `exercise_logs`, `calendar_events`, `agent_actions`, `weekly_health_digests`, `appointments`:
	- patient can read rows where `patient_id` belongs to own patient row
	- clinician can read rows where `patient_id` is in clinician-assigned patient set

#### Canonical assignment predicate used by clinician policies

```sql
patient_id IN (
	SELECT cpa.patient_id
	FROM clinician_patient_assignments cpa
	JOIN clinicians c ON c.id = cpa.clinician_id
	WHERE c.user_id = auth.uid()
)
```

#### Canonical patient self-scope predicate

```sql
patient_id IN (
	SELECT p.id
	FROM patients p
	WHERE p.user_id = auth.uid()
)
```

#### Validation

- role-based RLS verification is exercised through `backend/test_rls_as_patient.py`
- tests should be run for both patient and clinician credentials before releases

## 6. API Surface for Clinician Dashboard

Current backend route group:

- `GET /api/clinician/patients`
- `GET /api/clinician/patients/{patient_id}`
- `GET /api/clinician/patients/{patient_id}/glucose`
- `GET /api/clinician/patients/{patient_id}/medication`
- `GET /api/clinician/patients/{patient_id}/meals`
- `GET /api/clinician/patients/{patient_id}/exercise`
- `GET /api/clinician/patients/{patient_id}/appointments`
- `GET /api/clinician/patients/{patient_id}/brief`
- `GET /api/clinician/analytics`

Mutation endpoints for appointment workflows are also supported in the same namespace.

## 7. Data Quality and Reliability

### Strategy

- normalize payloads at API boundary for frontend stability
- return bounded defaults where safe for non-critical aggregate endpoints
- fail fast for scope/security violations

### Operational Checks

- verify backend health endpoint before frontend testing
- verify clinician endpoints with known assigned patient IDs
- monitor 500 errors first (browser CORS messages can be secondary symptoms)

## 8. Environment Requirements

Backend environment variables used in active flows:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `CLINICIAN_USER_ID`
- `HF_TOKEN`

Refer to `RUNNING.md` for setup and run commands.

## 9. Near-Term Roadmap

- replace env-based clinician context with token-based identity propagation
- tighten CORS origins and auth policy for non-local environments
- formalize API contracts (schema validation / OpenAPI review)
- add endpoint-level integration tests for assignment checks and edge cases