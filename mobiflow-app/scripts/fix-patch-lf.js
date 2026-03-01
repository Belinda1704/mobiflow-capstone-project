const fs = require('fs');
const path = require('path');
const patchPath = path.join(__dirname, '..', 'patches', '@maniac-tech+react-native-expo-read-sms+9.0.2-alpha.patch');
let content = fs.readFileSync(patchPath, 'utf8');
content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
fs.writeFileSync(patchPath, content, 'utf8');
console.log('Patch file converted to LF line endings.');
