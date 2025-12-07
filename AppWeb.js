import React, { useState } from 'react';
import AgoraUIKit from 'agora-react-uikit';

const App = () => {
    const [videoCall, setVideoCall] = useState(true);

    const rtcProps = {
        appId: 'e7f6e9aeecf14b2ba10e3f40be9f56e7',
        channel: 'test',
        token: null, // enter your channel token as a string if using tokens
    };

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
