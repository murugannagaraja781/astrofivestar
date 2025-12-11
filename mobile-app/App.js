import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, SafeAreaView, Platform, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { Camera } from 'expo-camera';
import { useEffect, useState } from 'react';

export default function App() {
    const [hasPermission, setHasPermission] = useState(null);

    useEffect(() => {
        (async () => {
            // Request Camera and Audio permissions on startup
            const cameraStatus = await Camera.requestCameraPermissionsAsync();
            const audioStatus = await Camera.requestMicrophonePermissionsAsync();

            setHasPermission(
                cameraStatus.status === 'granted' && audioStatus.status === 'granted'
            );
        })();
    }, []);

    if (hasPermission === null) {
        return <View style={styles.container}><ActivityIndicator /></View>;
    }

    if (hasPermission === false) {
        // Optional: Render a "Permission Denied" view
        // For now, we proceed anyway, as the WebView might prompt again or user might not use video immediately
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="auto" />
            <WebView
                source={{ uri: 'https://astro5star.com' }}
                style={styles.webview}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                allowsInlineMediaPlayback={true}
                mediaPlaybackRequiresUserAction={false}
                startInLoadingState={true}
                renderLoading={() => <ActivityIndicator size="large" color="#0000ff" style={{ position: 'absolute', top: '50%', left: '50%' }} />}
                // Important for Android WebRTC permissions
                userAgent={Platform.OS === 'android' ? 'Chrome/18.0.1025.166 Mobile Safari/535.19' : ''}
                originWhitelist={['*']}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: Platform.OS === 'android' ? 30 : 0
    },
    webview: {
        flex: 1,
    },
});
