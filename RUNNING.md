# Run Backend and Frontend

## 1. Install Requirements

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
cd frontend/clinician-dashboard
npm install
```

## 2. Create Backend Env File

Create `backend/.env`:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_ANON_KEY=your_supabase_anon_key
CLINICIAN_USER_ID=uuid_of_clinician_user
```

## 3. Create Frontend Env File

Create `frontend/clinician-dashboard/.env`:

```env
VITE_SUPABASE_URL=https://eibbkncaejxmkpkngjqz.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_publishable_anon_key
VITE_API_BASE_URL=http://127.0.0.1:8000/api
VITE_USE_MOCK_DATA=false
```

## 4. Run Backend

```bash
source .venv/bin/activate
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

## 5. Run Frontend

```bash
cd frontend/clinician-dashboard
npm run dev
```
