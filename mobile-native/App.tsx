
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
} from 'react-native';
import { WebView } from 'react-native-webview';

function App(): React.JSX.Element {
  const [hasPermissions, setHasPermissions] = useState(false);

  useEffect(() => {
    const requestPermissions = async () => {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.CAMERA,
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          ]);

          if (
            granted['android.permission.CAMERA'] === PermissionsAndroid.RESULTS.GRANTED &&
            granted['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED
          ) {
            console.log('You can use the camera and mic');
            setHasPermissions(true);
          } else {
            console.log('Camera permission denied');
            // Depending on requirements, we can still show the webview but video calls won't work
            setHasPermissions(true);
          }
        } catch (err) {
          console.warn(err);
          setHasPermissions(true);
        }
      } else {
        setHasPermissions(true);
      }
    };

    requestPermissions();
  }, []);

  if (!hasPermissions) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Requesting Permissions...</Text>
      </View>
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
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        )}
        // Important for Android WebRTC
        userAgent={
          Platform.OS === 'android'
            ? 'Mozilla/5.0 (Linux; Android 10; Android SDK built for x86) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36'
            : undefined
        }
        originWhitelist={['*']}
        onPermissionRequest={(request) => {
          request.grant(request.resources);
        }}
      />
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
