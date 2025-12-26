package com.astro5star.app;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.CompoundButton;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.SwitchCompat;
import org.json.JSONException;
import org.json.JSONObject;

public class AstrologerActivity extends AppCompatActivity implements SocketManager.IncomingSessionListener {

    private static final String TAG = "AstrologerActivity";

    private String userId;
    private String userName;
    private String userPhone;
    private int totalEarnings;

    private TextView tvAstroName, tvUserId, tvEarnings;
    private SwitchCompat switchChat, switchCall, switchVideo;
    private Button btnWithdraw;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_astrologer);

        // Get user data from intent FIRST, then SharedPreferences as fallback
        userId = getIntent().getStringExtra("USER_ID");
        userName = getIntent().getStringExtra("USER_NAME");
        totalEarnings = getIntent().getIntExtra("TOTAL_EARNINGS", 0);

        // ✅ Get phone from SharedPreferences (always from prefs, not intent)
        android.content.SharedPreferences prefs = getSharedPreferences("APP_PREFS", MODE_PRIVATE);
        userPhone = prefs.getString("USER_PHONE", "");

        // ✅ FALLBACK: Get from SharedPreferences if not in Intent
        if (userId == null || userId.isEmpty()) {
            userId = prefs.getString("USER_ID", "");
            userName = prefs.getString("USER_NAME", "Astrologer");
            android.util.Log.d(TAG, "✅ Got userId from SharedPreferences: " + userId);
        } else {
            android.util.Log.d(TAG, "✅ Got userId from Intent: " + userId);
        }

        android.util.Log.d(TAG, "✅ Phone: " + userPhone);

        // Validate userId
        if (userId == null || userId.isEmpty()) {
            Toast.makeText(this, "Session expired. Please login again", Toast.LENGTH_LONG).show();
            android.util.Log.e(TAG, "❌ userId is NULL or EMPTY!");
            finish();
            return;
        }

        // Initialize views
        tvAstroName = findViewById(R.id.tvAstroName);
        tvUserId = findViewById(R.id.tvUserId);
        tvEarnings = findViewById(R.id.tvEarnings);
        switchChat = findViewById(R.id.switchChat);
        switchCall = findViewById(R.id.switchCall);
        switchVideo = findViewById(R.id.switchVideo);
        btnWithdraw = findViewById(R.id.btnWithdraw);

        // Set data
        tvAstroName.setText("Welcome, " + userName);
        tvUserId.setText("ID: " + (userId != null ? userId.substring(0, Math.min(6, userId.length())) : ""));
        tvEarnings.setText("₹ " + totalEarnings);

        // ✅ Initialize Socket via SocketManager (SINGLE SOCKET!)
        initSocket();

        // Toggle listeners
        switchChat.setOnCheckedChangeListener((buttonView, isChecked) -> {
            toggleStatus("chat", isChecked);
        });

        switchCall.setOnCheckedChangeListener((buttonView, isChecked) -> {
            toggleStatus("audio", isChecked);
        });

        switchVideo.setOnCheckedChangeListener((buttonView, isChecked) -> {
            toggleStatus("video", isChecked);
        });

        // Withdraw button
        btnWithdraw.setOnClickListener(v -> {
            if (totalEarnings >= 500) {
                Toast.makeText(this, "Withdrawal request submitted", Toast.LENGTH_SHORT).show();
            } else {
                Toast.makeText(this, "Minimum ₹500 required", Toast.LENGTH_SHORT).show();
            }
        });

        // Profile button
        findViewById(R.id.btnProfileSection).setOnClickListener(v -> {
            Toast.makeText(this, "Profile feature coming soon", Toast.LENGTH_SHORT).show();
        });

        // ✅ Logout button
        findViewById(R.id.btnLogout).setOnClickListener(v -> {
            logout();
        });
    }

    private void initSocket() {
        // ✅ Use SocketManager for SINGLE shared socket
        SocketManager socketManager = SocketManager.getInstance();
        socketManager.init(this, userId, userName, userPhone);
        socketManager.setIncomingSessionListener(this);

        android.util.Log.d(TAG, "✅ Socket initialized via SocketManager");
        Toast.makeText(this, "Connecting to server...", Toast.LENGTH_SHORT).show();
    }

    // ✅ Incoming session callback from SocketManager
    @Override
    public void onIncomingSession(String sessionId, String fromUserId, String type, String callerName) {
        runOnUiThread(() -> {
            android.util.Log.d(TAG, "📞 Incoming session: " + type + " from " + callerName);

            // Open IncomingRequestActivity
            Intent intent = new Intent(AstrologerActivity.this, IncomingRequestActivity.class);
            intent.putExtra("SESSION_ID", sessionId);
            intent.putExtra("FROM_USER_ID", fromUserId);
            intent.putExtra("CALLER_NAME", callerName);
            intent.putExtra("TYPE", type);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(intent);
        });
    }

    private void logout() {
        // 1. Disconnect SocketManager
        SocketManager.getInstance().disconnect();

        // 2. Clear SharedPreferences (like website's clearSession)
        android.content.SharedPreferences prefs = getSharedPreferences("APP_PREFS", MODE_PRIVATE);
        prefs.edit().clear().apply();

        // 3. Go to LoginActivity
        Intent intent = new Intent(this, LoginActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();

        android.util.Log.d(TAG, "✅ Logged out and cleared session");
    }

    private void toggleStatus(String type, boolean online) {
        JSONObject payload = new JSONObject();
        try {
            // Send userId and ALL toggle states
            payload.put("userId", userId);
            payload.put("chatOnline", switchChat.isChecked());
            payload.put("audioOnline", switchCall.isChecked());
            payload.put("videoOnline", switchVideo.isChecked());

            SocketManager.getInstance().emit("toggle-status", payload);

            String statusText = online ? "enabled" : "disabled";
            Toast.makeText(this, type.toUpperCase() + " " + statusText, Toast.LENGTH_SHORT).show();

            android.util.Log.d(TAG, "✅ Toggled " + type + ": " + online);

        } catch (JSONException e) {
            android.util.Log.e(TAG, "Toggle error: " + e.getMessage());
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        // Reconnect if needed
        if (!SocketManager.getInstance().isConnected()) {
            initSocket();
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        // Don't disconnect on destroy - keep socket alive for background notifications
        // SocketManager will persist
    }
}
