/**
 * Copies the project’s patched files into node_modules so the build gets readPastSMS etc. without patch-package issues on Windows.
 * Runs after npm install (postinstall).
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

// Copy SMS overrides into the package
const smsOverridesDir = path.join(root, 'patches', 'sms-package-overrides');
const smsPkgDir = path.join(root, 'node_modules', '@maniac-tech', 'react-native-expo-read-sms');

if (fs.existsSync(smsPkgDir)) {
  const copies = [
    { from: path.join(smsOverridesDir, 'index.js'), to: path.join(smsPkgDir, 'index.js') },
    { from: path.join(smsOverridesDir, 'RNExpoReadSmsModule.java'), to: path.join(smsPkgDir, 'android', 'src', 'main', 'java', 'com', 'reactlibrary', 'RNExpoReadSmsModule.java') },
  ];
  for (const { from, to } of copies) {
    if (fs.existsSync(from)) {
      const dir = path.dirname(to);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.copyFileSync(from, to);
    }
  }
  console.log('apply-sms-overrides: applied SMS package overrides (readPastSMS + readPastSentSMS)');
} else {
  console.log('apply-sms-overrides: SMS package not installed, skipping');
}

// Fix jest-expo so tests don't crash on RN 0.81+ (UIManager guard). We edit the file in place.
const jestExpoSetupPath = path.join(root, 'node_modules', 'jest-expo', 'src', 'preset', 'setup.js');
if (fs.existsSync(jestExpoSetupPath)) {
  let content = fs.readFileSync(jestExpoSetupPath, 'utf8');
  const guardedBlock =
    'const unimoduleProxy = mockNativeModules.NativeUnimoduleProxy;\n' +
    'const viewManagersMetadata = unimoduleProxy && unimoduleProxy.viewManagersMetadata;\n' +
    'const uiManager = mockNativeModules.UIManager;\n' +
    'if (\n' +
    '  uiManager &&\n' +
    '  typeof uiManager === \'object\' &&\n' +
    '  viewManagersMetadata &&\n' +
    '  typeof viewManagersMetadata === \'object\'\n' +
    ') {\n' +
    '  Object.keys(viewManagersMetadata).forEach((viewManagerName) => {\n' +
    '    Object.defineProperty(uiManager, `ViewManagerAdapter_${viewManagerName}`, {\n' +
    '      get: () => ({\n' +
    '        NativeProps: {},\n' +
    '        directEventTypes: [],\n' +
    '      }),\n' +
    '    });\n' +
    '  });\n' +
    '}';
  // Match the block with flexible whitespace so it works even if the file format changed a bit
  const originalRegex = /Object\.keys\s*\(\s*mockNativeModules\.NativeUnimoduleProxy\.viewManagersMetadata\s*\)\s*\.forEach\s*\(\s*\(viewManagerName\)\s*=>\s*\{\s*Object\.defineProperty\s*\(\s*mockNativeModules\.UIManager\s*,\s*`ViewManagerAdapter_\$\{viewManagerName\}`\s*,\s*\{\s*get:\s*\(\)\s*=>\s*\(\{\s*NativeProps:\s*\{\}\s*,\s*directEventTypes:\s*\[\]\s*,\s*\}\)\s*,\s*\}\)\s*;\s*\}\s*\)\s*;/;
  if (!content.includes('const unimoduleProxy = mockNativeModules.NativeUnimoduleProxy') && originalRegex.test(content)) {
    content = content.replace(originalRegex, guardedBlock);
    console.log('apply-sms-overrides: applied jest-expo preset fix (UIManager guard)');
  }

  // Remove the Refs mock – that path doesn't exist in expo-modules-core 3.x
  const refsMockExact =
    '// Mock the `createSnapshotFriendlyRef` to return an ref that can be serialized in snapshots.\n' +
    "jest.doMock('expo-modules-core/src/Refs', () => ({\n" +
    '  createSnapshotFriendlyRef: () => {\n' +
    '    // We cannot use `createRef` since it is not extensible.\n' +
    '    const ref = { current: null };\n' +
    '    Object.defineProperty(ref, \'toJSON\', {\n' +
    '      value: () => \'[React.ref]\',\n' +
    '    });\n' +
    '    return ref;\n' +
    '  },\n' +
    '}));\n' +
    '\n';
  if (content.includes("jest.doMock('expo-modules-core/src/Refs'") && !content.includes('(expo-modules-core/src/Refs mock removed')) {
    content = content.replace(refsMockExact, '// Refs mock removed – that path is gone in expo-modules-core 3.x\n\n');
    console.log('apply-sms-overrides: removed jest-expo Refs mock (expo-modules-core/src/Refs not exported)');
  }

  // Add createSnapshotFriendlyRef into the expo-modules-core mock
  const expoReturnWithoutRef = '    return {\n      ...ExpoModulesCore,\n\n      // Use web implementations for the common classes written natively';
  const expoReturnWithRef =
    '    return {\n      ...ExpoModulesCore,\n\n      createSnapshotFriendlyRef: () => {\n        const ref = { current: null };\n        Object.defineProperty(ref, \'toJSON\', { value: () => \'[React.ref]\' });\n        return ref;\n      },\n      // Use web implementations for the common classes written natively';
  if (content.includes(expoReturnWithoutRef) && !content.includes('createSnapshotFriendlyRef: () => {')) {
    content = content.replace(expoReturnWithoutRef, expoReturnWithRef);
    console.log('apply-sms-overrides: inlined createSnapshotFriendlyRef into expo-modules-core mock');
  }

  // Load expo-modules-core web stuff only if it exists (3.x might not export it)
  if (content.includes("require('expo-modules-core/src/web/index.web')") && !content.includes("try { require('expo-modules-core/src/web/index.web')")) {
    content = content.replace(
      /\/\/ Installs web implementations[^\n]*\nrequire\('expo-modules-core\/src\/web\/index\.web'\);/,
      "// Load web implementations if the path exists (3.x might not have it)\ntry { require('expo-modules-core/src/web/index.web'); } catch (_) { /* not exported */ }"
    );
    if (content.includes("try { require('expo-modules-core/src/web/index.web')")) {
      console.log('apply-sms-overrides: made expo-modules-core/src/web/index.web optional');
    }
  }

  fs.writeFileSync(jestExpoSetupPath, content);
}
