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
    private String myUserId = "user123"; // Retrieve from SharedPrefs in real app
    private String partnerId;
    private List<ChatMessage> messageList = new ArrayList<>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_chat);

        partnerId = getIntent().getStringExtra("PARTNER_ID");
        String partnerName = getIntent().getStringExtra("PARTNER_NAME");
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
            mSocket.connect();

            // Register User Logic (skipped for brevity, assume auto-registered or simple
            // flow)
            JSONObject data = new JSONObject();
            try {
                data.put("userId", myUserId);
                // In real app, we need to send role/phone too
            } catch (JSONException e) {
                e.printStackTrace();
            }
            mSocket.emit("register", data);

            mSocket.on("chat-message", onNewMessage);

        } catch (URISyntaxException e) {
            Log.e(TAG, "Socket Init Error", e);
        }
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
        if (mSocket != null) {
            mSocket.disconnect();
            mSocket.off("chat-message", onNewMessage);
        }
    }
}
