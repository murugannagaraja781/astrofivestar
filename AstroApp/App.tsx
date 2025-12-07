// @ts-nocheck
import React from 'react';
import AgoraUIKit from 'agora-rn-uikit';
import { SafeAreaView, StatusBar, useColorScheme } from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';

const App = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
    flex: 1,
  };

  const connectionData = {
    appId: 'e7f6e9aeecf14b2ba10e3f40be9f56e7',
    channel: 'test',
    token: null, // enter your channel token as a string
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <AgoraUIKit connectionData={connectionData} />
    </SafeAreaView>
  );
};

export default App;
