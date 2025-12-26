package com.astro5star.app.utils;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Handler;
import android.util.Log;
import org.json.JSONException;
import org.json.JSONObject;
import io.socket.client.Socket;

/**
 * BillingManager - Enhanced with server sync
 * Per-minute wallet deduction for chat/call/video sessions
 */
public class BillingManager {

    private static final String TAG = "BillingManager";

    private Context context;
    private Socket socket;
    private Handler billingHandler;
    private Runnable billingRunnable;
    private BillingListener listener;

    private String sessionId;
    private String myUserId;
    private String partnerId;
    private int pricePerMinute;
    private long sessionStartTime;
    private int totalMinutes = 0;
    private int totalCharged = 0;
    private boolean isRunning = false;

    public interface BillingListener {
        void onMinuteCharge(int amount, int totalMinutes, int remainingBalance);

        void onInsufficientBalance();

        void onSessionEnd(int totalCharge, int totalMinutes);

        void onBalanceUpdated(int newBalance);
    }

    public BillingManager(Context context, Socket socket, int pricePerMinute, BillingListener listener) {
        this.context = context;
        this.socket = socket;
        this.pricePerMinute = pricePerMinute;
        this.listener = listener;
        this.billingHandler = new Handler();

        // Get userId from SharedPreferences
        SharedPreferences prefs = context.getSharedPreferences("APP_PREFS", Context.MODE_PRIVATE);
        this.myUserId = prefs.getString("USER_ID", "");
    }

    /**
     * Set session details
     */
    public void setSession(String sessionId, String partnerId) {
        this.sessionId = sessionId;
        this.partnerId = partnerId;
    }

    /**
     * Start per-minute billing
     */
    public void startBilling() {
        if (isRunning) {
            Log.w(TAG, "Billing already running");
            return;
        }

        sessionStartTime = System.currentTimeMillis();
        isRunning = true;
        totalMinutes = 0;
        totalCharged = 0;

        // Emit session-start to server
        try {
            JSONObject startData = new JSONObject();
            startData.put("sessionId", sessionId);
            startData.put("userId", myUserId);
            startData.put("partnerId", partnerId);
            startData.put("pricePerMinute", pricePerMinute);
            socket.emit("session-start", startData);
            Log.d(TAG, "📤 Emitted session-start");
        } catch (JSONException e) {
            Log.e(TAG, "Error emitting session-start", e);
        }

        // Listen for balance updates from server
        socket.on("wallet-deducted", args -> {
            if (args.length > 0 && args[0] instanceof JSONObject) {
                JSONObject data = (JSONObject) args[0];
                try {
                    int amountDeducted = data.getInt("amount");
                    int remainingBalance = data.getInt("remainingBalance");
                    int minute = data.getInt("minute");

                    // Update local balance
                    SharedPreferences prefs = context.getSharedPreferences("APP_PREFS", Context.MODE_PRIVATE);
                    prefs.edit().putInt("WALLET_BALANCE", remainingBalance).apply();

                    listener.onMinuteCharge(amountDeducted, minute, remainingBalance);
                    listener.onBalanceUpdated(remainingBalance);

                    Log.d(TAG, "💰 Wallet deducted: ₹" + amountDeducted + ", Remaining: ₹" + remainingBalance);
                } catch (JSONException e) {
                    Log.e(TAG, "Error parsing wallet-deducted", e);
                }
            }
        });

        socket.on("insufficient-balance", args -> {
            Log.w(TAG, "⚠️ Insufficient balance - ending session");
            listener.onInsufficientBalance();
            stopBilling();
        });

        billingRunnable = new Runnable() {
            @Override
            public void run() {
                if (!isRunning)
                    return;

                totalMinutes++;
                Log.d(TAG, "Billing tick: " + totalMinutes + " minutes");

                // Request deduction from server
                try {
                    JSONObject deductData = new JSONObject();
                    deductData.put("sessionId", sessionId);
                    deductData.put("userId", myUserId);
                    deductData.put("amount", pricePerMinute);
                    deductData.put("minute", totalMinutes);
                    socket.emit("deduct-wallet", deductData);
                    Log.d(TAG, "📤 Emitted deduct-wallet for minute " + totalMinutes);
                } catch (JSONException e) {
                    Log.e(TAG, "Error emitting deduct-wallet", e);
                }

                totalCharged += pricePerMinute;

                // Schedule next billing (every 60 seconds)
                billingHandler.postDelayed(this, 60000);
            }
        };

        // First charge after 1 minute
        billingHandler.postDelayed(billingRunnable, 60000);

        Log.d(TAG, "✅ Billing started: ₹" + pricePerMinute + "/min");
    }

    /**
     * Stop billing and emit session end
     */
    public void stopBilling() {
        if (!isRunning)
            return;

        isRunning = false;
        billingHandler.removeCallbacks(billingRunnable);

        // Emit session-end to server
        try {
            JSONObject endData = new JSONObject();
            endData.put("sessionId", sessionId);
            endData.put("userId", myUserId);
            endData.put("partnerId", partnerId);
            endData.put("totalMinutes", totalMinutes);
            endData.put("totalCharge", totalCharged);
            socket.emit("session-end", endData);
            Log.d(TAG, "📤 Emitted session-end: " + totalMinutes + " min, ₹" + totalCharged);
        } catch (JSONException e) {
            Log.e(TAG, "Error emitting session-end", e);
        }

        // Remove socket listeners
        socket.off("wallet-deducted");
        socket.off("insufficient-balance");

        listener.onSessionEnd(totalCharged, totalMinutes);

        Log.d(TAG, "🛑 Billing stopped: " + totalMinutes + " min, ₹" + totalCharged);
    }

    /**
     * Get elapsed minutes since session start
     */
    public int getElapsedMinutes() {
        if (sessionStartTime == 0)
            return 0;
        long elapsed = System.currentTimeMillis() - sessionStartTime;
        return (int) Math.ceil(elapsed / 60000.0);
    }

    /**
     * Calculate total charge based on duration
     */
    public int calculateTotalCharge(int minutes) {
        return minutes * pricePerMinute;
    }

    /**
     * Check if user has sufficient balance
     */
    public static boolean hasSufficientBalance(int walletBalance, int pricePerMinute) {
        return walletBalance >= (pricePerMinute * 2);
    }

    /**
     * Get current wallet balance from SharedPreferences
     */
    public int getCurrentBalance() {
        SharedPreferences prefs = context.getSharedPreferences("APP_PREFS", Context.MODE_PRIVATE);
        return prefs.getInt("WALLET_BALANCE", 0);
    }

    /**
     * Cleanup
     */
    public void cleanup() {
        if (billingHandler != null) {
            billingHandler.removeCallbacks(billingRunnable);
        }
        if (socket != null) {
            socket.off("wallet-deducted");
            socket.off("insufficient-balance");
        }
        isRunning = false;
    }
}
