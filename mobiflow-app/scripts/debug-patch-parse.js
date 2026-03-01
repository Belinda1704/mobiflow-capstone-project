const fs = require('fs');
const path = require('path');

const patchPath = path.join(__dirname, '..', 'patches', '@maniac-tech+react-native-expo-read-sms+9.0.2-alpha.patch');
if (!fs.existsSync(patchPath)) {
  console.log('No patch file - create it first with write-sms-patch.js');
  process.exit(1);
}

const file = fs.readFileSync(patchPath, 'utf8');
const lines = file.split(/\n/g);
if (lines[lines.length - 1] === '') lines.pop();

console.log('Total lines:', lines.length);
console.log('First 5 lines:', lines.slice(0, 5));

// Find where the hunk starts (@@)
let inHunk = false;
let originalLength = 0, patchedLength = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.startsWith('@@')) {
    const match = line.trim().match(/^@@ -(\d+)(,(\d+))? \+(\d+)(,(\d+))? @@/);
    if (match) {
      console.log('Hunk header:', match[0], '-> original length', match[3] || 1, 'patched length', match[6] || 1);
    }
    inHunk = true;
    originalLength = 0;
    patchedLength = 0;
    continue;
  }
  if (!inHunk) continue;
  const first = line[0];
  if (first === ' ') {
    originalLength++;
    patchedLength++;
  } else if (first === '-') {
    originalLength++;
  } else if (first === '+') {
    patchedLength++;
  } else if (first === '\\') {
    // Backslash line, skip
  } else {
    console.log('Unexpected line type at', i, JSON.stringify(line.slice(0, 30)));
  }
}

console.log('Computed originalLength:', originalLength, 'patchedLength:', patchedLength);
console.log('Expected from header: original 6, patched 19');
console.log('Match:', originalLength === 6 && patchedLength === 19 ? 'YES' : 'NO');
