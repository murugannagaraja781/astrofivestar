package com.astro5star.app;

import android.content.Context;
import android.content.Intent;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Bundle;
import android.os.Vibrator;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import io.socket.client.IO;
import io.socket.client.Socket;
import org.json.JSONException;
import org.json.JSONObject;
import java.net.URISyntaxException;

public class IncomingRequestActivity extends AppCompatActivity {

    private static final String SOCKET_URL = "https://astro5star.com";

    private TextView tvRequestType, tvCallerName;
    private ImageView ivCallerAvatar;
    private Button btnAccept, btnReject;

    private String sessionId;
    private String fromUserId;
    private String callerName;
    private String requestType;
    private String myUserId;

    private Socket mSocket;
    private MediaPlayer mediaPlayer;
    private Vibrator vibrator;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_incoming_request);

        // Get data from intent
        sessionId = getIntent().getStringExtra("SESSION_ID");
        fromUserId = getIntent().getStringExtra("FROM_USER_ID");
        callerName = getIntent().getStringExtra("CALLER_NAME");
        requestType = getIntent().getStringExtra("TYPE");

        if (callerName == null || callerName.isEmpty()) {
            callerName = "Client "
                    + (fromUserId != null ? fromUserId.substring(0, Math.min(6, fromUserId.length())) : "");
        }

        // Get my userId from SharedPreferences
        android.content.SharedPreferences prefs = getSharedPreferences("APP_PREFS", MODE_PRIVATE);
        myUserId = prefs.getString("USER_ID", "");

        android.util.Log.d("IncomingRequest",
                "Session: " + sessionId + ", From: " + fromUserId + ", Type: " + requestType);

        // Initialize views
        tvRequestType = findViewById(R.id.tvRequestType);
        tvCallerName = findViewById(R.id.tvCallerName);
        ivCallerAvatar = findViewById(R.id.ivCallerAvatar);
        btnAccept = findViewById(R.id.btnAccept);
        btnReject = findViewById(R.id.btnReject);

        // Set request type text
        String typeText = "Incoming Request";
        if ("chat".equals(requestType)) {
            typeText = "📱 Incoming Chat Request";
        } else if ("audio".equals(requestType)) {
            typeText = "📞 Incoming Audio Call";
        } else if ("video".equals(requestType)) {
            typeText = "📹 Incoming Video Call";
        }
        tvRequestType.setText(typeText);
        tvCallerName.setText(callerName);

        // Start ringtone and vibration
        startRingtone();
        startVibration();

        // Initialize socket
        initSocket();

        // Button listeners
        btnAccept.setOnClickListener(v -> acceptRequest());
        btnReject.setOnClickListener(v -> rejectRequest());
    }

    private void initSocket() {
        try {
            mSocket = IO.socket(SOCKET_URL);

            mSocket.on(io.socket.client.Socket.EVENT_CONNECT, args -> {
                android.util.Log.d("IncomingRequest", "Socket connected");
                // Register
                try {
                    JSONObject data = new JSONObject();
                    data.put("userId", myUserId);
                    mSocket.emit("register", data);
                } catch (JSONException e) {
                    e.printStackTrace();
                }
            });

            mSocket.connect();
        } catch (URISyntaxException e) {
            e.printStackTrace();
        }
    }

    private void startRingtone() {
        try {
            Uri ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
            mediaPlayer = MediaPlayer.create(this, ringtoneUri);
            if (mediaPlayer != null) {
                mediaPlayer.setLooping(true);
                mediaPlayer.start();
            }
        } catch (Exception e) {
            android.util.Log.e("IncomingRequest", "Ringtone error: " + e.getMessage());
        }
    }

    private void startVibration() {
        try {
            vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            if (vibrator != null && vibrator.hasVibrator()) {
                long[] pattern = { 0, 1000, 500, 1000, 500 }; // Wait, Vibrate, Pause, Vibrate, Pause
                vibrator.vibrate(pattern, 0); // 0 = repeat from start
            }
        } catch (Exception e) {
            android.util.Log.e("IncomingRequest", "Vibration error: " + e.getMessage());
        }
    }

    private void stopRingtoneAndVibration() {
        try {
            if (mediaPlayer != null) {
                mediaPlayer.stop();
                mediaPlayer.release();
                mediaPlayer = null;
            }
            if (vibrator != null) {
                vibrator.cancel();
            }
        } catch (Exception e) {
            android.util.Log.e("IncomingRequest", "Stop error: " + e.getMessage());
        }
    }

    private void acceptRequest() {
        stopRingtoneAndVibration();

        try {
            // Emit answer-session with accept: true
            JSONObject response = new JSONObject();
            response.put("sessionId", sessionId);
            response.put("toUserId", fromUserId);
            response.put("type", requestType);
            response.put("accept", true);

            if (mSocket != null && mSocket.connected()) {
                mSocket.emit("answer-session", response);
                android.util.Log.d("IncomingRequest", "✅ Accepted session: " + sessionId);
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }

        // Open appropriate activity
        Intent intent;
        if ("chat".equals(requestType)) {
            intent = new Intent(this, ChatActivity.class);
        } else {
            intent = new Intent(this, CallActivity.class);
            intent.putExtra("CALL_TYPE", requestType);
            intent.putExtra("IS_INCOMING", true);
        }

        intent.putExtra("PARTNER_ID", fromUserId);
        intent.putExtra("PARTNER_NAME", callerName);
        intent.putExtra("SESSION_ID", sessionId);
        startActivity(intent);

        Toast.makeText(this, "Session accepted!", Toast.LENGTH_SHORT).show();
        finish();
    }

    private void rejectRequest() {
        stopRingtoneAndVibration();

        try {
            // Emit answer-session with accept: false
            JSONObject response = new JSONObject();
            response.put("sessionId", sessionId);
            response.put("toUserId", fromUserId);
            response.put("accept", false);

            if (mSocket != null && mSocket.connected()) {
                mSocket.emit("answer-session", response);
                android.util.Log.d("IncomingRequest", "❌ Rejected session: " + sessionId);
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }

        Toast.makeText(this, "Session rejected", Toast.LENGTH_SHORT).show();
        finish();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        stopRingtoneAndVibration();
        if (mSocket != null) {
            mSocket.disconnect();
            mSocket.off();
        }
    }

    @Override
    public void onBackPressed() {
        // Prevent back press - user must accept or reject
        Toast.makeText(this, "Please accept or reject the request", Toast.LENGTH_SHORT).show();
    }
}
