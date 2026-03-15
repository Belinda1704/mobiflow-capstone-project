// Show clearer auth error messages to the user (e.g. when token refresh is blocked).
export function getFriendlyAuthErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? '');
  if (
    message.includes('securetoken') &&
    (message.includes('blocked') || message.includes('granttoken'))
  ) {
    return (
      'This usually means your app’s signing key is not registered in Firebase. ' +
      'Add your Android app’s SHA-1 in Firebase Console → Project settings → Your apps → Android → Add fingerprint. ' +
      'Then rebuild and reinstall the app.'
    );
  }
  if (message.includes('auth/network-request-failed')) {
    return 'Network error. Check your connection and try again.';
  }
  if (message.includes('auth/too-many-requests')) {
    return 'Too many attempts. Try again later.';
  }
  return message || 'Something went wrong.';
}
