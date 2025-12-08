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
    appId: 'a3c27ce672804538b4e78baeaf0687b2',
    channel: 'test',
    token: '007eJxTYLj2uvAu3yr228Xqcl8KVLsn2HpFXedQ+zPL+PWyYkXfDRwKDInGyUbmyalm5kYWBiamxhZJJqnmFkmJqYlpBmYW5klGURZmmQ2BjAzP2EKZGRkgEMRnZEhkYAAApzgcYw==',
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
