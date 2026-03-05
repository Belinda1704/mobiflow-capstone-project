// Set Notifee service type to dataSync in Android manifest so SMS capture works on Android 14+
const { withAndroidManifest } = require('@expo/config-plugins');

const NOTIFEE_SERVICE_NAME = 'app.notifee.core.ForegroundService';
const FOREGROUND_SERVICE_TYPE = 'dataSync';

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

function withNotifeeDataSyncService(config) {
  return withAndroidManifest(config, (config) => {
    config.modResults = setNotifeeForegroundServiceType(config.modResults);
    return config;
  });
}

module.exports = withNotifeeDataSyncService;
