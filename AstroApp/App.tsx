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
    appId: 'c30a45471ca0b5021c65a4358e95e329',
    channel: 'test',
    token: null,
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
