
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
} from 'react-native';
import { WebView } from 'react-native-webview';
import KeepAwake from 'react-native-keep-awake';
import NetInfo from '@react-native-community/netinfo';
import RNBootSplash from 'react-native-bootsplash';
import OfflineNotice from './components/OfflineNotice';

interface WebViewPermissionRequest {
  grant: (resources: string[]) => void;
  deny: () => void;
  resources: string[];
}

function App(): React.JSX.Element {
  const [hasPermissions, setHasPermissions] = useState(false);
  const [keepScreenAwake, setKeepScreenAwake] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(true);

  useEffect(() => {
    const requestPermissions = async () => {
      if (Platform.OS === 'android') {
        try {
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
            console.log('You can use the camera and mic');
            setHasPermissions(true);
            RNBootSplash.hide({ fade: true });
          } else {
            console.log('Camera permission denied');
            // Depending on requirements, we can still show the webview but video calls won't work
            setHasPermissions(true);
            RNBootSplash.hide({ fade: true });
          }
        } catch (err) {
          console.warn(err);
          setHasPermissions(true);
          RNBootSplash.hide({ fade: true });
        }
      } else {
        setHasPermissions(true);
        RNBootSplash.hide({ fade: true });
      }
    };

    requestPermissions();

    // Network connectivity listener
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (!hasPermissions) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Requesting Permissions...</Text>
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <WebView
        source={{ uri: 'https://astro5star.com' }}
        style={styles.webview}
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
              // Vibrate 1s, pause 0.5s, Vibrate 1s
              Vibration.vibrate([0, 1000, 500, 1000]);
            }
            if (data.type === 'KEEP_AWAKE') {
              setKeepScreenAwake(!!data.enable);
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
