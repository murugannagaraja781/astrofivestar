import React, { useContext } from 'react';
import { SocketContext } from '../context/SocketContext';
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash } from 'react-icons/fa';

const VideoCall = () => {
  const { name, callAccepted, myVideo, userVideo, callEnded, stream, call, me } = useContext(SocketContext);

  // Mute/Unmute Logic
  const toggleMute = () => {
      // Implement track muting
      const audioTrack = stream.getAudioTracks()[0];
      if(audioTrack) audioTrack.enabled = !audioTrack.enabled;
  };

  const toggleVideo = () => {
      const videoTrack = stream.getVideoTracks()[0];
      if(videoTrack) videoTrack.enabled = !videoTrack.enabled;
  }

  return (
    <div className="video-grid">
      {/* My Video */}
      {stream && (
        <div className="video-wrapper">
          <div className="video-label">{name || me || 'Me'}</div>
          <video playsInline muted ref={myVideo} autoPlay className="video-player" />
          <div className="video-controls-overlay">
             {/* Add simple icons here if needed, or put them in a main control bar */}
          </div>
        </div>
      )}

      {/* User's Video */}
      {callAccepted && !callEnded && (
        <div className="video-wrapper">
          <div className="video-label">{call.name || 'Remote User'}</div>
          <video playsInline ref={userVideo} autoPlay className="video-player" />
        </div>
      )}
    </div>
  );
};

export default VideoCall;
