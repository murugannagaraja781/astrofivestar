package com.astro5star.app;

import io.socket.client.IO;
import io.socket.client.Socket;
import org.json.JSONObject;
import org.json.JSONException;
import java.net.URISyntaxException;

/**
 * Singleton class to manage Socket.IO connection across all activities.
 * Ensures only ONE socket connection exists per app session.
 */
public class SocketManager {

    private static final String SOCKET_URL = "https://astro5star.com";
    private static SocketManager instance;
    private Socket mSocket;
    private String userId;
    private boolean isRegistered = false;

    private SocketManager() {
        // Private constructor
    }

    public static synchronized SocketManager getInstance() {
        if (instance == null) {
            instance = new SocketManager();
        }
        return instance;
    }

    public void init(String userId) {
        this.userId = userId;

        if (mSocket != null && mSocket.connected()) {
            android.util.Log.d("SocketManager", "Socket already connected");
            return;
        }

        try {
            mSocket = IO.socket(SOCKET_URL);

            mSocket.on(Socket.EVENT_CONNECT, args -> {
                android.util.Log.d("SocketManager", "✅ Socket connected");
                registerUser();
            });

            mSocket.on(Socket.EVENT_DISCONNECT, args -> {
                android.util.Log.d("SocketManager", "❌ Socket disconnected");
                isRegistered = false;
            });

            mSocket.on(Socket.EVENT_CONNECT_ERROR, args -> {
                android.util.Log.e("SocketManager", "❌ Socket connection error");
            });

            mSocket.connect();

        } catch (URISyntaxException e) {
            android.util.Log.e("SocketManager", "Socket init error: " + e.getMessage());
        }
    }

    private void registerUser() {
        if (userId == null || userId.isEmpty()) {
            android.util.Log.e("SocketManager", "Cannot register: userId is null");
            return;
        }

        try {
            JSONObject data = new JSONObject();
            data.put("userId", userId);
            mSocket.emit("register", data);
            isRegistered = true;
            android.util.Log.d("SocketManager", "✅ Registered: " + userId);
        } catch (JSONException e) {
            android.util.Log.e("SocketManager", "Register error: " + e.getMessage());
        }
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
        } else {
            android.util.Log.e("SocketManager", "Cannot emit: Socket not connected");
        }
    }

    public void disconnect() {
        if (mSocket != null) {
            mSocket.disconnect();
            mSocket.off();
            mSocket = null;
            isRegistered = false;
        }
    }
}
