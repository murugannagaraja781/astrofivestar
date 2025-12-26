package com.astro5star.app;

import android.content.Context;
import android.content.Intent;
import io.socket.client.IO;
import io.socket.client.Socket;
import io.socket.emitter.Emitter;
import org.json.JSONObject;
import org.json.JSONException;
import java.net.URISyntaxException;

/**
 * Singleton class to manage Socket.IO connection across all activities.
 * Ensures only ONE socket connection exists per app session.
 */
public class SocketManager {

    private static final String TAG = "SocketManager";
    private static final String SOCKET_URL = "https://astro5star.com";
    private static SocketManager instance;
    private Socket mSocket;
    private String userId;
    private String userName;
    private String userPhone;
    private boolean isRegistered = false;
    private Context applicationContext;

    // Listener interface for incoming sessions
    public interface IncomingSessionListener {
        void onIncomingSession(String sessionId, String fromUserId, String type, String callerName);
    }

    private IncomingSessionListener incomingSessionListener;

    private SocketManager() {
        // Private constructor
    }

    public static synchronized SocketManager getInstance() {
        if (instance == null) {
            instance = new SocketManager();
        }
        return instance;
    }

    public void init(Context context, String userId, String userName, String userPhone) {
        this.applicationContext = context.getApplicationContext();
        this.userId = userId;
        this.userName = userName;
        this.userPhone = userPhone;

        if (mSocket != null && mSocket.connected()) {
            android.util.Log.d(TAG, "Socket already connected, re-registering...");
            registerUser();
            return;
        }

        try {
            IO.Options options = new IO.Options();
            options.transports = new String[] { "websocket" };
            options.reconnection = true;
            options.reconnectionAttempts = 9999; // ✅ Infinite retries (practically)
            options.reconnectionDelay = 1000;
            options.reconnectionDelayMax = 5000; // ✅ Max 5 seconds between retries

            mSocket = IO.socket(SOCKET_URL, options);

            mSocket.on(Socket.EVENT_CONNECT, args -> {
                android.util.Log.d(TAG, "✅ Socket connected");
                registerUser();
            });

            mSocket.on(Socket.EVENT_DISCONNECT, args -> {
                android.util.Log.d(TAG, "⚠️ Socket disconnected - will auto-reconnect");
                isRegistered = false;
            });

            mSocket.on(Socket.EVENT_CONNECT_ERROR, args -> {
                android.util.Log.e(TAG,
                        "⚠️ Socket connection error - retrying: " + (args.length > 0 ? args[0] : "unknown"));
            });

            // ✅ Listen for reconnection events
            mSocket.on("reconnect", args -> {
                android.util.Log.d(TAG, "🔄 Socket reconnected automatically!");
                registerUser(); // Re-register after reconnect
            });

            mSocket.on("reconnect_attempt", args -> {
                android.util.Log.d(TAG, "🔄 Reconnecting... attempt " + (args.length > 0 ? args[0] : ""));
            });

            // ✅ Listen for incoming sessions
            mSocket.on("incoming-session", args -> {
                android.util.Log.d(TAG, "📞 Incoming session event received");
                if (args.length > 0 && args[0] instanceof JSONObject) {
                    JSONObject data = (JSONObject) args[0];
                    try {
                        String sessionId = data.getString("sessionId");
                        String fromUserId = data.getString("fromUserId");
                        String type = data.getString("type");
                        String callerName = data.optString("callerName", "Client");

                        android.util.Log.d(TAG, "📞 Incoming: " + type + " from " + callerName);

                        // If listener is set, call it
                        if (incomingSessionListener != null) {
                            incomingSessionListener.onIncomingSession(sessionId, fromUserId, type, callerName);
                        }
                    } catch (JSONException e) {
                        android.util.Log.e(TAG, "Parse error: " + e.getMessage());
                    }
                }
            });

            // ✅ Listen for session-accepted confirmation
            mSocket.on("session-accepted", args -> {
                android.util.Log.d(TAG, "✅ Session accepted by other party");
            });

            mSocket.connect();
            android.util.Log.d(TAG, "🔌 Socket connecting to " + SOCKET_URL);

        } catch (URISyntaxException e) {
            android.util.Log.e(TAG, "Socket init error: " + e.getMessage());
        }
    }

    // Simple init for backward compatibility
    public void init(String userId) {
        if (this.userId == null) {
            this.userId = userId;
        }
        // Don't create new socket if one exists
        if (mSocket != null && mSocket.connected()) {
            return;
        }
    }

    private void registerUser() {
        if (userId == null || userId.isEmpty()) {
            android.util.Log.e(TAG, "Cannot register: userId is null");
            return;
        }

        try {
            // ✅ MATCH WEBSITE FORMAT: {name, phone, userId}
            JSONObject data = new JSONObject();
            data.put("userId", userId);
            if (userName != null)
                data.put("name", userName);
            if (userPhone != null)
                data.put("phone", userPhone);

            mSocket.emit("register", data);
            isRegistered = true;
            android.util.Log.d(TAG, "✅ Registered: " + userId + " (name: " + userName + ")");
        } catch (JSONException e) {
            android.util.Log.e(TAG, "Register error: " + e.getMessage());
        }
    }

    public void setIncomingSessionListener(IncomingSessionListener listener) {
        this.incomingSessionListener = listener;
    }

    public Socket getSocket() {
        return mSocket;
    }

    public boolean isConnected() {
        return mSocket != null && mSocket.connected();
    }

    public boolean isRegistered() {
        return isRegistered;
    }

    public void emit(String event, JSONObject data) {
        if (mSocket != null && mSocket.connected()) {
            mSocket.emit(event, data);
            android.util.Log.d(TAG, "📤 Emit: " + event);
        } else {
            android.util.Log.e(TAG, "⚠️ Cannot emit " + event + ": Socket not connected");
        }
    }

    public void on(String event, Emitter.Listener listener) {
        if (mSocket != null) {
            mSocket.on(event, listener);
        }
    }

    public void off(String event) {
        if (mSocket != null) {
            mSocket.off(event);
        }
    }

    public void disconnect() {
        if (mSocket != null) {
            mSocket.disconnect();
            mSocket.off();
            mSocket = null;
            isRegistered = false;
            android.util.Log.d(TAG, "🔌 Socket disconnected");
        }
    }
}
