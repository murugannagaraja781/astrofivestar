package com.astro5star.app;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.CompoundButton;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.SwitchCompat;
import io.socket.client.IO;
import io.socket.client.Socket;
import org.json.JSONException;
import org.json.JSONObject;
import java.net.URISyntaxException;

public class AstrologerActivity extends AppCompatActivity {

    private static final String SOCKET_URL = "https://astro5star.com";

    private Socket mSocket;
    private String userId;
    private String userName;
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

        // ✅ FALLBACK: Get from SharedPreferences if not in Intent
        if (userId == null || userId.isEmpty()) {
            android.content.SharedPreferences prefs = getSharedPreferences("APP_PREFS", MODE_PRIVATE);
            userId = prefs.getString("USER_ID", "");
            userName = prefs.getString("USER_NAME", "Astrologer");
            android.util.Log.d("AstrologerActivity", "✅ Got userId from SharedPreferences: " + userId);
        } else {
            android.util.Log.d("AstrologerActivity", "✅ Got userId from Intent: " + userId);
        }

        // Validate userId
        if (userId == null || userId.isEmpty()) {
            Toast.makeText(this, "Session expired. Please login again", Toast.LENGTH_LONG).show();
            android.util.Log.e("AstrologerActivity", "❌ userId is NULL or EMPTY!");
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
        tvAstroName.setText(userName);
        tvUserId.setText("ID: " + (userId != null ? userId.substring(0, 6) : ""));
        tvEarnings.setText("₹ " + totalEarnings);

        // Initialize Socket
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
    }

    private void initSocket() {
        try {
            mSocket = IO.socket(SOCKET_URL);

            // ✅ WAIT FOR CONNECTION BEFORE REGISTERING
            mSocket.on(io.socket.client.Socket.EVENT_CONNECT, args -> {
                runOnUiThread(() -> {
                    try {
                        JSONObject data = new JSONObject();
                        data.put("userId", userId);
                        mSocket.emit("register", data);

                        android.util.Log.d("AstrologerActivity", "✅ Socket CONNECTED & REGISTERED: " + userId);
                        Toast.makeText(AstrologerActivity.this, "Connected to server", Toast.LENGTH_SHORT).show();

                    } catch (JSONException e) {
                        e.printStackTrace();
                    }
                });
            });

            mSocket.on(io.socket.client.Socket.EVENT_CONNECT_ERROR, args -> {
                runOnUiThread(() -> {
                    android.util.Log.e("AstrologerActivity", "❌ Socket connection error");
                    Toast.makeText(AstrologerActivity.this, "Connection error", Toast.LENGTH_SHORT).show();
                });
            });

            // Connect AFTER setting up listeners
            mSocket.connect();

        } catch (URISyntaxException e) {
            e.printStackTrace();
            Toast.makeText(this, "Connection error", Toast.LENGTH_SHORT).show();
        }
    }

    private void toggleStatus(String type, boolean online) {
        JSONObject payload = new JSONObject();
        try {
            // Send userId and ALL toggle states
            payload.put("userId", userId);
            payload.put("chatOnline", switchChat.isChecked());
            payload.put("audioOnline", switchCall.isChecked());
            payload.put("videoOnline", switchVideo.isChecked());

            mSocket.emit("toggle-status", payload);

            String statusText = online ? "enabled" : "disabled";
            Toast.makeText(this, type.toUpperCase() + " " + statusText, Toast.LENGTH_SHORT).show();

            android.util.Log.d("AstrologerActivity", "✅ Toggled " + type + ": " + online);

            // Toggle listeners
            mSocket.on("toggle-status", args -> {
                // Handle status updates if needed
            });

            // Earnings update listener
            mSocket.on("earnings-update", args -> {
                runOnUiThread(() -> {
                    try {
                        org.json.JSONObject data = (org.json.JSONObject) args[0];
                        int newEarnings = data.getInt("totalEarnings");
                        int sessionEarnings = data.optInt("sessionEarnings", 0);

                        // Update UI
                        totalEarnings = newEarnings;
                        tvEarnings.setText("₹ " + totalEarnings);

                        // Show notification
                        if (sessionEarnings > 0) {
                            android.widget.Toast.makeText(AstrologerActivity.this,
                                    "Earned ₹" + sessionEarnings + " from session!",
                                    android.widget.Toast.LENGTH_LONG).show();
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                });
            });
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (mSocket != null) {
            mSocket.disconnect();
        }
    }
}
