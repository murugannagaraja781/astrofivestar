package com.astro5star.app;

import android.os.Bundle;
import android.text.TextUtils;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.astro5star.app.model.ChatMessage;
import com.astro5star.app.utils.BillingManager;
import io.socket.client.IO;
import io.socket.client.Socket;
import io.socket.emitter.Emitter;
import org.json.JSONException;
import org.json.JSONObject;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.List;

public class ChatActivity extends AppCompatActivity {

    private static final String TAG = "ChatActivity";
    // Live Production URL
    private static final String SOCKET_URL = "https://astro5star.com";

    private RecyclerView rvChat;
    private ChatAdapter adapter;
    private EditText etMessage;
    private Button btnSend;
    private TextView tvHeaderName;

    private Socket mSocket;
    private BillingManager billingManager;
    private String myUserId; // ✅ Get from SharedPreferences
    private String partnerId;
    private int pricePerMinute = 100; // Get from partner data
    private List<ChatMessage> messageList = new ArrayList<>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_chat);

        // ✅ GET REAL USER ID
        android.content.SharedPreferences prefs = getSharedPreferences("APP_PREFS", MODE_PRIVATE);
        myUserId = prefs.getString("USER_ID", "");

        if (myUserId == null || myUserId.isEmpty()) {
            Toast.makeText(this, "Session expired. Please login again", Toast.LENGTH_SHORT).show();
            finish();
            return;
        }

        partnerId = getIntent().getStringExtra("PARTNER_ID");
        String partnerName = getIntent().getStringExtra("PARTNER_NAME");

        android.util.Log.d(TAG, "✅ Retrieved userId: " + myUserId + ", Partner: " + partnerId);
        // myUserId = getSharedPreferences("APP_PREFS",
        // MODE_PRIVATE).getString("USER_ID", "anon");

        tvHeaderName = findViewById(R.id.tvHeaderName);
        tvHeaderName.setText(partnerName);

        rvChat = findViewById(R.id.rvChat);
        etMessage = findViewById(R.id.etMessage);
        btnSend = findViewById(R.id.btnSend);

        adapter = new ChatAdapter(this, messageList);
        rvChat.setLayoutManager(new LinearLayoutManager(this));
        rvChat.setAdapter(adapter);

        initSocket();

        btnSend.setOnClickListener(v -> sendMessage());

        findViewById(R.id.btnBack).setOnClickListener(v -> finish());
    }

    private void initSocket() {
        try {
            mSocket = IO.socket(SOCKET_URL);

            // ✅ WAIT FOR CONNECTION
            mSocket.on(Socket.EVENT_CONNECT, args -> {
                runOnUiThread(() -> {
                    try {
                        org.json.JSONObject registerData = new org.json.JSONObject();
                        registerData.put("userId", myUserId);
                        mSocket.emit("register", registerData);

                        android.util.Log.d(TAG, "✅ Chat Socket CONNECTED & REGISTERED: " + myUserId);

                    } catch (org.json.JSONException e) {
                        e.printStackTrace();
                    }
                });
            });

            mSocket.on("chat-message", onNewMessage);

            // Initialize billing
            initializeBilling();

            // ✅ CONNECT LAST
            mSocket.connect();

        } catch (java.net.URISyntaxException e) {
            Log.e(TAG, "Socket Init Error", e);
        }
    }

    private void initializeBilling() {
        String sessionId = "chat_" + myUserId + "_" + partnerId + "_" + System.currentTimeMillis();

        billingManager = new BillingManager(this, mSocket, pricePerMinute, new BillingManager.BillingListener() {
            @Override
            public void onMinuteCharge(int amount, int totalMinutes, int remainingBalance) {
                runOnUiThread(() -> {
                    Log.d(TAG, "Charged ₹" + amount + " for minute " + totalMinutes);
                    Toast.makeText(ChatActivity.this,
                            "Charged ₹" + amount + " (Minute " + totalMinutes + ") | Balance: ₹" + remainingBalance,
                            Toast.LENGTH_SHORT).show();
                });
            }

            @Override
            public void onInsufficientBalance() {
                runOnUiThread(() -> {
                    Toast.makeText(ChatActivity.this,
                            "Insufficient balance! Ending session...",
                            Toast.LENGTH_LONG).show();
                    finish();
                });
            }

            @Override
            public void onSessionEnd(int totalCharge, int totalMinutes) {
                runOnUiThread(() -> {
                    Toast.makeText(ChatActivity.this,
                            "Session ended. Total: ₹" + totalCharge + " (" + totalMinutes + " min)",
                            Toast.LENGTH_LONG).show();
                });
            }

            @Override
            public void onBalanceUpdated(int newBalance) {
                Log.d(TAG, "Balance updated: ₹" + newBalance);
            }
        });

        // Set session info
        billingManager.setSession(sessionId, partnerId);

        // Start billing after 5 seconds (grace period)
        new android.os.Handler().postDelayed(() -> {
            billingManager.startBilling();
            Toast.makeText(ChatActivity.this, "Billing started: ₹" + pricePerMinute + "/min",
                    Toast.LENGTH_LONG).show();
        }, 5000);
    }

    private void sendMessage() {
        String text = etMessage.getText().toString().trim();
        if (TextUtils.isEmpty(text))
            return;

        etMessage.setText("");

        // Add to local list
        ChatMessage msg = new ChatMessage(myUserId, partnerId, text, System.currentTimeMillis());
        msg.setSentByMe(true);
        adapter.addMessage(msg);
        rvChat.scrollToPosition(messageList.size() - 1);

        // Emit to Socket
        JSONObject payload = new JSONObject();
        try {
            payload.put("toUserId", partnerId);
            payload.put("content", new JSONObject().put("type", "text").put("text", text));
            payload.put("messageId", System.currentTimeMillis());
            mSocket.emit("chat-message", payload);
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    private Emitter.Listener onNewMessage = new Emitter.Listener() {
        @Override
        public void call(final Object... args) {
            runOnUiThread(() -> {
                JSONObject data = (JSONObject) args[0];
                try {
                    String from = data.getString("fromUserId");
                    JSONObject content = data.getJSONObject("content");
                    String text = content.getString("text");

                    if (from.equals(partnerId)) {
                        ChatMessage msg = new ChatMessage(from, myUserId, text, System.currentTimeMillis());
                        msg.setSentByMe(false);
                        adapter.addMessage(msg);
                        rvChat.scrollToPosition(messageList.size() - 1);
                    }
                } catch (JSONException e) {
                    Log.e(TAG, "Message Parse Error", e);
                }
            });
        }
    };

    @Override
    protected void onDestroy() {
        super.onDestroy();

        // Stop billing
        if (billingManager != null) {
            billingManager.stopBilling();
            billingManager.cleanup();
        }

        // Disconnect socket
        if (mSocket != null) {
            mSocket.disconnect();
            mSocket.off("chat-message", onNewMessage);
        }
    }
}
