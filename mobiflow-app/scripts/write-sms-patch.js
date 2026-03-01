const fs = require('fs');
const path = require('path');

const patchesDir = path.join(__dirname, '..', 'patches');
const patchPath = path.join(patchesDir, '@maniac-tech+react-native-expo-read-sms+9.0.2-alpha.patch');

// Path has to be relative to app root so patch-package can find the file
const packagePath = 'node_modules/@maniac-tech/react-native-expo-read-sms/index.js';
const patch = [
  `diff --git a/${packagePath} b/${packagePath}`,
  `--- a/${packagePath}`,
  `+++ b/${packagePath}`,
  '@@ -136,5 +136,20 @@ export function stopReadSMS() {',
  ' export function stopReadSMS() {',
  '   if (Platform.OS === "android") {',
  '     RNExpoReadSms.stopReadSMS();',
  '   }',
  ' }',
  '+',
  '+export function readPastSMS(limit = 500) {',
  '+  if (Platform.OS !== "android" || !RNExpoReadSms || typeof RNExpoReadSms.readPastSMS !== "function") {',
  '+    return Promise.reject(new Error("readPastSMS is only available on Android with native module"));',
  '+  }',
  '+  const capped = Math.min(5000, Math.max(1, limit));',
  '+  return RNExpoReadSms.readPastSMS(capped);',
  '+}',
  '+export function readPastSentSMS(limit = 500) {',
  '+  if (Platform.OS !== "android" || !RNExpoReadSms || typeof RNExpoReadSms.readPastSentSMS !== "function") {',
  '+    return Promise.reject(new Error("readPastSentSMS is only available on Android with native module"));',
  '+  }',
  '+  const capped = Math.min(5000, Math.max(1, limit));',
  '+  return RNExpoReadSms.readPastSentSMS(capped);',
  '+}',
].join('\n');

if (!fs.existsSync(patchesDir)) fs.mkdirSync(patchesDir, { recursive: true });
fs.writeFileSync(patchPath, patch, 'utf8');
console.log('Patch written with LF to', patchPath);
