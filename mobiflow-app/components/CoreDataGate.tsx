/**
 * Simple gate: just renders children.
 * Firebase + hooks handle auth and data; we don't block the UI with a full-screen loader.
 * This matches apps like WhatsApp: splash → main screen, data refreshes in the background.
 */
export function CoreDataGate({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
