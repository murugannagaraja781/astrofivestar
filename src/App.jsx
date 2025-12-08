import React, { useState } from 'react';
import AgoraUIKit from 'agora-react-uikit';

const App = () => {
    const [videoCall, setVideoCall] = useState(true);

    const rtcProps = {
        appId: 'a3c27ce672804538b4e78baeaf0687b2',
        channel: 'test',
        token: '007eJxTYLj2uvAu3yr228Xqcl8KVLsn2HpFXedQ+zPL+PWyYkXfDRwKDInGyUbmyalm5kYWBiamxhZJJqnmFkmJqYlpBmYW5klGURZmmQ2BjAzP2EKZGRkgEMRnZEhkYAAApzgcYw==',
    };

    console.log("DEBUG: Using App ID:", rtcProps.appId);
    console.log("DEBUG: Using Token:", rtcProps.token);

    const callbacks = {
        EndCall: () => setVideoCall(false),
    };

    return videoCall ? (
        <div style={{ display: 'flex', width: '100vw', height: '100vh' }}>
            <AgoraUIKit rtcProps={rtcProps} callbacks={callbacks} />
        </div>
    ) : (
        <div style={{ padding: 20 }}>
            <h3 onClick={() => setVideoCall(true)} style={{ cursor: 'pointer' }}>
                Start Call
            </h3>
        </div>
    );
};

export default App;
