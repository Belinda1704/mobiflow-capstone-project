import { formatAuthIdForDisplay } from './phoneUtils';

// Initials from phone auth id (last 2 digits); login is phone-only.
export function getInitialsFromAuthId(identifier: string): string {
  if (!identifier) return '?';
  if (identifier.endsWith('@mobiflow.phone')) {
    const digits = identifier.replace('@mobiflow.phone', '');
    if (digits.length >= 10) return digits.slice(-2).toUpperCase();
  }
  return '?';
}

// Show auth id as phone number (078 123 4567); login is phone-only.
export function getDisplayLabelFromAuthId(authId: string): string {
  return formatAuthIdForDisplay(authId) || 'User';
}
