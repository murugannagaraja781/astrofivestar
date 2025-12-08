import React, { useState } from 'react';
import AgoraUIKit from 'agora-react-uikit';

const App = () => {
    const [videoCall, setVideoCall] = useState(true);

    const rtcProps = {
        appId: 'c30a45471ca0b5021c65a4358e95e329',
        channel: 'test',
        token: null, // If your project is in Secure Mode, you need to generate a token using your App Certificate
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
