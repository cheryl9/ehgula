# EhGula Webapp Run Instructions

This file explains the dependencies and steps to run the clinician webapp stack locally (backend API + clinician dashboard).

## 1) System Dependencies

Install these first:

- Python 3.11+ (project currently works with Python 3.13 in `.venv`)
- Node.js 18+ and npm
- Git

## 2) Backend Setup and Run

Backend path: `backend/`

### Required backend env vars

Create `backend/.env` with:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_ANON_KEY=your_supabase_anon_key
CLINICIAN_USER_ID=uuid_of_clinician_user
```

Notes:

- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are required for API runtime.
- `CLINICIAN_USER_ID` is required by clinician endpoints.
- `SUPABASE_ANON_KEY` is mainly used by auth and testing utilities.

Optional (not required for current webapp flows):

```env
HF_TOKEN=your_huggingface_token
```

Use `HF_TOKEN` only if you enable model-backed features later.

### Install backend dependencies

From repository root:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

### Run backend server

From repository root:

```bash
source .venv/bin/activate
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

Health check:

```bash
curl http://127.0.0.1:8000/
```

API base used by frontend:

- `http://127.0.0.1:8000/api`

## 3) Frontend Setup and Run (Clinician Dashboard)

Frontend path: `frontend/clinician-dashboard/`

### Install dependencies

```bash
cd frontend/clinician-dashboard
npm install
```

### Frontend env vars

Create `frontend/clinician-dashboard/.env` if needed:

```env
VITE_SUPABASE_URL=https://eibbkncaejxmkpkngjqz.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_publishable_anon_key
VITE_API_BASE_URL=http://127.0.0.1:8000/api
VITE_USE_MOCK_DATA=false
```

Notes:

- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are required for frontend auth.
- Set `VITE_USE_MOCK_DATA=false` to use real backend API data.
- If `VITE_USE_MOCK_DATA` is omitted, app defaults to mock mode.

### Run clinician dashboard

```bash
cd frontend/clinician-dashboard
npm run dev
```

Default Vite URL is usually:

- `http://127.0.0.1:5173` (or another free port)

## 4) Typical Local Dev Workflow

Open 2 terminals:

Terminal 1 (backend):

```bash
source .venv/bin/activate
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

Terminal 2 (clinician dashboard):

```bash
cd frontend/clinician-dashboard
npm run dev
```

Then open the frontend URL shown by Vite.

## 5) Quick Troubleshooting

- Backend not reachable:
  - Check backend terminal for startup errors.
  - Confirm `.venv` is active and dependencies are installed.
  - Confirm port 8000 is free.
- Frontend shows mock data unexpectedly:
  - Set `VITE_USE_MOCK_DATA=false` in frontend env.
  - Restart Vite after changing env values.
- Browser shows CORS + 500:
  - Usually means backend crashed or threw an exception; check backend logs first.
