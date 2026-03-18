// src/services/api.js
//
// All calls to the FastAPI backend go through here.
// Supabase reads stay in usePatientData hook.
// ─────────────────────────────────────────────

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

async function post(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return res.json();
}

async function get(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

async function del(path) {
  const res = await fetch(`${BASE_URL}${path}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status}`);
  return res.json();
}

// ─────────────────────────────────────────────
// AGENT
// ─────────────────────────────────────────────

/**
 * Runs the full ORA loop.
 * Returns observations, alert_level, in_app_reminders,
 * pending_booking, notifications.
 */
export async function runAgent(patientId = null) {
  return post("/agent/run", { patient_id: patientId });
}

/**
 * Fetches the pre-appointment doctor brief.
 * Pass patientId if your backend supports multi-patient.
 */
export async function getDoctorBrief(patientId = null) {
  const path = patientId ? `/brief?patient_id=${patientId}` : "/brief";
  return get(path);
}

// ─────────────────────────────────────────────
// CHAT
// ─────────────────────────────────────────────

/**
 * Sends a message to the AI and returns a reply.
 * Also returns alert_level, pending_booking, in_app_reminders.
 *
 * @param {string} message    — what the patient typed
 * @param {string} sessionId  — use patient's user ID for persistence
 */
export async function sendChatMessage(message, sessionId = "default", patientId = null) {
  return post("/chat", { message, session_id: sessionId, patient_id: patientId });
}

/**
 * Clears conversation history for a session.
 */
export async function clearChatHistory(sessionId = "default") {
  return del(`/chat/${sessionId}`);
}

// ─────────────────────────────────────────────
// MEALS
// ─────────────────────────────────────────────

/**
 * Logs a meal the patient ate.
 * meal_type: "breakfast" | "lunch" | "dinner" | "snack"
 */
export async function logMeal(mealType, description = "") {
  return post("/meals/log", { meal_type: mealType, description });
}

/**
 * Marks a meal as explicitly skipped.
 */
export async function skipMeal(mealType, skipReason = "not_specified") {
  return post("/meals/skip", { meal_type: mealType, skip_reason: skipReason });
}

/**
 * Gets today's meal summary.
 */
export async function getTodayMeals() {
  return get("/meals/today");
}

// ─────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────

export async function checkBackendHealth() {
  return get("/");
}