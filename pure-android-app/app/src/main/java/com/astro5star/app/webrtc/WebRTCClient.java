package com.astro5star.app.webrtc;

import android.content.Context;
import android.util.Log;
import org.webrtc.*;
import java.util.ArrayList;
import java.util.List;

public class WebRTCClient {

    private static final String TAG = "WebRTCClient";

    private PeerConnectionFactory peerConnectionFactory;
    private PeerConnection peerConnection;
    private AudioTrack localAudioTrack;
    private VideoTrack localVideoTrack;
    private AudioSource audioSource;
    private VideoSource videoSource;

    private WebRTCListener listener;

    public interface WebRTCListener {
        void onLocalDescription(SessionDescription sdp);

        void onIceCandidate(IceCandidate candidate);

        void onAddRemoteStream(MediaStream stream);

        void onConnectionChange(PeerConnection.IceConnectionState state);
    }

    public WebRTCClient(Context context, WebRTCListener listener) {
        this.listener = listener;
        initializePeerConnectionFactory(context);
    }

    private void initializePeerConnectionFactory(Context context) {
        // Initialize WebRTC
        PeerConnectionFactory.InitializationOptions initOptions = PeerConnectionFactory.InitializationOptions
                .builder(context)
                .setEnableInternalTracer(true)
                .createInitializationOptions();
        PeerConnectionFactory.initialize(initOptions);

        // Create PeerConnectionFactory
        PeerConnectionFactory.Options options = new PeerConnectionFactory.Options();
        peerConnectionFactory = PeerConnectionFactory.builder()
                .setOptions(options)
                .createPeerConnectionFactory();

        Log.d(TAG, "PeerConnectionFactory initialized");
    }

    public void createPeerConnection() {
        // ICE servers (STUN/TURN)
        List<PeerConnection.IceServer> iceServers = new ArrayList<>();
        iceServers.add(PeerConnection.IceServer.builder("stun:stun.l.google.com:19302").createIceServer());

        // RTCConfiguration
        PeerConnection.RTCConfiguration rtcConfig = new PeerConnection.RTCConfiguration(iceServers);
        rtcConfig.sdpSemantics = PeerConnection.SdpSemantics.UNIFIED_PLAN;

        // Create PeerConnection
        peerConnection = peerConnectionFactory.createPeerConnection(rtcConfig, new PeerConnectionObserver());

        Log.d(TAG, "PeerConnection created");
    }

    public void createAudioTrack() {
        // Create audio source
        MediaConstraints audioConstraints = new MediaConstraints();
        audioSource = peerConnectionFactory.createAudioSource(audioConstraints);
        localAudioTrack = peerConnectionFactory.createAudioTrack("AUDIO_TRACK", audioSource);
        localAudioTrack.setEnabled(true);

        // Add to peer connection
        if (peerConnection != null) {
            peerConnection.addTrack(localAudioTrack);
        }

        Log.d(TAG, "Audio track created and added");
    }

    public void createVideoTrack(SurfaceViewRenderer localView) {
        // Create video capturer (front camera)
        VideoCapturer videoCapturer = createVideoCapturer();
        if (videoCapturer == null) {
            Log.e(TAG, "Failed to create video capturer");
            return;
        }

        // Create video source
        videoSource = peerConnectionFactory.createVideoSource(videoCapturer.isScreencast());
        videoCapturer.initialize(SurfaceTextureHelper.create("CaptureThread", EglBase.create().getEglBaseContext()),
                localView.getContext(), videoSource.getCapturerObserver());
        videoCapturer.startCapture(1280, 720, 30);

        // Create video track
        localVideoTrack = peerConnectionFactory.createVideoTrack("VIDEO_TRACK", videoSource);
        localVideoTrack.setEnabled(true);
        localVideoTrack.addSink(localView);

        // Add to peer connection
        if (peerConnection != null) {
            peerConnection.addTrack(localVideoTrack);
        }

        Log.d(TAG, "Video track created and added");
    }

    private VideoCapturer createVideoCapturer() {
        Camera2Enumerator enumerator = new Camera2Enumerator(null);
        String[] deviceNames = enumerator.getDeviceNames();

        // Try front camera first
        for (String deviceName : deviceNames) {
            if (enumerator.isFrontFacing(deviceName)) {
                return enumerator.createCapturer(deviceName, null);
            }
        }

        // Fallback to back camera
        for (String deviceName : deviceNames) {
            if (enumerator.isBackFacing(deviceName)) {
                return enumerator.createCapturer(deviceName, null);
            }
        }

        return null;
    }

    public void createOffer() {
        MediaConstraints constraints = new MediaConstraints();
        constraints.mandatory.add(new MediaConstraints.KeyValuePair("OfferToReceiveAudio", "true"));
        constraints.mandatory.add(new MediaConstraints.KeyValuePair("OfferToReceiveVideo", "true"));

        peerConnection.createOffer(new SdpObserver() {
            @Override
            public void onCreateSuccess(SessionDescription sdp) {
                peerConnection.setLocalDescription(new SdpObserver() {
                    @Override
                    public void onSetSuccess() {
                        listener.onLocalDescription(sdp);
                    }

                    @Override
                    public void onSetFailure(String s) {
                        Log.e(TAG, "Set local description failed: " + s);
                    }

                    @Override
                    public void onCreateSuccess(SessionDescription sessionDescription) {
                    }

                    @Override
                    public void onCreateFailure(String s) {
                    }
                }, sdp);
            }

            @Override
            public void onCreateFailure(String s) {
                Log.e(TAG, "Create offer failed: " + s);
            }

            @Override
            public void onSetSuccess() {
            }

            @Override
            public void onSetFailure(String s) {
            }
        }, constraints);
    }

    public void createAnswer() {
        MediaConstraints constraints = new MediaConstraints();
        constraints.mandatory.add(new MediaConstraints.KeyValuePair("OfferToReceiveAudio", "true"));
        constraints.mandatory.add(new MediaConstraints.KeyValuePair("OfferToReceiveVideo", "true"));

        peerConnection.createAnswer(new SdpObserver() {
            @Override
            public void onCreateSuccess(SessionDescription sdp) {
                peerConnection.setLocalDescription(new SdpObserver() {
                    @Override
                    public void onSetSuccess() {
                        listener.onLocalDescription(sdp);
                    }

                    @Override
                    public void onSetFailure(String s) {
                        Log.e(TAG, "Set local description failed: " + s);
                    }

                    @Override
                    public void onCreateSuccess(SessionDescription sessionDescription) {
                    }

                    @Override
                    public void onCreateFailure(String s) {
                    }
                }, sdp);
            }

            @Override
            public void onCreateFailure(String s) {
                Log.e(TAG, "Create answer failed: " + s);
            }

            @Override
            public void onSetSuccess() {
            }

            @Override
            public void onSetFailure(String s) {
            }
        }, constraints);
    }

    public void setRemoteDescription(SessionDescription sdp) {
        peerConnection.setRemoteDescription(new SdpObserver() {
            @Override
            public void onSetSuccess() {
                Log.d(TAG, "Remote description set successfully");
            }

            @Override
            public void onSetFailure(String s) {
                Log.e(TAG, "Set remote description failed: " + s);
            }

            @Override
            public void onCreateSuccess(SessionDescription sessionDescription) {
            }

            @Override
            public void onCreateFailure(String s) {
            }
        }, sdp);
    }

    public void addIceCandidate(IceCandidate candidate) {
        peerConnection.addIceCandidate(candidate);
    }

    public void toggleAudio(boolean enable) {
        if (localAudioTrack != null) {
            localAudioTrack.setEnabled(enable);
        }
    }

    public void toggleVideo(boolean enable) {
        if (localVideoTrack != null) {
            localVideoTrack.setEnabled(enable);
        }
    }

    public void close() {
        if (localAudioTrack != null) {
            localAudioTrack.dispose();
        }
        if (localVideoTrack != null) {
            localVideoTrack.dispose();
        }
        if (audioSource != null) {
            audioSource.dispose();
        }
        if (videoSource != null) {
            videoSource.dispose();
        }
        if (peerConnection != null) {
            peerConnection.close();
        }
        if (peerConnectionFactory != null) {
            peerConnectionFactory.dispose();
        }
    }

    // PeerConnection Observer
    private class PeerConnectionObserver implements PeerConnection.Observer {
        @Override
        public void onIceCandidate(IceCandidate iceCandidate) {
            listener.onIceCandidate(iceCandidate);
        }

        @Override
        public void onAddStream(MediaStream mediaStream) {
            listener.onAddRemoteStream(mediaStream);
        }

        @Override
        public void onIceConnectionChange(PeerConnection.IceConnectionState state) {
            listener.onConnectionChange(state);
        }

        @Override
        public void onSignalingChange(PeerConnection.SignalingState signalingState) {
        }

        @Override
        public void onIceConnectionReceivingChange(boolean b) {
        }

        @Override
        public void onIceGatheringChange(PeerConnection.IceGatheringState iceGatheringState) {
        }

        @Override
        public void onIceCandidatesRemoved(IceCandidate[] iceCandidates) {
        }

        @Override
        public void onRemoveStream(MediaStream mediaStream) {
        }

        @Override
        public void onDataChannel(DataChannel dataChannel) {
        }

        @Override
        public void onRenegotiationNeeded() {
        }

        @Override
        public void onAddTrack(RtpReceiver rtpReceiver, MediaStream[] mediaStreams) {
        }
    }
}
