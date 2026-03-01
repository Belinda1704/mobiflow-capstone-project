// Starts the SMS listener when the user is logged in and has turned on auto-capture (no UI, just the hook).
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useSmsCapture } from '../hooks/useSmsCapture';

export function SmsCaptureManager() {
  const { userId } = useCurrentUser();
  useSmsCapture(userId);
  return null;
}
