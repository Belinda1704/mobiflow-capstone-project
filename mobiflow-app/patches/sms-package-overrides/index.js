import {
  NativeEventEmitter,
  NativeModules,
  PermissionsAndroid,
  Platform,
} from "react-native";

const { RNExpoReadSms } = NativeModules;

export default RNExpoReadSms;

export async function startReadSMS(callback) {
  let resultFun = (status, sms, error) => {
    if (callback) {
      callback(status, sms, error);
    }
  };
  if (Platform.OS === "android") {
    const hasPermission = await checkIfHasSMSPermission();
    if (hasPermission && hasPermission.hasReceiveSmsPermission && hasPermission.hasReadSmsPermission) {
      RNExpoReadSms.startReadSMS(
        (result) => {
          new NativeEventEmitter(RNExpoReadSms).addListener(
            "received_sms",
            (sms) => {
              resultFun("success", sms);
            }
          );
        },
        (error) => {
          resultFun("error", "", error);
        }
      );
    } else {
      resultFun("error", "", "Required RECEIVE_SMS and READ_SMS permission");
    }
  } else {
    resultFun("error", "", "ReadSms Plugin is only for android platform");
  }
}

// Check RECEIVE_SMS and READ_SMS on Android; older API assumes granted.
export const checkIfHasSMSPermission = async () => {
  if (Platform.OS === "android" && Platform.Version < 23) {
    return {
      hasReceiveSmsPermission: true,
      hasReadSmsPermission: true,
    };
  }

  try {
    const [hasReceiveSmsPermission, hasReadSmsPermission] = await Promise.all([
      PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECEIVE_SMS),
      PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_SMS),
    ]);
  
    return {
      hasReceiveSmsPermission,
      hasReadSmsPermission,
    };
  } catch (error) {
    console.warn("Something went wrong when checking permission", error);
    return {
      hasReceiveSmsPermission: false,
      hasReadSmsPermission: false,
    };
  }
};

// Request RECEIVE_SMS and READ_SMS on Android; returns true if granted.
export async function requestReadSMSPermission() {
  if (Platform.OS === "android") {
    try {
      const hasPermission = await checkIfHasSMSPermission();
      if (hasPermission.hasReadSmsPermission && hasPermission.hasReceiveSmsPermission) {
        return true;
      }

      const status = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
        PermissionsAndroid.PERMISSIONS.READ_SMS,
      ]);

      const read = status[PermissionsAndroid.PERMISSIONS.READ_SMS];
      const receive = status[PermissionsAndroid.PERMISSIONS.RECEIVE_SMS];
      const granted = PermissionsAndroid.RESULTS.GRANTED;
      if (read === granted && receive === granted) return true;
      if (read === PermissionsAndroid.RESULTS.DENIED || receive === PermissionsAndroid.RESULTS.DENIED) {
        console.log("Read Sms permission denied by user.", status);
      } else if (read === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN || receive === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        console.log("Read Sms permission revoked by user.", status);
      }

      return false;
    } catch (error) {
      console.error("Error requesting SMS permissions", error);
      return false;
    }
  }
  return true;
}

export function stopReadSMS() {
  if (Platform.OS === "android") {
    RNExpoReadSms.stopReadSMS();
  }
}

export function readPastSMS(limit = 500) {
  if (Platform.OS !== "android" || !RNExpoReadSms || typeof RNExpoReadSms.readPastSMS !== "function") {
    return Promise.reject(new Error("readPastSMS is only available on Android with native module"));
  }
  const capped = Math.min(5000, Math.max(1, limit));
  return RNExpoReadSms.readPastSMS(capped);
}

export function readPastSentSMS(limit = 500) {
  if (Platform.OS !== "android" || !RNExpoReadSms || typeof RNExpoReadSms.readPastSentSMS !== "function") {
    return Promise.reject(new Error("readPastSentSMS is only available on Android with native module"));
  }
  const capped = Math.min(5000, Math.max(1, limit));
  return RNExpoReadSms.readPastSentSMS(capped);
}
