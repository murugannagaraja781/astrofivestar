
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  StatusBar,
  PermissionsAndroid,
  Platform,
  View,
  ActivityIndicator,
  Text,
  Vibration,
  Linking,
  Alert,
  AppState,
} from 'react-native';
// @ts-ignore
import UpiPayment from 'react-native-upi-payment';
import { WebView } from 'react-native-webview';
import KeepAwake from 'react-native-keep-awake';
import NetInfo from '@react-native-community/netinfo';
import RNBootSplash from 'react-native-bootsplash';
import notifee, { AndroidImportance } from '@notifee/react-native';
import OfflineNotice from './components/OfflineNotice';

import messaging from '@react-native-firebase/messaging';

// Handler for Background/Quit State Messages
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Message handled in the background!', remoteMessage);
  // Optional: Wake up logic here if needed (e.g., Invoke App)
});

interface WebViewPermissionRequest {
  grant: (resources: string[]) => void;
  deny: () => void;
  resources: string[];
}

function App(): React.JSX.Element {
  const [hasPermissions, setHasPermissions] = useState(false);
  const [keepScreenAwake, setKeepScreenAwake] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  const [initialUrl, setInitialUrl] = useState('https://astro5star.com');

  useEffect(() => {
    const setupServices = async () => {
      // 0. Check if opened from Notification (Quit State)
      const initialMsg = await messaging().getInitialNotification();
      if (initialMsg?.data?.callId) {
        console.log('App opened from QUIT state via Call Notification:', initialMsg.data.callId);
        setInitialUrl(`https://astro5star.com?incomingCallId=${initialMsg.data.callId}`);
      }

      // 1. Request Permissions
      if (Platform.OS === 'android') {
        try {
          // Android 13+ Notification Permission
          if (Platform.Version >= 33) {
            await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
          }

          const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.CAMERA,
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          ]);

          if (
            granted['android.permission.CAMERA'] === PermissionsAndroid.RESULTS.GRANTED &&
            granted['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED
          ) {
            setHasPermissions(true);
          } else {
            console.log('Camera permission denied');
            setHasPermissions(true); // Allow anyway, but video might fail
          }
        } catch (err) {
          console.warn(err);
          setHasPermissions(true);
        }
      } else {
        setHasPermissions(true);
      }
      RNBootSplash.hide({ fade: true });

      // 2. Setup FCM
      try {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          const token = await messaging().getToken();
          console.log('FCM Token:', token);
          setFcmToken(token);
        }
      } catch (error) {
        console.error("FCM Error:", error);
      }

      // 3. Start Forensic Service (Keep Alive)
      const channelId = await notifee.createChannel({
        id: 'persistent_service',
        name: 'Background Service',
        importance: AndroidImportance.HIGH,
      });

      await notifee.displayNotification({
        title: 'Astro 5 Star is Running',
        body: 'Ready for incoming calls.',
        android: {
          channelId,
          asForegroundService: true,
          ongoing: true,
          pressAction: { id: 'default' },
        },
      });
    };

    setupServices();

    // Foreground Message Listener
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('A new FCM message arrived!', remoteMessage);
      // Show Local Notification (Simulate incoming call screen)
      // For now, Notifee handles this via the data payload if configured,
      // or we can explicitly display a "Heads Up" notification here.

      await notifee.displayNotification({
        title: remoteMessage.notification?.title || 'Incoming Call',
        body: remoteMessage.notification?.body || 'Tap to answer',
        android: {
          channelId: 'persistent_service', // Use existing channel
          importance: AndroidImportance.HIGH,
          pressAction: { id: 'default' },
          fullScreenAction: { id: 'default', launchActivity: 'default' }, // Attempt to wake
        }
      });

      Vibration.vibrate([0, 500, 200, 500]); // Vibrate
    });

    const netUnsub = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });

    return () => {
      unsubscribe();
      netUnsub();
    };
  }, []);

  if (!hasPermissions) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Initializing...</Text>
      </View>
    );
  }

  if (isConnected === false) {
    return (
      <OfflineNotice
        onRetry={() => {
          NetInfo.fetch().then(state => setIsConnected(state.isConnected));
        }}
      />
    );
  }

  // Inject Token into WebView
  const injectedJS = `
    window.localStorage.setItem('fcmToken', '${fcmToken || ""}');
    console.log("FCM Token Injected:", '${fcmToken || ""}');
    true;
  `;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <WebView
        source={{ uri: initialUrl }}
        style={styles.webview}
        injectedJavaScript={injectedJS}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowFileAccess={true}
        allowFileAccessFromFileURLs={true}
        allowUniversalAccessFromFileURLs={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        )}
        mediaCapturePermissionGrantType="grant"
        originWhitelist={['*']}
        onPermissionRequest={(request: WebViewPermissionRequest) => {
          request.grant(request.resources);
        }}
        onMessage={(event) => {
          try {
            // Handle messages from Web
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'VIBRATE') {
              Vibration.vibrate([0, 1000, 500, 1000]);
            }
            if (data.type === 'KEEP_AWAKE') {
              setKeepScreenAwake(!!data.enable);
            }
            if (data.type === 'UPI_PAY') {
              // Native UPI Intent (Deep Link) - Using strict library as requested
              // UpiPayment.initializePayment(config, success, failure)
              const txnRef = 'TXN_' + Date.now();
              UpiPayment.initializePayment(
                {
                  vpa: 'abinash990@federal', // As requested
                  payeeName: 'Astro5star',
                  amount: String(data.amount),
                  transactionRef: txnRef,
                },
                (successData: any) => {
                  console.log('UPI SUCCESS', successData);
                  // Optionally verify with backend here
                },
                (failureData: any) => {
                  console.log('UPI FAILED', failureData);
                }
              );
            }
          } catch (e) {
            console.log('WebView Message Error', e);
          }
        }}
      />
      {keepScreenAwake && <KeepAwake />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
});

export default App;
