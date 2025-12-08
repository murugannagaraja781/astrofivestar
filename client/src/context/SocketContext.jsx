import React, { createContext, useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';

const SocketContext = createContext();

// Initialize socket outside component to prevent multiple connections
const socket = io('http://localhost:8000');

const ContextProvider = ({ children }) => {
  const [stream, setStream] = useState(null);
  const [me, setMe] = useState('');
  const [call, setCall] = useState({});
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [name, setName] = useState('');

  // Chat State
  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState('');

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  useEffect(() => {
    // 1. Get User Media
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
        if (myVideo.current) {
            myVideo.current.srcObject = currentStream;
        }
      });

    // 2. Register Socket Events
    socket.on('me', (id) => setMe(id));

    socket.on('call-user', ({ from, name: callerName, signal }) => {
      setCall({ isReceivingCall: true, from, name: callerName, signal });
    });

    // Listen for incoming messages
    socket.on('message', ({ message: msg, from }) => {
        setChat(prev => [...prev, { from, msg, type: 'received' }]);
    });

  }, []);

  // Update video ref if stream changes (e.g. initial load)
  useEffect(() => {
    if (myVideo.current && stream) {
        myVideo.current.srcObject = stream;
    }
  }, [stream]);

  const answerCall = () => {
    setCallAccepted(true);

    const peer = new Peer({
        initiator: false,
        trickle: false,
        stream,
        config: {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:global.stun.twilio.com:3478' }
            ]
        }
    });

    peer.on('signal', (data) => {
      socket.emit('answer-call', { signal: data, to: call.from, from: me });
    });

    peer.on('stream', (currentStream) => {
      if(userVideo.current) {
          userVideo.current.srcObject = currentStream;
      }
    });

    peer.signal(call.signal);

    connectionRef.current = peer;
  };

  const callUser = (id) => {
    const peer = new Peer({
        initiator: true,
        trickle: false,
        stream,
        config: {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:global.stun.twilio.com:3478' }
            ]
        }
    });

    peer.on('signal', (data) => {
      socket.emit('call-user', { userToCall: id, signalData: data, from: me, name });
    });

    peer.on('stream', (currentStream) => {
        if(userVideo.current) {
            userVideo.current.srcObject = currentStream;
        }
    });

    socket.on('call-accepted', (signal) => {
      setCallAccepted(true);
      peer.signal(signal);
    });

    connectionRef.current = peer;
  };

  const leaveCall = () => {
    setCallEnded(true);
    if(connectionRef.current) {
        connectionRef.current.destroy();
    }
    // Refresh to clear state or complex logic to reset
    window.location.reload();
  };

  const sendMessage = (msg, to) => {
      if(!msg.trim() || !to) return;
      socket.emit('message', { message: msg, to, from: me });
      setChat(prev => [...prev, { from: 'Me', msg, type: 'sent' }]);
  };

  // Join 'Room' - basically identifiying as a specific user ID if needed
  const joinIdentity = (customId) => {
      if(customId) {
          socket.emit('join-room', customId);
          setMe(customId);
      }
  };

  return (
    <SocketContext.Provider value={{
      call,
      callAccepted,
      myVideo,
      userVideo,
      stream,
      name,
      setName,
      callEnded,
      me,
      callUser,
      leaveCall,
      answerCall,
      joinIdentity,
      chat,
      sendMessage
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export { ContextProvider, SocketContext };
