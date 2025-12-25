package com.astro5star.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import io.socket.client.IO;
import io.socket.client.Socket;
import org.json.JSONException;
import org.json.JSONObject;
import java.net.URISyntaxException;

/**
 * Foreground Service to keep socket connection alive.
 * Required for receiving incoming calls when app is in background.
 * Like WhatsApp - always listening for calls.
 */
public class SocketService extends Service {

    private static final String CHANNEL_ID = "AstroSocketChannel";
    private static final int NOTIFICATION_ID = 1;
    private static final String SOCKET_URL = "https://astro5star.com";

    private Socket mSocket;
    private String userId;
    private String userName;
    private String userPhone;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        // Get user data from intent
        if (intent != null) {
            userId = intent.getStringExtra("USER_ID");
            userName = intent.getStringExtra("USER_NAME");
            userPhone = intent.getStringExtra("USER_PHONE");
        }

        // Start foreground with notification
        startForeground(NOTIFICATION_ID, createNotification());

        // Initialize socket connection
        initSocket();

        return START_STICKY; // Restart if killed
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Astro 5 Star Service",
                    NotificationManager.IMPORTANCE_LOW);
            channel.setDescription("Keeps you online for incoming calls");
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private Notification createNotification() {
        Intent notificationIntent = new Intent(this, AstrologerActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this, 0, notificationIntent,
                PendingIntent.FLAG_IMMUTABLE);

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Astro 5 Star")
                .setContentText("Online - Waiting for calls")
                .setSmallIcon(android.R.drawable.ic_menu_call)
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .build();
    }

    private void initSocket() {
        try {
            mSocket = IO.socket(SOCKET_URL);

            mSocket.on(Socket.EVENT_CONNECT, args -> {
                android.util.Log.d("SocketService", "✅ Socket connected");
                registerUser();
            });

            mSocket.on(Socket.EVENT_DISCONNECT, args -> {
                android.util.Log.d("SocketService", "❌ Socket disconnected - reconnecting...");
            });

            mSocket.on(Socket.EVENT_CONNECT_ERROR, args -> {
                android.util.Log.e("SocketService", "❌ Socket connection error");
            });

            // ✅ INCOMING SESSION LISTENER - Works even in background!
            mSocket.on("incoming-session", args -> {
                try {
                    JSONObject data = (JSONObject) args[0];
                    String sessionId = data.getString("sessionId");
                    String fromUserId = data.getString("fromUserId");
                    String type = data.getString("type");
                    String callerName = data.optString("callerName", "Client");

                    android.util.Log.d("SocketService", "📞 Incoming session: " + type + " from " + fromUserId);

                    // Open IncomingRequestActivity
                    Intent intent = new Intent(this, IncomingRequestActivity.class);
                    intent.putExtra("SESSION_ID", sessionId);
                    intent.putExtra("FROM_USER_ID", fromUserId);
                    intent.putExtra("CALLER_NAME", callerName);
                    intent.putExtra("TYPE", type);
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(intent);

                } catch (JSONException e) {
                    e.printStackTrace();
                }
            });

            mSocket.connect();

        } catch (URISyntaxException e) {
            android.util.Log.e("SocketService", "Socket init error: " + e.getMessage());
        }
    }

    private void registerUser() {
        if (userId == null || userId.isEmpty()) {
            // Try SharedPreferences fallback
            android.content.SharedPreferences prefs = getSharedPreferences("APP_PREFS", MODE_PRIVATE);
            userId = prefs.getString("USER_ID", "");
            userName = prefs.getString("USER_NAME", "");
            userPhone = prefs.getString("USER_PHONE", "");
        }

        if (userId == null || userId.isEmpty()) {
            android.util.Log.e("SocketService", "❌ Cannot register: No userId!");
            return;
        }

        try {
            JSONObject data = new JSONObject();
            data.put("name", userName);
            data.put("phone", userPhone);
            data.put("userId", userId);
            mSocket.emit("register", data);
            android.util.Log.d("SocketService", "✅ Registered: " + userId + " (phone: " + userPhone + ")");
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (mSocket != null) {
            mSocket.disconnect();
            mSocket.off();
        }
        android.util.Log.d("SocketService", "Service destroyed");
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
