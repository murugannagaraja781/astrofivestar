import React, { useContext, useState } from 'react';
import VideoCall from './components/VideoCall';
import Notifications from './components/Notifications';
import ChatWindow from './components/ChatWindow';
import { SocketContext } from './context/SocketContext';

const App = () => {
    const { me, callAccepted, name, setName, callEnded, leaveCall, callUser, joinIdentity } = useContext(SocketContext);
    const [idToCall, setIdToCall] = useState('');
    const [identityInput, setIdentityInput] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const handleLogin = (customId) => {
        const id = customId || identityInput;
        if(id) {
            joinIdentity(id);
            setName(id);
            setIsLoggedIn(true);
        }
    }

    if (!isLoggedIn) {
        return (
            <div className="login-container">
                 <h1>Welcome to AstroFiveStar Call</h1>
                 <div className="card login-card">
                     <h3>Enter your ID to join</h3>
                     <input
                        value={identityInput}
                        onChange={(e) => setIdentityInput(e.target.value)}
                        placeholder="e.g. client1"
                     />
                     <button onClick={() => handleLogin()}>Join</button>

                     <div className="quick-login">
                         <button className="secondary" onClick={() => handleLogin('client1')}>Join as Client1</button>
                         <button className="secondary" onClick={() => handleLogin('admin1')}>Join as Admin1</button>
                     </div>
                 </div>
            </div>
        )
    }

    return (
        <div className="container">
            <header className="header">
                 <h2>AstroFiveStar Video System</h2>
                 <div className="status-badge">Logged in as: {name}</div>
            </header>

            <div className="main-layout">
                {/* Video Section */}
                <div className="video-section">
                    <VideoCall />

                    <Notifications />

                    {/* Controls */}
                    <div className="controls-bar">
                        {callAccepted && !callEnded ? (
                            <button onClick={leaveCall} className="hangup-btn">End Call</button>
                        ) : (
                            <div className="call-input-group">
                                <input
                                    placeholder="ID to Call (e.g. admin1)"
                                    value={idToCall}
                                    onChange={(e) => setIdToCall(e.target.value)}
                                />
                                <button onClick={() => callUser(idToCall)} className="call-btn">Call</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat Section */}
                <div className="chat-section">
                    {/* Only show chat if in call or just always show for demo?
                        Let's show always but require target ID if not in call.
                        Actually, simplified: Use 'idToCall' as target if not in call.
                    */}
                    <ChatWindow targetId={callAccepted && !callEnded ? (me === 'client1' ? 'admin1' : 'client1') : idToCall} />
                    {/* Note: TargetID logic is simplified for demo. In real app, 'call.from' or 'call.to' would be used */}
                </div>
            </div>
        </div>
    );
};

export default App;
