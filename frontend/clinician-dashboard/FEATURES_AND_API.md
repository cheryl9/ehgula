# 🏥 Clinician Dashboard - Features & API Documentation

Complete feature inventory for the EHGULA Clinician Portal with installation instructions and data switching guidelines.

---

## 📦 Quick Installation

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Setup Steps
```bash
# 1. Navigate to project directory
cd clinician-dashboard

# 2. Install dependencies
npm install

# 3. Create .env file (if not exists)
cp .env.example .env
# Edit .env and set VITE_USE_MOCK_DATA=true for development

# 4. Start development server
npm run dev

# 5. Open in browser
# http://localhost:5177
```

### Build for Production
```bash
# Edit .env: VITE_USE_MOCK_DATA=false
npm run build

# Output: ./dist/
```

---

## 🔄 Mock vs Real Data

### Quick Switch Guide

#### Development (Mock Data - Recommended)
**Edit `.env` file:**
```env
VITE_USE_MOCK_DATA=true
```

**Benefits:**
- ✓ Instant data loading (no network delays)
- ✓ No database required
- ✓ Perfect for UI development
- ✓ No credentials needed
- ✓ Predictable test data

**Start server:**
```bash
npm run dev
```

#### Production (Real Data)
**Edit `.env` file:**
```env
VITE_USE_MOCK_DATA=false
```

**Requirements:**
- ✓ Supabase backend running
- ✓ Valid credentials in .env:
  ```env
  VITE_SUPABASE_URL=your_url
  VITE_SUPABASE_ANON_KEY=your_key
  ```

**Build & deploy:**
```bash
npm run build
```

---

## 📋 Features by Route

### 🔐 Authentication

#### `/login`
**Purpose**: Clinician login portal
**Components**: Login.jsx
**Data Used**: Mock or Supabase auth
**Features**:
- Email/password authentication
- Token storage in localStorage
- Automatic redirect to dashboard on login

**API Calls**:
```javascript
// From clinician.js
loginClinic(email, password)  // async
```

---

## 👥 Patient Management

### `/patients` - Patient List
**Purpose**: View all assigned patients
**Components**: Patients.jsx
**Route**: Main page after login
**Data**: `getAssignedPatients()` from clinician.js

**Features**:
- Patient list with status indicators
- Search by patient name
- Click to view patient details
- Patient assignment display
- Risk level badges

**Data Fetched**:
```javascript
// Uses clinician.js
const data = await getAssignedPatients(skip, limit)
// Returns: { total, patients: [...] }
```

**Mock Data Structure**:
```javascript
{
  patient_id: "P001",
  name: "David Tan",
  email: "david@example.com",
  age: 45,
  condition: "Type 2 Diabetes",
  risk_level: "HIGH",
  last_visit: "2024-03-15"
}
```

---

### `/patients/:id` - Patient Overview
**Purpose**: Individual patient dashboard
**Components**: PatientOverviewPage.jsx
**Data**: `getPatientDetail(patientId)` from clinician.js

**Features**:
- Patient profile information
- Quick health metrics summary
- Recent appointments
- Key concerns and alerts
- Navigation to detailed health pages

**Sub-Features**:
- Quick glucose reading display
- Medication adherence badge
- Exercise summary
- Meal adherence score

**Data Fetched**:
```javascript
// Patient detail
const patient = await getPatientDetail(patientId)

// Patient data through store
store.actions.fetchPatientData(patientId)
```

---

### `/patients/:id/appointments` - Patient Appointments
**Purpose**: View specific patient's appointments
**Components**: AppointmentsPage.jsx
**Data**: `getAppointments(patientId)` from clinician.js

**Features**:
- Appointment history
- Upcoming appointments
- Reschedule functionality
- Appointment notes
- Appointment status tracking

**API Functions**:
```javascript
// From clinician.js
const appointments = await getAppointments(patientId, status='all')
const result = await rescheduleAppointment(patientId, appointmentId, newDate, newTime, reason)
const result = await cancelAppointment(patientId, appointmentId, reason)
```

---

### `/patients/:id/digests` - Weekly Digests
**Purpose**: Patient weekly health reports
**Components**: WeeklyDigestPage.jsx
**Data**: `getWeeklyDigestsByPatientId(patientId)` from dataProvider.js

**Features**:
- Weekly health summaries
- 4-week historical view
- Key metrics trends
- Alerts and concerns
- Digest status (pending/reviewed/actioned)

**Data Fetched**:
```javascript
// Synchronous - returns array directly
const digests = getWeeklyDigestsByPatientId(patientId)
// Returns: [ { week_start, week_end, summary, alerts, ... }, ... ]
```

**Available Statuses**:
- `pending` - Not yet reviewed
- `reviewed` - Clinician has reviewed
- `actioned` - Actions taken on findings

---

## 📊 Health Metrics

### `/clinician/patients/:id/glucose` - Glucose Tracking
**Purpose**: Detailed glucose trend analysis
**Components**: GlucosePage.jsx + GlucoseTrend.jsx
**Data**: Mock generated or `getGlucoseTrend(patientId)` from clinician.js

**Features**:
- 7/14/30-day glucose trend line chart
- Fasting vs Post-meal readings
- Target range visualization
- Statistics (min, max, avg, std dev)
- Time range selector
- Reading compliance percentage

**Data Structure**:
```javascript
{
  date: "Mar 15",
  time: "7:30 AM",
  type: "Fasting" | "Post-meal",
  value: 7.2,  // mmol/L
  readings: [
    { time: "7:30 AM", value: 6.5, type: "Fasting" },
    { time: "1:00 PM", value: 8.1, type: "Post-meal" }
  ]
}
```

**API Usage**:
```javascript
const glucoseData = await getGlucoseTrend(patientId, days=30)
```

---

### `/clinician/patients/:id/medication` - Medication Adherence
**Purpose**: Track medication compliance
**Components**: MedicationPage.jsx + AdherencePanel.jsx + DoseLog.jsx
**Data**: `getMedicationData(patientId)` from clinician.js

**Features**:
- Adherence percentage display
- Dose tracking history
- Missed dose log
- Medication schedule
- Adherence trends
- Visual adherence badge

**Data Fetched**:
```javascript
const medData = await getMedicationData(patientId, days=30)
// Returns: {
//   medications: [...],
//   adherence_percent: 85,
//   missed_doses: 3,
//   taken_doses: 25,
//   ...
// }
```

---

### `/clinician/patients/:id/exercise` - Exercise & Activity
**Purpose**: Monitor physical activity
**Components**: ExercisePage.jsx
**Sub-Components**: StepsChart.jsx, SittingLog.jsx, HeartRateSummary.jsx, HR Zones
**Data**: `getStepsData()`, `getSittingData()`, `getHeartRateData()` from dataProvider.js

**Tab 1: Daily Steps**
- 7-day step count bar chart
- Daily step goal (10,000 steps)
- Step trends
- Weekly total display

**Tab 2: Sitting Time**
- Sitting duration tracking
- Time spent sitting per day
- Alert for prolonged sitting (>60 min)
- Sitting patterns analysis

**Tab 3: Heart Rate**
- Heart rate zone distribution (pie chart)
- Zone-based activity metrics
- 7-day average heart rate
- Zones: Resting, Light, Moderate, Vigorous, Max

**Data Structures**:
```javascript
// Steps
{ date: "Mon", steps: 8542 }

// Sitting
{ start_time: "10:00", duration: 45, intensity: "high" }

// Heart Rate
{ timestamp: "2024-03-15 10:30", heart_rate: 72, zone: "light" }

// HR Zones
{ zone: "light", bpm_range: "100-139", color: "yellow", duration: 120 }
```

---

### `/clinician/patients/:id/nutrition` - Nutrition & Meals
**Purpose**: Track meal adherence and nutrition
**Components**: NutritionPage.jsx + MealSkipLog.jsx
**Data**: `getMealData(patientId)` from dataProvider.js

**Features**:
- Meal adherence tracking
- Skip meal logging
- Meal type summary (breakfast, lunch, dinner, snacks)
- Nutrition adherence percentage
- 7/14/30-day meal patterns
- Unhealthy meal alerts

**Data Structure**:
```javascript
{
  date: "2024-03-15",
  type: "Breakfast",
  time: "08:00",
  adherence: true,
  notes: "Oatmeal with berries",
  calorie_estimate: 350
}
```

---

## 📑 Clinical Tools

### `/briefs` - Doctor Briefs
**Purpose**: AI-generated clinical summaries
**Components**: DoctorBriefsPage.jsx + DoctorBriefModal.jsx
**Data**: `getAllBriefs()` from dataProvider.js
**Route**: Global page (all patients)

**Features**:
- Pre-appointment clinical summaries
- Patient risk stratification
- Key concerns highlighting
- Alerts and critical findings
- Severity filtering (critical/high/warning/good)
- Search by patient name
- Modal view for detailed brief

**Brief Structure**:
```javascript
{
  id: "brief_001",
  patientId: "P001",
  patientName: "David Tan",
  appointmentDate: "2024-03-20",
  keyConcerns: [
    { title: "Glucose Control", severity: "HIGH", details: "..." }
  ],
  alerts: [
    { id: "alert_1", severity: "CRITICAL", message: "..." }
  ],
  recommendations: ["Adjust dosage", "Increase exercise"]
}
```

**API Functions**:
```javascript
// Synchronous functions
const briefs = getAllBriefs()  // All briefs
const brief = getBriefById(briefId)  // Specific brief
const patientBriefs = getBriefsByPatientId(patientId)  // Patient's briefs
```

---

### `/patients/:id/digests` - Weekly Digest Detail
**Purpose**: Individual weekly health report
**Components**: WeeklyDigestPage.jsx + DigestCard.jsx
**Data**: `getWeeklyDigestsByPatientId(patientId)` from dataProvider.js

**Features**:
- Weekly performance summary
- Adherence metrics (medication, diet, exercise)
- Key alerts from the week
- Average glucose readings
- Activity summary
- Meal patterns
- Recommendations

---

## 🏥 Population Management

### `/appointments` - All Appointments
**Purpose**: Clinician-wide appointment management
**Components**: Appointments.jsx + AppointmentTable.jsx
**Data**: `getAllAppointments()` from dataProvider.js
**Route**: Global page across all patients

**Features**:
- All appointment list with pagination
- Filter by patient
- Filter by status (scheduled/completed/cancelled/rescheduled)
- Sort by date or urgency
- Reschedule modal
- Cancel modal
- Urgency badge display
- Date-based grouping

**Appointment Structure**:
```javascript
{
  id: "apt_001",
  patientId: "P001",
  patientName: "David Tan",
  date: new Date("2024-03-20"),
  time: "10:00",
  status: "scheduled",
  urgencyScore: 8,
  urgencyLevel: "HIGH",
  reason: "Glucose review",
  notes: "Pre-appointment glucose check required"
}
```

**Filters & Actions**:
```javascript
// Filter by status
filter: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'

// Sort options
sort: 'date-asc' | 'date-desc' | 'urgency-high'

// Actions
rescheduleAppointment(appointmentId, newDate, newTime, reason)
cancelAppointment(appointmentId, reason)
```

---

### `/triage` - Triage Board
**Purpose**: Risk-based patient stratification
**Components**: TriageBoard.jsx + TriageLane.jsx
**Data**: `getAtRiskPatients()` from dataProvider.js
**Route**: Population-level view

**Features**:
- 3-lane kanban board:
  - **🔴 URGENT** - Critical risk (red)
  - **🟡 NEEDS ATTENTION** - High risk (orange)
  - **🟢 ON TRACK** - Stable (green)
- Patient cards with risk info
- Quick access to patient details
- Risk score display
- Primary concern summary
- Adherence metrics
- Action alerts
- Click through to patient overview

**Patient Card Structure**:
```javascript
{
  rank: 1,
  patientId: "P003",
  name: "Ahmad Razif",
  riskScore: 92,
  riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  primaryConcern: "Low engagement & poor adherence",
  adherence: 38,
  glucose: 8.4,
  appEngagement: "Minimal (8 readings this week)",
  action: "Schedule intervention - diabetes education"
}
```

---

### `/analytics` - Population Analytics
**Purpose**: Cohort-level statistics and trends
**Components**: AnalyticsPage.jsx
**Data**: 
- `getCohortOverview()` from dataProvider.js
- `getAtRiskPatients()` from dataProvider.js
- `getTrends()` from dataProvider.js

**Features**:
- **Cohort Overview Cards** (4 metrics):
  - Total patients count
  - Average adherence %
  - Average glucose (mmol/L)
  - Weekly auto-booked appointments
  
- **At-Risk Patients Section**:
  - Risk-ranked patient list
  - Color-coded by risk level
  - Risk score indicator
  - Quick action buttons
  
- **Trend Analysis**:
  - Adherence trends (line chart)
  - Glucose trends (line chart)
  - Exercise trends (line chart)
  - 4-week historical view

**Data Structures**:
```javascript
// Cohort Overview
{
  totalPatients: 4,
  overallAdherence: 76,
  avgGlucose: 7.37,
  glucoseTarget: 6.5,
  weeklyAutoBookedAppointments: 2
}

// Trend Data
{
  week: "Week 1",
  value: 72  // adherence, glucose, etc.
}
```

---

### `/reports` - Reports Dashboard
**Purpose**: Historical reporting and exports
**Components**: Reports.jsx
**Data**: Various aggregations

**Features** (Placeholder for future expansion):
- Report generation
- Export capabilities
- Historical dashboards
- Custom date ranges

---

## 🔌 Data Layer Architecture

### Data Provider Layer (`src/api/dataProvider.js`)

**Synchronous Functions** (Return data directly):
```javascript
// Population Analytics
getAtRiskPatients()              // Returns array of at-risk patients
getCohortOverview()              // Returns cohort statistics object
getTrends()                       // Returns trend data for charts

// Doctor Briefs
getAllBriefs()                   // Returns array of all briefs
getBriefById(briefId)            // Returns specific brief
getBriefsByPatientId(patientId)  // Returns patient's briefs
getLatestBriefByPatientId(patientId)

// Appointments
getPatientAppointments()         // Returns patient appointments
getAllAppointments()             // Returns all appointments

// Health Metrics
getStepsData()                   // Returns steps data
getSittingData()                 // Returns sitting data
getHeartRateData()               // Returns heart rate data
getHRZones()                     // Returns HR zone definitions

// Meals & Nutrition
getMealData()                    // Returns meal logs
calculateMealAdherence()         // Returns adherence calculation
getMealPatterns()                // Returns meal pattern analysis

// Weekly Digests
getWeeklyDigestsByPatientId(patientId)
getAllWeeklyDigests()
getWeeklyDigestStatusColor(status)  // Utility function
```

**Feature Flag Check**:
```javascript
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA !== 'false'
```

---

### Clinician API Layer (`src/api/clinician.js`)

**Async Functions** (Make actual API calls):
```javascript
// Patient Management
getAssignedPatients(skip, limit)
getPatientDetail(patientId)

// Health Metrics (async for real API calls)
getGlucoseTrend(patientId, days=30)
getMedicationData(patientId, days=30)
getMealData(patientId, days=30)          // No mock, real API only
getExerciseData(patientId, days=30)      // No mock, real API only

// Appointments
getAppointments(patientId, status='all')
rescheduleAppointment(patientId, appointmentId, newDate, newTime, reason)
cancelAppointment(patientId, appointmentId, reason)

// Clinical
getDoctorBrief(patientId, appointmentId)
getPopulationAnalytics(days=30)
```

**Feature Flag Check**:
```javascript
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA !== 'false'
```

---

### State Management (`src/store/clinicianStore.js`)

**Zustand Store with Actions**:
```javascript
// Auth Actions
setToken(token)

// Patient Actions
fetchPatients()         // Async - calls getAssignedPatients()
selectPatient(patientId)
fetchPatientData(patientId, dataType='all')

// UI Actions
toggleSidebar()
setSelectedTab(tab)
openModal(modalName)
closeModal(modalName)
```

---

## 🎯 Using Features in Your Components

### Option 1: Direct Data Provider (Synchronous)
```javascript
import { getAtRiskPatients } from '../api/dataProvider'

function MyComponent() {
  const patients = getAtRiskPatients()  // Returns array immediately
  return <div>{patients.map(p => <Card key={p.patientId} patient={p} />)}</div>
}
```

### Option 2: Clinician API with Store (Asynchronous)
```javascript
import useClinicianStore from '../store/clinicianStore'

function MyComponent() {
  const store = useClinicianStore()
  
  useEffect(() => {
    store.actions.fetchPatients()
  }, [])
  
  return (
    <div>
      {store.patients.isLoading && <LoadingSpinner />}
      {store.patients.list.map(p => <Card key={p.patient_id} patient={p} />)}
    </div>
  )
}
```

### Option 3: Custom Hook (Recommended for Patient Data)
```javascript
import { usePatient } from '../hooks'

function MyComponent({ patientId }) {
  const { patient, isLoading, error } = usePatient(patientId)
  
  return (
    <div>
      {isLoading && <LoadingSpinner />}
      {patient && <Profile patient={patient} />}
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </div>
  )
}
```

---

## 📂 Mock Data Files

### Available Mock Datasets
Located in `src/api/mock/`

1. **mockBriefs.js**
   - `getAllBriefs()` - Returns array of doctor briefs
   - `getBriefById(id)` - Returns specific brief
   - `getBriefsByPatientId(id)` - Returns patient's briefs
   - `MOCK_BRIEFS` - Constant with all mock briefs

2. **mockAppointments.js**
   - `MOCK_PATIENT_APPOINTMENTS` - Single patient appointments
   - `MOCK_ALL_APPOINTMENTS` - All appointments across patients

3. **mockExercise.js**
   - `MOCK_STEPS` - Daily step counts
   - `MOCK_SITTING` - Sitting duration logs
   - `MOCK_HEART_RATE` - Heart rate data
   - `HR_ZONES` - Heart rate zone definitions

4. **mockMeals.js**
   - `MOCK_MEAL_DATA` - Meal logs
   - `calculateMealAdherence()` - Function to calc adherence
   - `MEAL_PATTERNS` - Meal pattern analysis

5. **mockWeeklyDigests.js**
   - `getWeeklyDigestsByPatientId(id)` - Returns patient's digests
   - `getAllWeeklyDigests()` - Returns all digests
   - `MOCK_WEEKLY_DIGESTS` - Constant with mock digests

6. **mockPopulationStats.js**
   - `getAtRiskPatients()` - Returns at-risk patients
   - `getCohortOverview()` - Returns cohort statistics
   - `getTrends()` - Returns trend data
   - `MOCK_POPULATION_STATS` - All population data

7. **mocks.js**
   - `MOCK_PATIENTS` - Patient list
   - `MOCK_GLUCOSE` - Glucose data
   - `MOCK_MEDICATIONS` - Medication data

---

## 🧪 Testing with Mock vs Real Data

### Testing Locally (Mock Data)
```bash
# .env setting
VITE_USE_MOCK_DATA=true

# All data loads instantly
# Perfect for component development
# No network latency
npm run dev
```

### Integration Testing (Real Data)
```bash
# .env setting
VITE_USE_MOCK_DATA=false

# Requires:
# - Backend running
# - Valid Supabase credentials
# - Network connectivity
npm run dev
```

### Debugging Data Flow
```javascript
// Check which mode is active
import { USE_MOCK_DATA } from '../api/dataProvider'
console.log('Using mock data:', USE_MOCK_DATA)

// Inspect mock data
import * as mockData from '../api/mock'
console.log('Mock patients:', mockData.MOCK_PATIENTS)
```

---

## 🚨 Performance Considerations

### Mock Data Performance
- ✓ O(1) - Instant data access
- ✓ No network latency
- ✓ Perfect for UI testing
- ✓ Ideal for rapid development

### Real Data Performance
- ⚠️ Depends on network
- ⚠️ Database query time
- ⚠️ Add loading states
- ⚠️ Implement error handling

### Optimization Tips
```javascript
// 1. Use appropriate pagination
const patients = await getAssignedPatients(0, 20)  // First 20

// 2. Cache expensive queries
const cache = new Map()
function getCachedBriefs(age = 5000) {  // 5 sec cache
  if (cache.has('briefs') && Date.now() - cache.get('briefs').time < age) {
    return cache.get('briefs').data
  }
  const data = getAllBriefs()
  cache.set('briefs', { data, time: Date.now() })
  return data
}

// 3. Use loading states
const [isLoading, setIsLoading] = useState(false)
```

---

## 🔧 Common Integration Patterns

### Pattern 1: List with Filter
```javascript
import { getAssignedPatients } from '../api/clinician'

function PatientList() {
  const [patients, setPatients] = useState([])
  const [filter, setFilter] = useState('')
  
  useEffect(() => {
    getAssignedPatients().then(data => setPatients(data.patients))
  }, [])
  
  const filtered = patients.filter(p => 
    p.name.toLowerCase().includes(filter.toLowerCase())
  )
  
  return (
    <div>
      <input value={filter} onChange={e => setFilter(e.target.value)} />
      {filtered.map(p => <PatientCard key={p.patient_id} patient={p} />)}
    </div>
  )
}
```

### Pattern 2: Detail View with Related Data
```javascript
function PatientDetail({ patientId }) {
  const [patient, setPatient] = useState(null)
  const [glucose, setGlucose] = useState(null)
  const [appointments, setAppointments] = useState([])
  
  useEffect(() => {
    // Load all related data
    Promise.all([
      getPatientDetail(patientId),
      getGlucoseTrend(patientId),
      getAppointments(patientId)
    ]).then(([p, g, a]) => {
      setPatient(p)
      setGlucose(g)
      setAppointments(a)
    })
  }, [patientId])
  
  if (!patient) return <LoadingSpinner />
  
  return (
    <div>
      <Profile patient={patient} />
      <GlucoseChart data={glucose} />
      <AppointmentList appointments={appointments} />
    </div>
  )
}
```

### Pattern 3: Real-time Metrics
```javascript
function MetricsDisplay() {
  const cohort = getCohortOverview()
  
  return (
    <div className="grid grid-cols-4 gap-4">
      <Card title="Patients" value={cohort.totalPatients} />
      <Card title="Adherence" value={`${cohort.overallAdherence}%`} />
      <Card title="Avg Glucose" value={cohort.avgGlucose.toFixed(2)} />
      <Card title="Appointments" value={cohort.weeklyAutoBookedAppointments} />
    </div>
  )
}
```

---

## 📚 Related Documentation

- **INDEX.md** - Complete project overview
- **QUICK_START.md** - 2-minute setup guide
- **PROJECT_AUDIT_REPORT.md** - Technical audit
- **DATA_LAYER_VERIFICATION.md** - Detailed API reference
- **.env** - Configuration options

---

## ❓ FAQ for Teammates

**Q: How do I add a new feature?**
A: 
1. Create page in `src/pages/`
2. Add route in `App.jsx`
3. Use dataProvider (sync) or clinician.js (async)
4. Import mock data if needed

**Q: Can I mix mock and real data?**
A:
Yes! The flag is checked at runtime in each function, so you can:
- Use sync functions with mock data directly
- Mix with async API calls
- Switch modes in .env whenever needed

**Q: How do I debug data issues?**
A:
```javascript
// Check if mock mode
import { USE_MOCK_DATA } from '../api/dataProvider'
console.log('Mock mode:', USE_MOCK_DATA)

// Inspect available mock data
import * as mock from '../api/mock'
console.log(mock)
```

**Q: What if I need data not in mock files?**
A:
1. Add to appropriate mock file in `src/api/mock/`
2. Export the new data
3. Use it in components
4. Add real API call when backend ready

**Q: How do I handle errors?**
A:
```javascript
try {
  const data = await getAppointments(patientId)
  setAppointments(data)
} catch (error) {
  console.error('Failed to load appointments:', error)
  setError(error.message)
}
```

---

## 🎓 Learning Resources

### Component Examples
- **StepsChart.jsx** - Chart implementation
- **AppointmentTable.jsx** - Table with sorting/filtering
- **TriageLane.jsx** - Custom card layout
- **DoctorBriefModal.jsx** - Modal pattern

### Hooks Examples
- **usePatient.js** - Data fetching hook
- **useAuth.js** - Auth state hook

### Store Examples
- **clinicianStore.js** - Zustand state management

---

## ✅ Checklist Before Adding New Features

- [ ] Feature route/endpoint identified
- [ ] Mock data created (if needed)
- [ ] API function added to dataProvider.js or clinician.js
- [ ] Feature flag logic implemented
- [ ] Component built and tested with mock data
- [ ] Error handling added
- [ ] Loading states implemented
- [ ] Component documented in this file

---

## 📞 Support & Questions

**For questions about:**
- **Data layer**: See DATA_LAYER_VERIFICATION.md
- **Project setup**: See QUICK_START.md
- **Feature details**: See specific page components
- **Mock data**: Check src/api/mock/ files
- **Routes**: Check App.jsx

---

**Last Updated**: March 18, 2026
**Version**: 1.0
**Status**: Production Ready ✓
