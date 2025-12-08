import React, { useContext } from 'react';
import { SocketContext } from '../context/SocketContext';

const Notifications = () => {
  const { call, callAccepted, answerCall } = useContext(SocketContext);

  if (!call.isReceivingCall || callAccepted) return null;

  return (
    <div className="incoming-call-toast">
      <h1>{call.name || call.from} is calling...</h1>
      <button onClick={answerCall} className="answer-btn">
        Answer Call
      </button>
    </div>
  );
};

export default Notifications;
