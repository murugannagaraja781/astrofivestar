package com.astro5star.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.os.Handler;
import android.util.Log;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.astro5star.app.webrtc.WebRTCClient;
import com.astro5star.app.utils.BillingManager;
import com.google.android.material.floatingactionbutton.FloatingActionButton;
import io.socket.client.Ack;
import io.socket.client.IO;
import io.socket.client.Socket;
import io.socket.emitter.Emitter;
import org.json.JSONException;
import org.json.JSONObject;
import org.webrtc.IceCandidate;
import org.webrtc.MediaStream;
import org.webrtc.PeerConnection;
import org.webrtc.SessionDescription;
import org.webrtc.SurfaceViewRenderer;
import java.net.URISyntaxException;

public class CallActivity extends AppCompatActivity implements WebRTCClient.WebRTCListener {

    private static final String TAG = "CallActivity";
    private static final String SOCKET_URL = "https://astro5star.com";
    private static final int PERMISSION_REQUEST_CODE = 1001;

    private LinearLayout layoutIncoming, layoutActiveCall;
    private TextView tvCallerName, tvStatus, tvTimer;
    private FloatingActionButton fabAnswer, fabReject, fabEndCall, fabMute, fabVideo;
    private SurfaceViewRenderer localVideoView, remoteVideoView;

    private Socket mSocket;
    private WebRTCClient webRTCClient;
    private BillingManager billingManager;

    private String myUserId;
    private String partnerId;
    private String callType = "audio"; // or video
    private String activeSessionId;
    private int pricePerMinute = 100; // Get from partner data

    private boolean isIncoming = false;
    private boolean isMuted = false;
    private boolean isVideoEnabled = false;

    private long startTime = 0;
    private Handler timerHandler = new Handler();
    private Runnable timerRunnable = new Runnable() {
        @Override
        public void run() {
            long millis = System.currentTimeMillis() - startTime;
            int seconds = (int) (millis / 1000);
            int minutes = seconds / 60;
            seconds = seconds % 60;
            tvTimer.setText(String.format("%02d:%02d", minutes, seconds));
            timerHandler.postDelayed(this, 500);
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_call);

        // ✅ Get real userId from SharedPreferences
        android.content.SharedPreferences prefs = getSharedPreferences("APP_PREFS", MODE_PRIVATE);
        myUserId = prefs.getString("USER_ID", "");

        if (myUserId == null || myUserId.isEmpty()) {
            Toast.makeText(this, "Session expired. Please login again", Toast.LENGTH_LONG).show();
            finish();
            return;
        }

        android.util.Log.d(TAG, "✅ CallActivity userId: " + myUserId);

        partnerId = getIntent().getStringExtra("PARTNER_ID");
        isIncoming = getIntent().getBooleanExtra("IS_INCOMING", false);
        callType = getIntent().getStringExtra("CALL_TYPE") != null ? getIntent().getStringExtra("CALL_TYPE") : "audio";
        activeSessionId = getIntent().getStringExtra("SESSION_ID"); // For incoming calls

        initViews();
        checkPermissions();
        initSocket();
        initWebRTC();

        if (isIncoming) {
            // ✅ Astrologer already accepted in IncomingRequestActivity
            // Show "Connecting..." and wait for WebRTC offer from client
            showConnectingUI();
        } else {
            showOutgoingUI();
        }

        setupClickListeners();
    }

    private void showConnectingUI() {
        // ✅ For incoming (astrologer side) - already accepted, waiting for WebRTC
        layoutIncoming.setVisibility(View.GONE);
        layoutActiveCall.setVisibility(View.VISIBLE);
        tvStatus.setText("Connecting...");
        tvCallerName.setText(getIntent().getStringExtra("PARTNER_NAME"));
        android.util.Log.d(TAG, "📞 Waiting for WebRTC offer from client");
    }

    private void initViews() {
        layoutIncoming = findViewById(R.id.layoutIncoming);
        layoutActiveCall = findViewById(R.id.layoutActiveCall);
        tvCallerName = findViewById(R.id.tvCallerName);
        tvStatus = findViewById(R.id.tvStatus);
        tvTimer = findViewById(R.id.tvTimer);
        fabAnswer = findViewById(R.id.fabAnswer);
        fabReject = findViewById(R.id.fabReject);
        fabEndCall = findViewById(R.id.fabEndCall);
        fabMute = findViewById(R.id.fabMute);
        fabVideo = findViewById(R.id.fabVideo);
        localVideoView = findViewById(R.id.localVideoView);
        remoteVideoView = findViewById(R.id.remoteVideoView);

        if ("video".equals(callType)) {
            fabVideo.setVisibility(View.VISIBLE);
        }
    }

    private void setupClickListeners() {
        fabAnswer.setOnClickListener(v -> answerCall());
        fabReject.setOnClickListener(v -> endCall());
        fabEndCall.setOnClickListener(v -> endCall());
        fabMute.setOnClickListener(v -> toggleMute());
        fabVideo.setOnClickListener(v -> toggleVideo());
    }

    private void checkPermissions() {
        String[] permissions = { Manifest.permission.RECORD_AUDIO };
        if ("video".equals(callType)) {
            permissions = new String[] { Manifest.permission.RECORD_AUDIO, Manifest.permission.CAMERA };
        }

        boolean allGranted = true;
        for (String permission : permissions) {
            if (ContextCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED) {
                allGranted = false;
                break;
            }
        }

        if (!allGranted) {
            ActivityCompat.requestPermissions(this, permissions, PERMISSION_REQUEST_CODE);
        }
    }

    private void initWebRTC() {
        webRTCClient = new WebRTCClient(this, this);
        webRTCClient.createPeerConnection();
        webRTCClient.createAudioTrack();

        if ("video".equals(callType)) {
            localVideoView.init(null, null);
            remoteVideoView.init(null, null);
            webRTCClient.createVideoTrack(localVideoView);
            localVideoView.setVisibility(View.VISIBLE);
            isVideoEnabled = true;
        }
    }

    private void initSocket() {
        // ✅ Use SocketManager for shared socket
        SocketManager socketManager = SocketManager.getInstance();

        if (!socketManager.isConnected()) {
            // Initialize if not already connected (client calling astrologer)
            String userName = getSharedPreferences("APP_PREFS", MODE_PRIVATE).getString("USER_NAME", "");
            String userPhone = getSharedPreferences("APP_PREFS", MODE_PRIVATE).getString("USER_PHONE", "");
            socketManager.init(this, myUserId, userName, userPhone);
        }

        mSocket = socketManager.getSocket();

        if (mSocket == null) {
            Toast.makeText(this, "Connection error. Please try again.", Toast.LENGTH_LONG).show();
            finish();
            return;
        }

        // Socket listeners for WebRTC signaling
        mSocket.on("session-answered", onSessionAnswered);
        mSocket.on("session-ended", onSessionEnded);
        mSocket.on("webrtc-offer", onWebRTCOffer);
        mSocket.on("webrtc-answer", onWebRTCAnswer);
        mSocket.on("webrtc-ice-candidate", onIceCandidate);

        android.util.Log.d(TAG, "✅ Socket ready via SocketManager");
    }

    private void showIncomingUI() {
        layoutIncoming.setVisibility(View.VISIBLE);
        layoutActiveCall.setVisibility(View.GONE);
    }

    private void showOutgoingUI() {
        layoutIncoming.setVisibility(View.GONE);
        layoutActiveCall.setVisibility(View.VISIBLE);
        tvStatus.setText("Calling...");
        startCall();
    }

    private void showActiveUI() {
        layoutIncoming.setVisibility(View.GONE);
        layoutActiveCall.setVisibility(View.VISIBLE);
        tvStatus.setText("Connected");
        startTime = System.currentTimeMillis();
        timerHandler.postDelayed(timerRunnable, 0);

        // Start billing after connection
        initializeBilling();
    }

    private void initializeBilling() {
        String sessionId = "call_" + myUserId + "_" + partnerId + "_" + System.currentTimeMillis();

        billingManager = new BillingManager(this, mSocket, pricePerMinute, new BillingManager.BillingListener() {
            @Override
            public void onMinuteCharge(int amount, int totalMinutes, int remainingBalance) {
                runOnUiThread(() -> {
                    android.util.Log.d(TAG, "Call charged ₹" + amount + " for minute " + totalMinutes);
                    android.widget.Toast.makeText(CallActivity.this,
                            "Charged ₹" + amount + " (Minute " + totalMinutes + ") | Balance: ₹" + remainingBalance,
                            android.widget.Toast.LENGTH_SHORT).show();
                });
            }

            @Override
            public void onInsufficientBalance() {
                runOnUiThread(() -> {
                    android.widget.Toast.makeText(CallActivity.this,
                            "Insufficient balance! Call ending...",
                            android.widget.Toast.LENGTH_LONG).show();
                    endCall();
                });
            }

            @Override
            public void onSessionEnd(int totalCharge, int totalMinutes) {
                runOnUiThread(() -> {
                    android.widget.Toast.makeText(CallActivity.this,
                            "Call ended. Total: ₹" + totalCharge + " (" + totalMinutes + " min)",
                            android.widget.Toast.LENGTH_LONG).show();
                });
            }

            @Override
            public void onBalanceUpdated(int newBalance) {
                android.util.Log.d(TAG, "Balance updated: ₹" + newBalance);
            }
        });

        // Set session info
        billingManager.setSession(sessionId, partnerId);

        // Start billing after 5 seconds
        new android.os.Handler().postDelayed(() -> {
            if (billingManager != null) {
                billingManager.startBilling();
                android.widget.Toast.makeText(CallActivity.this,
                        "Billing started: ₹" + pricePerMinute + "/min",
                        android.widget.Toast.LENGTH_LONG).show();
            }
        }, 5000);
    }

    private void startCall() {
        JSONObject payload = new JSONObject();
        try {
            payload.put("toUserId", partnerId);
            payload.put("type", callType);

            mSocket.emit("request-session", payload, (Ack) args -> {
                JSONObject response = (JSONObject) args[0];
                try {
                    if (response.getBoolean("ok")) {
                        activeSessionId = response.getString("sessionId");
                        android.util.Log.d(TAG,
                                "✅ Session created: " + activeSessionId + ", waiting for astrologer to accept...");
                        runOnUiThread(() -> tvStatus.setText("Ringing..."));
                        // ✅ DON'T create offer here! Wait for session-answered event
                    } else {
                        runOnUiThread(() -> {
                            Toast.makeText(CallActivity.this, "Call Failed: " + response.optString("error"),
                                    Toast.LENGTH_SHORT).show();
                            finish();
                        });
                    }
                } catch (JSONException e) {
                    e.printStackTrace();
                }
            });
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    private void answerCall() {
        JSONObject payload = new JSONObject();
        try {
            payload.put("sessionId", activeSessionId);
            payload.put("toUserId", partnerId);
            payload.put("type", callType);
            payload.put("accept", true);
            mSocket.emit("answer-session", payload);
            showActiveUI();
            // WebRTC answer will be created in onWebRTCOffer listener
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    private void toggleMute() {
        isMuted = !isMuted;
        webRTCClient.toggleAudio(!isMuted);
        fabMute.setBackgroundTintList(ContextCompat.getColorStateList(this,
                isMuted ? android.R.color.holo_red_dark : android.R.color.darker_gray));
    }

    private void toggleVideo() {
        if ("video".equals(callType)) {
            isVideoEnabled = !isVideoEnabled;
            webRTCClient.toggleVideo(isVideoEnabled);
            localVideoView.setVisibility(isVideoEnabled ? View.VISIBLE : View.GONE);
            fabVideo.setBackgroundTintList(ContextCompat.getColorStateList(this,
                    isVideoEnabled ? android.R.color.darker_gray : android.R.color.holo_red_dark));
        }
    }

    private void endCall() {
        timerHandler.removeCallbacks(timerRunnable);
        JSONObject payload = new JSONObject();
        try {
            payload.put("sessionId", activeSessionId);
            mSocket.emit("end-session", payload);
        } catch (JSONException e) {
            e.printStackTrace();
        }
        cleanup();
        finish();
    }

    private void cleanup() {
        // Stop billing
        if (billingManager != null) {
            billingManager.stopBilling();
            billingManager.cleanup();
        }

        // Close WebRTC
        if (webRTCClient != null) {
            webRTCClient.close();
        }

        // ✅ Don't disconnect shared socket - just remove listeners
        if (mSocket != null) {
            mSocket.off("session-answered");
            mSocket.off("session-ended");
            mSocket.off("webrtc-offer");
            mSocket.off("webrtc-answer");
            mSocket.off("webrtc-ice-candidate");
        }
        timerHandler.removeCallbacks(timerRunnable);
    }

    // ========== WebRTC Listener Callbacks ==========

    @Override
    public void onLocalDescription(SessionDescription sdp) {
        // Send SDP to remote peer
        JSONObject payload = new JSONObject();
        try {
            payload.put("partnerId", partnerId);
            payload.put("type", sdp.type.canonicalForm());
            payload.put("sdp", sdp.description);

            if (sdp.type == SessionDescription.Type.OFFER) {
                mSocket.emit("webrtc-offer", payload);
            } else {
                mSocket.emit("webrtc-answer", payload);
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    @Override
    public void onIceCandidate(IceCandidate candidate) {
        // Send ICE candidate to remote peer
        JSONObject payload = new JSONObject();
        try {
            payload.put("partnerId", partnerId);
            payload.put("candidate", candidate.sdp);
            payload.put("sdpMid", candidate.sdpMid);
            payload.put("sdpMLineIndex", candidate.sdpMLineIndex);
            mSocket.emit("webrtc-ice-candidate", payload);
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    @Override
    public void onAddRemoteStream(MediaStream stream) {
        runOnUiThread(() -> {
            if (stream.videoTracks.size() > 0 && "video".equals(callType)) {
                stream.videoTracks.get(0).addSink(remoteVideoView);
                remoteVideoView.setVisibility(View.VISIBLE);
            }
        });
    }

    @Override
    public void onConnectionChange(PeerConnection.IceConnectionState state) {
        runOnUiThread(() -> {
            Log.d(TAG, "Connection state: " + state.name());
            if (state == PeerConnection.IceConnectionState.CONNECTED) {
                tvStatus.setText("Connected");
            } else if (state == PeerConnection.IceConnectionState.DISCONNECTED ||
                    state == PeerConnection.IceConnectionState.FAILED) {
                Toast.makeText(this, "Connection lost", Toast.LENGTH_SHORT).show();
                endCall();
            }
        });
    }

    // ========== Socket Event Listeners ==========

    private Emitter.Listener onIncomingSession = args -> runOnUiThread(() -> {
        try {
            JSONObject sessionData = (JSONObject) args[0];
            activeSessionId = sessionData.getString("sessionId");
            showIncomingUI();
        } catch (JSONException e) {
            e.printStackTrace();
        }
    });

    private Emitter.Listener onSessionAnswered = args -> runOnUiThread(() -> {
        android.util.Log.d(TAG, "✅ Astrologer accepted! Creating WebRTC offer...");
        tvStatus.setText("Connecting...");

        // ✅ Create WebRTC offer NOW (after astrologer accepted)
        if (!isIncoming && webRTCClient != null) {
            webRTCClient.createOffer();
        }

        showActiveUI();
    });

    private Emitter.Listener onSessionEnded = args -> runOnUiThread(() -> {
        Toast.makeText(CallActivity.this, "Call Ended", Toast.LENGTH_SHORT).show();
        finish();
    });

    private Emitter.Listener onWebRTCOffer = args -> runOnUiThread(() -> {
        try {
            JSONObject data = (JSONObject) args[0];
            String sdp = data.getString("sdp");
            SessionDescription remoteSdp = new SessionDescription(
                    SessionDescription.Type.OFFER, sdp);
            webRTCClient.setRemoteDescription(remoteSdp);
            webRTCClient.createAnswer();
        } catch (JSONException e) {
            e.printStackTrace();
        }
    });

    private Emitter.Listener onWebRTCAnswer = args -> runOnUiThread(() -> {
        try {
            JSONObject data = (JSONObject) args[0];
            String sdp = data.getString("sdp");
            SessionDescription remoteSdp = new SessionDescription(
                    SessionDescription.Type.ANSWER, sdp);
            webRTCClient.setRemoteDescription(remoteSdp);
        } catch (JSONException e) {
            e.printStackTrace();
        }
    });

    private Emitter.Listener onIceCandidate = args -> runOnUiThread(() -> {
        try {
            JSONObject data = (JSONObject) args[0];
            IceCandidate candidate = new IceCandidate(
                    data.getString("sdpMid"),
                    data.getInt("sdpMLineIndex"),
                    data.getString("candidate"));
            webRTCClient.addIceCandidate(candidate);
        } catch (JSONException e) {
            e.printStackTrace();
        }
    });

    @Override
    protected void onDestroy() {
        super.onDestroy();
        cleanup();
    }
}
