import React, { useEffect, useRef, useState } from "react";
import Peer from "simple-peer";
import io from "socket.io-client";

// Connect to local signaling server
const socket = io.connect("http://localhost:5000");

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

	const myVideo = useRef();
	const userVideo = useRef();
	const connectionRef = useRef();

	useEffect(() => {
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
		const peer = new Peer({
			initiator: true,
			trickle: false,
			stream: stream
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
		const peer = new Peer({
			initiator: false,
			trickle: false,
			stream: stream
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
		<div style={{ padding: '20px', fontFamily: 'Arial' }}>
			<h1 style={{ textAlign: "center", color: '#fff' }}>WebRTC Video Call</h1>

            {/* Registration */}
            {!me && (
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <input
                        placeholder="Enter YOUR ID (e.g. client1)"
                        value={myIdInput}
                        onChange={(e) => setMyIdInput(e.target.value)}
                    />
                    <button onClick={registerUser}>Login</button>
                </div>
            )}

            {me && <h3 style={{ textAlign: 'center', color: 'green' }}>Logged in as: {me}</h3>}

			<div style={{ display: "flex", justifyContent: "center", gap: "20px" }}>
				{/* My Video */}
                <div style={{ width: '400px', height: '300px', background: 'black' }}>
                    {stream &&  <video playsInline muted ref={myVideo} autoPlay style={{ width: "100%", height: '100%' }} />}
                </div>

				{/* Remote Video */}
                <div style={{ width: '400px', height: '300px', background: 'black' }}>
                    {callAccepted && !callEnded ?
					<video playsInline ref={userVideo} autoPlay style={{ width: "100%", height: '100%' }} /> :
                    <div style={{color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%'}}>Waiting for video...</div>}
                </div>
			</div>

            {/* Controls */}
			<div style={{ textAlign: "center", marginTop: "20px" }}>
                {me && (
                    <div>
                        <input
                            placeholder="ID to Call (e.g. admin1)"
                            value={targetIdInput}
                            onChange={(e) => setTargetIdInput(e.target.value)}
                        />
                        <button onClick={() => callUser(targetIdInput)}>Call</button>
                    </div>
                )}

                {/* Incoming Call Notification */}
				{receivingCall && !callAccepted ? (
					<div style={{ marginTop: 20, background: '#f0f0f0', padding: 10, display: 'inline-block' }}>
						<h1>{caller} is calling...</h1>
						<button onClick={answerCall} style={{ background: 'green', color: 'white', padding: '10px 20px' }}>
							Answer
						</button>
					</div>
				) : null}
			</div>
		</div>
	);
}

export default App;
