# Quick Start Guide - Mock/Real Data Switching

## One-Minute Overview

Your clinician dashboard can switch between **mock data** (development) and **real data** (production) with a single environment variable.

---

## 🚀 Quick Commands

### Start with Mock Data (Recommended for Development)

```bash
cd clinician-dashboard
npm install
npm run dev
```

Then visit: **http://localhost:5177**

✓ Data loads instantly
✓ No database needed
✓ Perfect for UI development

### Build for Production with Real Data

```bash
# In .env, change:
VITE_USE_MOCK_DATA=false

# Then build:
npm run build

# Output in ./dist/ folder
```

---

## 🔄 How to Switch Modes

### Current Setting (.env)

```
VITE_USE_MOCK_DATA=true    ← Change this
```

### Option 1: Mock Data

```
VITE_USE_MOCK_DATA=true
```

- All APIs return mock data
- Instant page loads
- No database connection
- Use during development

### Option 2: Real Data

```
VITE_USE_MOCK_DATA=false
```

- All APIs query Supabase
- Real patient data loads
- Requires backend running
- Use for production

---

## ✅ What Works Right Now

With `VITE_USE_MOCK_DATA=true`:

| Feature                                  | Status  |
| ---------------------------------------- | ------- |
| Dashboard with patient list              | ✓ Works |
| Triage board (urgent/attention/on-track) | ✓ Works |
| Analytics & population stats             | ✓ Works |
| Doctor briefs                            | ✓ Works |
| Appointments                             | ✓ Works |
| Glucose trends                           | ✓ Works |
| Exercise tracking                        | ✓ Works |
| Medication adherence                     | ✓ Works |
| Weekly digests                           | ✓ Works |
| Patient navigation                       | ✓ Works |

---

## 📊 Data Layer Explanation

```
┌────────────────────────────────────┐
│     React Components               │
│ (Pages, Dashboard, TriageBoard...) │
└──────────┬─────────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│   dataProvider.js (Data Layer)   │
│   Checks: VITE_USE_MOCK_DATA     │
└──────────┬─────────────────────────┘
           │
    ┌──────┴──────┐
    ▼             ▼
┌─────────┐   ┌──────────┐
│ Mock    │   │ Supabase │
│ Data    │   │ API      │
│ (fast)  │   │ (real)   │
└─────────┘   └──────────┘
```

**Feature flag controls which path is used**

---

## 🛠️ Recently Fixed

✓ **14 async/await bugs fixed** - Functions now return data directly instead of Promises
✓ **Unified feature flag** - Both dataProvider and clinician APIs use same flag
✓ **Enhanced documentation** - Clear instructions for switching modes

---

## 📱 Page Navigation

Once app is running:

| URL                      | Page                 | Status |
| ------------------------ | -------------------- | ------ |
| /                        | Dashboard            | ✓      |
| /triage                  | Triage Board         | ✓      |
| /analytics               | Population Analytics | ✓      |
| /briefs                  | Doctor Briefs        | ✓      |
| /appointments            | All Appointments     | ✓      |
| /patients                | Patient List         | ✓      |
| /patients/:id            | Patient Overview     | ✓      |
| /patients/:id/glucose    | Glucose Trends       | ✓      |
| /patients/:id/exercise   | Exercise Data        | ✓      |
| /patients/:id/medication | Med Adherence        | ✓      |
| /patients/:id/nutrition  | Nutrition Logs       | ✓      |
| /patients/:id/digests    | Weekly Digests       | ✓      |

---

## 🧪 Testing Your Changes

### 1. Verify Mock Mode Works

```bash
npm run dev
# Visit http://localhost:5177
# Check dashboard loads with data
# Open browser DevTools (F12)
# Should see NO network errors (only mock data)
```

### 2. Verify Build Works

```bash
npm run build
# Should complete in ~10 seconds
# Check dist/ folder created
# No errors should appear
```

### 3. Test Real Mode (Optional)

```bash
# Edit .env: VITE_USE_MOCK_DATA=false
# npm run dev
# Should attempt Supabase connection
# Check browser console for API calls
```

---

## 🐛 Troubleshooting

### Problem: Pages are blank

**Solution**:

- Check .env file: `VITE_USE_MOCK_DATA=true`
- Run `npm install`
- Restart dev server

### Problem: Data not appearing

**Solution**:

- Check browser console (F12)
- Clear cache: Ctrl+Shift+Del
- Verify .env is in clinician-dashboard folder

### Problem: Port 5177 already in use

**Solution**:

- Vite will auto-select next available port
- Check terminal output for actual port
- Or kill process: `Get-Process npm | Stop-Process`

### Problem: Want to force mock data

**Solution**:

```bash
# Make sure .env has:
VITE_USE_MOCK_DATA=true

# Then verify by checking dataProvider:
# grep "const USE_MOCK_DATA" src/api/dataProvider.js
# Should output: const USE_MOCK_DATA = true
```

---

## 📞 Support Documents

Located in clinician-dashboard folder:

1. **PROJECT_AUDIT_REPORT.md** - Complete audit and status
2. **DATA_LAYER_VERIFICATION.md** - Technical reference
3. **README.md** - Original project info
4. **.env** - Configuration file (with comments)

---

## 🎯 Next Steps

### For Development

```bash
cd clinician-dashboard
npm install
npm run dev
```

Start building UI features with mock data!

### For Production

1. Verify backend/Supabase is running
2. Change `.env`: `VITE_USE_MOCK_DATA=false`
3. Run: `npm run build`
4. Deploy `dist/` folder

### For Testing

See DATA_LAYER_VERIFICATION.md for comprehensive testing guide

---

## ⚡ Key Features of This Setup

✓ **Zero configuration** - Just change one env var to switch
✓ **Type-safe** - All data flows through abstraction layer
✓ **Testable** - Mock data available for all features
✓ **Scalable** - Easy to add new pages/components
✓ **Production-ready** - Real API integration ready to use

---

**Ready to start? Run `npm run dev` and visit http://localhost:5177!**
