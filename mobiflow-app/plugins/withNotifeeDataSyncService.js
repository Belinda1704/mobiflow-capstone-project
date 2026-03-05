/**
 * Expo config plugin: set Notifee ForegroundService to use dataSync so that
 * startSmsForegroundService() does not crash (manifest type must match JS).
 * Required for Android 14+ when using foregroundServiceTypes: [DATA_SYNC].
 */
const { withAndroidManifest } = require('@expo/config-plugins');

// Notifee's service name in the Android manifest; we set its type to dataSync
const NOTIFEE_SERVICE_NAME = 'app.notifee.core.ForegroundService';
const FOREGROUND_SERVICE_TYPE = 'dataSync';

// Walks the manifest and sets (or adds) the Notifee service with foregroundServiceType dataSync
function setNotifeeForegroundServiceType(androidManifest) {
  const application = androidManifest.manifest?.application?.[0];
  if (!application) return androidManifest;

  const services = application.service || [];
  let found = false;
  for (const svc of services) {
    const attrs = svc.$ || {};
    if (attrs['android:name'] === NOTIFEE_SERVICE_NAME) {
      attrs['android:foregroundServiceType'] = FOREGROUND_SERVICE_TYPE;
      found = true;
      break;
    }
  }
  if (!found) {
    application.service = services;
    application.service.push({
      $: {
        'android:name': NOTIFEE_SERVICE_NAME,
        'android:foregroundServiceType': FOREGROUND_SERVICE_TYPE,
        'android:exported': 'false',
      },
    });
  }
  return androidManifest;
}

// Expo plugin entry: runs our manifest changes when building the Android app
function withNotifeeDataSyncService(config) {
  return withAndroidManifest(config, (config) => {
    config.modResults = setNotifeeForegroundServiceType(config.modResults);
    return config;
  });
}

module.exports = withNotifeeDataSyncService;
