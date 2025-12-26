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

        // ✅ Show session info as first message
        String sessionId = getIntent().getStringExtra("SESSION_ID");
        if (sessionId != null) {
            ChatMessage infoMsg = new ChatMessage("system", myUserId,
                    "📋 Chat session started\nAstrologer: " + partnerName +
                            "\nRate: ₹" + pricePerMinute + "/min",
                    System.currentTimeMillis());
            infoMsg.setSentByMe(false);
            adapter.addMessage(infoMsg);
        }

        initSocket();

        btnSend.setOnClickListener(v -> sendMessage());

        findViewById(R.id.btnBack).setOnClickListener(v -> {
            if (billingManager != null) {
                billingManager.stopBilling();
            }
            finish();
        });
    }

    private void initSocket() {
        // ✅ Use SocketManager for shared socket
        SocketManager socketManager = SocketManager.getInstance();

        if (!socketManager.isConnected()) {
            String userName = getSharedPreferences("APP_PREFS", MODE_PRIVATE).getString("USER_NAME", "");
            String userPhone = getSharedPreferences("APP_PREFS", MODE_PRIVATE).getString("USER_PHONE", "");
            socketManager.init(this, myUserId, userName, userPhone);
        }

        mSocket = socketManager.getSocket();

        if (mSocket == null) {
            Toast.makeText(this, "Connection error. Retrying...", Toast.LENGTH_SHORT).show();
            return;
        }

        mSocket.on("chat-message", onNewMessage);

        // ✅ Listen for message delivered confirmation (double tick)
        mSocket.on("message-delivered", args -> {
            runOnUiThread(() -> {
                try {
                    JSONObject data = (JSONObject) args[0];
                    long messageId = data.getLong("messageId");
                    Log.d(TAG, "✅ Message delivered: " + messageId);
                    // Update adapter to show double tick
                    adapter.markMessageDelivered(messageId);
                } catch (JSONException e) {
                    Log.e(TAG, "Delivery parse error", e);
                }
            });
        });

        // Initialize billing
        initializeBilling();

        android.util.Log.d(TAG, "✅ Chat Socket ready via SocketManager");
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

        // ✅ Don't disconnect shared socket - just remove listeners
        if (mSocket != null) {
            mSocket.off("chat-message", onNewMessage);
            mSocket.off("message-delivered");
        }
    }
}
