// Console logs for auth debugging (set false to turn off).
const AUTH_TRACE_ENABLED = true;

function ts(): string {
  return new Date().toISOString();
}

export function authTrace(message: string, data?: Record<string, unknown>): void {
  if (!AUTH_TRACE_ENABLED) return;
  if (data) {
    console.log(`[AuthTrace][${ts()}] ${message}`, data);
    return;
  }
  console.log(`[AuthTrace][${ts()}] ${message}`);
}

