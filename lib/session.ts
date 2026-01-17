/**
 * Session management utilities for tracking user sessions across page reloads
 */

export function generateSessionId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  let sessionId = localStorage.getItem("taboo_session_id");
  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem("taboo_session_id", sessionId);
  }
  return sessionId;
}
