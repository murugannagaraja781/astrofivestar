package com.astro5star.app;

import android.os.Bundle;
import android.os.Handler;
import android.util.Log;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import io.socket.client.Ack;
import io.socket.client.IO;
import io.socket.client.Socket;
import io.socket.emitter.Emitter;
import org.json.JSONException;
import org.json.JSONObject;
import java.net.URISyntaxException;

public class CallActivity extends AppCompatActivity {

    private static final String TAG = "CallActivity";
    private static final String SOCKET_URL = "https://astro5star.com";

    private LinearLayout layoutIncoming, layoutActiveCall;
    private TextView tvCallerName, tvStatus, tvTimer;
    private View fabAnswer, fabReject, fabEndCall;

    private Socket mSocket;
    private String myUserId = "user123";
    private String partnerId;
    private String callType = "audio"; // or video
    private String activeSessionId;

    private boolean isIncoming = false;
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

        partnerId = getIntent().getStringExtra("PARTNER_ID");
        isIncoming = getIntent().getBooleanExtra("IS_INCOMING", false);

        layoutIncoming = findViewById(R.id.layoutIncoming);
        layoutActiveCall = findViewById(R.id.layoutActiveCall);
        tvCallerName = findViewById(R.id.tvCallerName);
        tvStatus = findViewById(R.id.tvStatus);
        tvTimer = findViewById(R.id.tvTimer);
        fabAnswer = findViewById(R.id.fabAnswer);
        fabReject = findViewById(R.id.fabReject);
        fabEndCall = findViewById(R.id.fabEndCall);

        initSocket();

        if (isIncoming) {
            showIncomingUI();
        } else {
            showOutgoingUI();
            startCall();
        }

        fabAnswer.setOnClickListener(v -> answerCall());
        fabReject.setOnClickListener(v -> endCall());
        fabEndCall.setOnClickListener(v -> endCall());
    }

    private void showIncomingUI() {
        layoutIncoming.setVisibility(View.VISIBLE);
        layoutActiveCall.setVisibility(View.GONE);
    }

    private void showOutgoingUI() {
        layoutIncoming.setVisibility(View.GONE);
        layoutActiveCall.setVisibility(View.VISIBLE);
        tvStatus.setText("Calling...");
    }

    private void showActiveUI() {
        layoutIncoming.setVisibility(View.GONE);
        layoutActiveCall.setVisibility(View.VISIBLE);
        tvStatus.setText("Connected");
        startTime = System.currentTimeMillis();
        timerHandler.postDelayed(timerRunnable, 0);
    }

    private void initSocket() {
        try {
            mSocket = IO.socket(SOCKET_URL);
            mSocket.connect();

            // Re-register (Should be shared socket ideally)
            JSONObject data = new JSONObject();
            data.put("userId", myUserId);
            mSocket.emit("register", data);

            mSocket.on("incoming-session", args -> runOnUiThread(() -> {
                try {
                    JSONObject sessionData = (JSONObject) args[0];
                    activeSessionId = sessionData.getString("sessionId");
                    // Show incoming UI
                    showIncomingUI();
                } catch (JSONException e) {
                    e.printStackTrace();
                }
            }));

            mSocket.on("session-answered", args -> runOnUiThread(() -> {
                showActiveUI();
            }));

            mSocket.on("session-ended", args -> runOnUiThread(() -> {
                Toast.makeText(CallActivity.this, "Call Ended", Toast.LENGTH_SHORT).show();
                finish();
            }));

        } catch (URISyntaxException | JSONException e) {
            e.printStackTrace();
        }
    }

    private void startCall() {
        JSONObject payload = new JSONObject();
        try {
            payload.put("toUserId", partnerId);
            payload.put("type", callType);
            // birthData could be added here if needed

            mSocket.emit("request-session", payload, (Ack) args -> {
                JSONObject response = (JSONObject) args[0];
                try {
                    if (response.getBoolean("ok")) {
                        activeSessionId = response.getString("sessionId");
                    } else {
                        runOnUiThread(() -> Toast.makeText(CallActivity.this,
                                "Call Failed: " + response.optString("error"), Toast.LENGTH_SHORT).show());
                        finish();
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
        } catch (JSONException e) {
            e.printStackTrace();
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
        finish();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (mSocket != null)
            mSocket.disconnect();
        timerHandler.removeCallbacks(timerRunnable);
    }
}
