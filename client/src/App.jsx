import React, { useEffect, useRef, useState } from "react";
import Peer from "simple-peer";
import io from "socket.io-client";

// Connect to local signaling server
const socket = io.connect("http://localhost:8000");
// const socket = io.connect("https://astrofivestar-production.up.railway.app");

function App() {
	const [me, setMe] = useState("");
	const [myIdInput, setMyIdInput] = useState("");
    const [targetIdInput, setTargetIdInput] = useState("");

	const [stream, setStream] = useState();
	const [receivingCall, setReceivingCall] = useState(false);
	const [caller, setCaller] = useState("");
	const [callerSignal, setCallerSignal] = useState();
	const [callAccepted, setCallAccepted] = useState(false);
	const [idToCall, setIdToCall] = useState("");
	const [callEnded, setCallEnded] = useState(false);
	const [name, setName] = useState("");
    const [socketConnected, setSocketConnected] = useState(false);

	const myVideo = useRef();
	const userVideo = useRef();
	const connectionRef = useRef();

	useEffect(() => {
        // Socket connection listeners
        socket.on("connect", () => {
            console.log("Connected to server");
            setSocketConnected(true);
        });
        socket.on("disconnect", () => {
             console.log("Disconnected from server");
             setSocketConnected(false);
        });

        // Get media stream
		navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
			setStream(stream);
			if (myVideo.current) {
                myVideo.current.srcObject = stream;
            }
		});

        socket.on("registered", (id) => {
            setMe(id);
        });

		socket.on("callUser", (data) => {
			setReceivingCall(true);
			setCaller(data.from);
			setName(data.name);
			setCallerSignal(data.signal);
		});
	}, []);

    const registerUser = () => {
        if(myIdInput) {
            socket.emit("register", myIdInput);
        }
    }

	const callUser = (id) => {
        setCallEnded(false);
		const peer = new Peer({
			initiator: true,
			trickle: false,
			stream: stream,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:global.stun.twilio.com:3478' }
                ]
            }
		});

		peer.on("signal", (data) => {
			socket.emit("callUser", {
				userToCall: id,
				signalData: data,
				from: me,
				name: me
			});
		});

		peer.on("stream", (stream) => {
			if (userVideo.current) {
                userVideo.current.srcObject = stream;
            }
		});

		socket.on("callAccepted", (signal) => {
			setCallAccepted(true);
			peer.signal(signal);
		});

		connectionRef.current = peer;
	};

	const answerCall = () => {
		setCallAccepted(true);
        setCallEnded(false);
		const peer = new Peer({
			initiator: false,
			trickle: false,
			stream: stream,
            config: {
                iceServers: [
                     { urls: 'stun:stun.l.google.com:19302' },
                     { urls: 'stun:global.stun.twilio.com:3478' }
                ]
            }
		});

		peer.on("signal", (data) => {
			socket.emit("answerCall", { signal: data, to: caller });
		});

		peer.on("stream", (stream) => {
			if (userVideo.current) {
                userVideo.current.srcObject = stream;
            }
		});

		peer.signal(callerSignal);
		connectionRef.current = peer;
	};

	const leaveCall = () => {
		setCallEnded(true);
		connectionRef.current.destroy();
	};

	return (
		<div className="container">
			<header className="header">
				<h1 className="title">AstroFiveStar Video</h1>
                <div style={{marginTop: '10px'}}>
                     {socketConnected ?
                        <span style={{color: '#4CAF50', background: 'rgba(76, 175, 80, 0.1)', padding: '5px 10px', borderRadius: '15px', fontSize: '12px'}}>● Server Connected</span> :
                        <span style={{color: '#FF5252', background: 'rgba(255, 82, 82, 0.1)', padding: '5px 10px', borderRadius: '15px', fontSize: '12px'}}>● Server Disconnected (Localhost)</span>
                     }
                </div>
			</header>

			<div className="card">
				{/* Login Section */}
				{!me ? (
					<div className="input-group">
						<input
							placeholder="Your ID (e.g. client1)"
							value={myIdInput}
							onChange={(e) => setMyIdInput(e.target.value)}
						/>
						<button onClick={registerUser}>Connect</button>
                        {/* Quick Login Helpers */}
                        <div style={{display: 'flex', gap: '5px', justifyContent: 'center', marginTop: '5px'}}>
                             <button className="secondary" style={{fontSize: '12px', padding: '5px 10px'}} onClick={() => {setMyIdInput("client1");}}>Use client1</button>
                             <button className="secondary" style={{fontSize: '12px', padding: '5px 10px'}} onClick={() => {setMyIdInput("admin1");}}>Use admin1</button>
                        </div>
					</div>
				) : (
                    <div style={{width: '100%', textAlign: 'center'}}>
                        <span className="status-badge">Online as: {me}</span>
                    </div>
                )}

				{/* Video Area - Side by Side View */}
				<div className="video-grid">
                    {/* My Video (Always visible for preview) */}
                    {stream && (
                        <div className="video-wrapper">
                            <div className="video-label">Me ({me || 'Connecting...'})</div>
                            <video playsInline muted ref={myVideo} autoPlay />
                        </div>
                    )}

                    {/* Remote Video (Visible when call active) */}
					{callAccepted && !callEnded && (
                        <div className="video-wrapper">
                             <div className="video-label">{name || 'Remote User'}</div>
						     <video playsInline ref={userVideo} autoPlay />
                        </div>
					)}
				</div>

                {/* Call Controls */}
                {me && (
                    <div className="controls">
                        {callAccepted && !callEnded ? (
                            <button onClick={leaveCall} style={{ background: '#ff4b4b', color: 'white' }}>
                                End Call
                            </button>
                        ) : (
                            <div className="input-group">
                                <input
                                    placeholder="ID to Call (e.g. admin1)"
                                    value={targetIdInput}
                                    onChange={(e) => setTargetIdInput(e.target.value)}
                                />
                                <button onClick={() => callUser(targetIdInput)}>Call</button>
                            </div>
                        )}
                    </div>
                )}
			</div>

			{/* Incoming Call Notification - Always visible if receiving */}
			{receivingCall && !callAccepted && (
				<div className="incoming-call">
					<h3 style={{margin: 0, color: '#4facfe'}}>{caller} is calling...</h3>
					<div style={{display: 'flex', gap: '10px'}}>
						<button onClick={answerCall}>Answer Video</button>
                        <button className="secondary" onClick={() => setReceivingCall(false)}>Decline</button>
					</div>
				</div>
			)}
		</div>
	);
}

export default App;
