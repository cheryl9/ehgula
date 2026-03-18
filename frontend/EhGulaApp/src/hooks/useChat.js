// src/hooks/useChat.js
//
// Manages chat state, sends messages to the backend,
// and handles the AgentThinking animation steps.
// Used by: ChatScreen
// ─────────────────────────────────────────────

import { useState, useCallback, useRef } from "react";
import { sendChatMessage, clearChatHistory } from "../services/api";
import { useAuth } from "../../App";

const AGENT_THINKING_STEPS = [
  "Reading your health data...",
  "Checking glucose trends...",
  "Reviewing medications...",
  "Reasoning with SEA-LION...",
  "Preparing response...",
];

export function useChat() {
  const { patientId, user } = useAuth();

  const [messages,       setMessages]       = useState([]);
  const [thinking,       setThinking]       = useState(false);
  const [error,          setError]          = useState(null);
  const [pendingBooking, setPendingBooking] = useState(null);
  const [alertLevel,     setAlertLevel]     = useState("normal");
  const [inAppReminders, setInAppReminders] = useState([]);

  // session ID is the auth user ID — stable across the session
  // no need to async-fetch it since we have it from useAuth
  const sessionId = user?.id ?? "default";

  const sendMessage = useCallback(async (text) => {
    if (!text.trim()) return;

    if (!patientId) {
      console.warn("[useChat] patientId not available yet — skipping send");
      return;
    }

    const userMsg = {
      id:      Date.now().toString(),
      message: text.trim(),
      sender:  "patient",
      time:    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages(prev => [...prev, userMsg]);
    setThinking(true);
    setError(null);

    try {
      const result = await sendChatMessage(text.trim(), sessionId, patientId);

      const agentMsg = {
        id:      (Date.now() + 1).toString(),
        message: result.reply,
        sender:  "agent",
        time:    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages(prev => [...prev, agentMsg]);

      if (result.pending_booking)         setPendingBooking(result.pending_booking);
      if (result.alert_level)             setAlertLevel(result.alert_level);
      if (result.in_app_reminders?.length) setInAppReminders(result.in_app_reminders);

    } catch (err) {
      console.error("[useChat] sendMessage error:", err.message);
      setError("Could not reach the health assistant. Please try again.");
    } finally {
      setThinking(false);
    }
  }, [patientId, sessionId]);

  const clearChat = useCallback(async () => {
    await clearChatHistory(sessionId);
    setMessages([]);
    setPendingBooking(null);
    setAlertLevel("normal");
    setInAppReminders([]);
  }, [sessionId]);

  return {
    messages,
    thinking,
    error,
    pendingBooking,
    alertLevel,
    inAppReminders,
    agentThinkingSteps: AGENT_THINKING_STEPS,
    sendMessage,
    clearChat,
  };
}