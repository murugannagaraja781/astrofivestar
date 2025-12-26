package com.astro5star.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

public class MyFirebaseMessagingService extends FirebaseMessagingService {

    private static final String TAG = "FCMService";
    private static final String CHANNEL_ID = "astro5star_notifications";
    private static final String CHANNEL_CALLS = "astro5star_calls";

    @Override
    public void onNewToken(String token) {
        super.onNewToken(token);
        Log.d(TAG, "FCM Token: " + token);

        // Save token to SharedPreferences
        getSharedPreferences("APP_PREFS", MODE_PRIVATE)
                .edit()
                .putString("FCM_TOKEN", token)
                .apply();

        // TODO: Send token to server to associate with user
    }

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);
        Log.d(TAG, "📩 FCM Message received from: " + remoteMessage.getFrom());

        // Check if message contains data payload
        if (remoteMessage.getData().size() > 0) {
            Log.d(TAG, "Message data: " + remoteMessage.getData());

            String type = remoteMessage.getData().get("type");
            String title = remoteMessage.getData().get("title");
            String body = remoteMessage.getData().get("body");
            String sessionId = remoteMessage.getData().get("sessionId");
            String fromUserId = remoteMessage.getData().get("fromUserId");
            String callerName = remoteMessage.getData().get("callerName");

            if ("incoming_call".equals(type) || "incoming_chat".equals(type)) {
                // Show incoming call/chat notification
                showIncomingNotification(title, body, type, sessionId, fromUserId, callerName);
            } else {
                // Show regular notification
                showNotification(title, body);
            }
        }

        // Check if message contains notification payload
        if (remoteMessage.getNotification() != null) {
            String title = remoteMessage.getNotification().getTitle();
            String body = remoteMessage.getNotification().getBody();
            showNotification(title, body);
        }
    }

    private void showIncomingNotification(String title, String body, String type,
            String sessionId, String fromUserId, String callerName) {

        // Create intent to open IncomingRequestActivity
        Intent intent = new Intent(this, IncomingRequestActivity.class);
        intent.putExtra("sessionId", sessionId);
        intent.putExtra("fromUserId", fromUserId);
        intent.putExtra("callerName", callerName != null ? callerName : "Client");
        intent.putExtra("type", type.replace("incoming_", ""));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, intent,
                PendingIntent.FLAG_ONE_SHOT | PendingIntent.FLAG_IMMUTABLE);

        // Create notification channel for calls (high priority)
        createCallNotificationChannel();

        Uri soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);

        NotificationCompat.Builder notificationBuilder = new NotificationCompat.Builder(this, CHANNEL_CALLS)
                .setSmallIcon(android.R.drawable.ic_menu_call)
                .setContentTitle(title != null ? title : "Incoming Request")
                .setContentText(body != null ? body : "You have a new consultation request")
                .setAutoCancel(true)
                .setSound(soundUri)
                .setVibrate(new long[] { 0, 500, 200, 500, 200, 500 })
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_CALL)
                .setFullScreenIntent(pendingIntent, true)
                .setContentIntent(pendingIntent);

        NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);

        notificationManager.notify(1001, notificationBuilder.build());

        Log.d(TAG, "📞 Incoming notification shown for: " + type);
    }

    private void showNotification(String title, String body) {
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);

        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, intent,
                PendingIntent.FLAG_ONE_SHOT | PendingIntent.FLAG_IMMUTABLE);

        createNotificationChannel();

        Uri soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);

        NotificationCompat.Builder notificationBuilder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(title != null ? title : "Astro5Star")
                .setContentText(body != null ? body : "You have a new notification")
                .setAutoCancel(true)
                .setSound(soundUri)
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setContentIntent(pendingIntent);

        NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);

        notificationManager.notify(1000, notificationBuilder.build());
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Astro5Star Notifications",
                    NotificationManager.IMPORTANCE_DEFAULT);
            channel.setDescription("General notifications from Astro5Star");

            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            notificationManager.createNotificationChannel(channel);
        }
    }

    private void createCallNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_CALLS,
                    "Incoming Calls",
                    NotificationManager.IMPORTANCE_HIGH);
            channel.setDescription("Incoming consultation requests");
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[] { 0, 500, 200, 500, 200, 500 });

            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            notificationManager.createNotificationChannel(channel);
        }
    }
}
