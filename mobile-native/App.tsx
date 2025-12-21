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
import { WebView } from 'react-native-webview';
// @ts-ignore
import PhonePePaymentSDK from 'react-native-phonepe-pg';
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
  const webviewRef = React.useRef<WebView>(null);

  useEffect(() => {
    const setupServices = async () => {
      // Init PhonePe SDK
      PhonePePaymentSDK.init(
        'PRODUCTION',
        'M22LBBWEJKI6A', // Merchant ID
        'FLOW_' + Date.now(),
        true, // Enable Logging
      )
        .then((res: any) => console.log('PhonePe Init:', res))
        .catch((err: any) => console.error('PhonePe Init Error:', err));

      // 0. Check if opened from Notification (Quit State)
      const initialMsg = await messaging().getInitialNotification();
      if (initialMsg?.data?.callId) {
        console.log(
          'App opened from QUIT state via Call Notification:',
          initialMsg.data.callId,
        );
        setInitialUrl(
          `https://astro5star.com?incomingCallId=${initialMsg.data.callId}`,
        );
      }

      // 1. Request Permissions
      if (Platform.OS === 'android') {
        try {
          // Android 13+ Notification Permission
          if (Platform.Version >= 33) {
            await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            );
          }

          const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.CAMERA,
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          ]);

          if (
            granted['android.permission.CAMERA'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
            granted['android.permission.RECORD_AUDIO'] ===
            PermissionsAndroid.RESULTS.GRANTED
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
        console.error('FCM Error:', error);
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
        },
      });

      Vibration.vibrate([0, 500, 200, 500]); // Vibrate
    });

    const netUnsub = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });

    // Deep Link Handler
    const handleDeepLink = (event: { url: string }) => {
      console.log('Deep Link received:', event.url);
      if (
        event.url.includes('payment_status') ||
        event.url.includes('astro5star')
      ) {
        // Extract status or just force refresh
        // Inject JS to refresh wallet
        const refreshJS = `
          (function() {
            if (window.fetchTransactionHistory) window.fetchTransactionHistory();
            if (window.socket && window.state && window.state.me) {
               window.socket.emit('get-wallet', { userId: window.state.me.userId });
            }
            alert("Payment Verified! Wallet Updating...");
          })();
          true;
        `;
        webviewRef.current?.injectJavaScript(refreshJS);
      }
    };
    const linkingUnsub = Linking.addEventListener('url', handleDeepLink);

    // Check if app was launched by deep link
    Linking.getInitialURL().then(url => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      unsubscribe();
      netUnsub();
      linkingUnsub.remove();
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
    window.localStorage.setItem('fcmToken', '${fcmToken || ''}');
    console.log("FCM Token Injected:", '${fcmToken || ''}');
    true;
  `;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <WebView
        ref={webviewRef}
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
        // @ts-ignore
        onPermissionRequest={(request: WebViewPermissionRequest) => {
          request.grant(request.resources);
        }}
        onShouldStartLoadWithRequest={(request) => {
          const url = request.url;
          // Handle External Payment Apps
          if (
            url.startsWith('phonepe://') ||
            url.startsWith('tez://') ||
            url.startsWith('paytmmp://') ||
            url.startsWith('upi://') ||
            url.startsWith('intent://')
          ) {
            Linking.openURL(url).catch(err => {
              console.log("Could not open external app:", err);
            });
            return false; // Prevent WebView from loading this
          }
          return true;
        }}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'VIBRATE') Vibration.vibrate([0, 1000, 500, 1000]);
            if (data.type === 'KEEP_AWAKE') setKeepScreenAwake(!!data.enable);
            if (data.type === 'OPEN_EXTERNAL') Linking.openURL(data.url).catch(() => { });
          } catch (e) { }
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
