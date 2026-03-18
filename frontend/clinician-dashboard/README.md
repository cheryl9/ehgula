# ehgula Clinician Portal

React + Vite frontend for the ehgula clinical decision support system.

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
cd frontend/clinician-dashboard

# Install dependencies
npm install

# Create .env from template
cp .env.example .env

# Start dev server
npm run dev
```

The portal will be available at `http://localhost:5174`

---

## Project Structure

```
src/
├── pages/              # Route pages (Dashboard, Patients, Appointments, etc.)
├── components/
│   ├── layout/        # Sidebar, Topbar, MainLayout
│   ├── ui/            # Reusable UI components (Badge, MetricCard, Modal, Table, etc.)
│   ├── dashboard/     # Dashboard-specific components
│   ├── health/        # Health data visualizations (GlucoseTrend, AdherencePanel, etc.)
│   ├── appointments/  # Appointment management components
│   ├── brief/         # Doctor brief components
│   └── reporting/     # Analytics & reporting components
├── api/               # API client and endpoint wrappers
├── store/             # Zustand state management
├── hooks/             # Custom React hooks
├── utils/             # Utility functions & formatters
└── data/              # Mock data for development
```

---

## Architecture

### Authentication

Uses JWT tokens stored in `localStorage`. Token should be included in all API requests via `Authorization: Bearer <token>` header.

**Mock Auth:** Login page is stubbed for now. In Phase 1, integrate Supabase auth or backend JWT.

### State Management

Uses **Zustand** for global state:

- `authStore` - Current clinician + auth state
- `patientStore` - Selected patient + patient list
- `dataStore` - Glucose, medication, exercise data
- `uiStore` - UI state (sidebar open, modals, etc.)

### API Client

Axios-based client in `src/api/client.js` with:

- Auto-inject JWT headers
- Request/response interceptors
- Error handling

See [API_CONTRACT.md](./API_CONTRACT.md) for endpoint specifications.

---

## Development Workflow

### Phase 1: Foundation & Auth

- [ ] Implement auth (Supabase + JWT)
- [ ] Setup API client with real endpoints
- [ ] Test routing & layout

### Phase 2: Layout & Navigation

- [ ] Sidebar with patient list
- [ ] Topbar with patient details
- [ ] Navigation refinement

### Phase 3: Patient Overview

- [ ] Metric cards row (glucose, adherence, appointments, etc.)
- [ ] Risk alerts & flags
- [ ] Patient info card

### Phase 4: Health Visualizations

- [ ] Glucose trend chart
- [ ] Medication adherence panel
- [ ] Meal skip logs

### Phase 5: Exercise & Activity

- [ ] Steps/activity chart
- [ ] Sitting episode log
- [ ] Heart rate zones

### Phase 6: Appointment Management

- [ ] Appointment history table
- [ ] Reschedule/cancel workflows
- [ ] Urgency indicators

### Phase 7: Doctor Brief & Reporting

- [ ] **HERO FEATURE:** Pre-appointment doctor brief generation & export
- [ ] Weekly digest view
- [ ] Population-level analytics
- [ ] Triage board

### Phase 8: Testing & Evaluation

- [ ] Usability testing setup
- [ ] Performance optimization
- [ ] Evaluation plan finalization

---

## Key Dependencies

- **React 18** - UI framework
- **React Router 6** - Client-side routing
- **Axios** - HTTP client
- **Recharts** - Chart library
- **Zustand** - State management
- **TailwindCSS** - Styling
- **Lucide React** - Icons

---

## Environment Variables

```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_API_BASE_URL=http://localhost:8000/api
VITE_ENV=development
```

---

## Component Library

### UI Components (Reusable)

- **MetricCard** - Display clinical metrics with status & trend
- **Badge** - Small status labels
- **Modal** - Dialog boxes for actions
- **Table** - Data tables with sorting/filtering
- **LoadingSpinner** - Loading indicator

Import from `src/components/ui/`:

```jsx
import { MetricCard, Badge, Modal, Table } from "../components/ui";
```

---

## API Integration

All API calls go through `src/api/clinician.js`:

```jsx
import { getAssignedPatients, getGlucoseTrend } from "../api/clinician";

// Usage
const patients = await getAssignedPatients();
const glucose = await getGlucoseTrend(patientId, (days = 30));
```

For mock data during development, use `src/api/mocks.js`.

---

## Styling

- **TailwindCSS** for utility-first styling
- **Custom theme** in `tailwind.config.js` with medical colors:
  - `medical-green-*` - Success/good outcomes
  - `danger-red-*` - Warning/critical
  - `warning-orange-*` - Medium priority
  - `info-blue-*` - General information

---

## Testing

### Usability Testing

Create a test scenario in `EVALUATION_PLAN.md` and run with clinician users.

### Component Testing (Future)

```bash
npm test
```

---

## Build & Deployment

```bash
npm run build   # Generate optimized dist/ folder
npm run preview # Preview production build locally
```

---

## Troubleshooting

### Port Already in Use

Change port in `vite.config.js` (default: 5174)

### API Not Connecting

- Check `VITE_API_BASE_URL` in `.env`
- Ensure backend is running on `http://localhost:8000`
- Check browser console for CORS errors

### Routing Not Working

- Ensure `<BrowserRouter>` wraps all routes in `App.jsx`
- Check `<Outlet />` in `MainLayout`

---

## Key Files & Contacts

| File                             | Owner       | Status                          |
| -------------------------------- | ----------- | ------------------------------- |
| `/frontend/clinician-dashboard/` | WS          | 🔨 In Progress (Phase 0)        |
| `API_CONTRACT.md`                | WS + Xavier | ⏳ Awaiting Xavier confirmation |
| `../EVALUATION_PLAN.md`          | WS          | ✅ Draft complete               |

---

## Contributing

- **Feature branches:** `feature/[phase]-[feature-name]`
- **Commit messages:** "Phase X: Add [feature]"
- **Pull requests:** Include screenshot if UI change

---

## License

MIT - Team ehgula 2026

---

**Last Updated:** March 18, 2026  
**Version:** 0.1.0 (Phase 0 Complete)
