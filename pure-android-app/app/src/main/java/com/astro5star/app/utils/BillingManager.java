package com.astro5star.app.utils;

import android.os.Handler;
import android.util.Log;

/**
 * BillingManager - Handles session-based billing
 * Per-minute wallet deduction for chat/call/video sessions
 */
public class BillingManager {

    private static final String TAG = "BillingManager";

    private Handler billingHandler;
    private Runnable billingRunnable;
    private BillingListener listener;

    private int pricePerMinute;
    private long sessionStartTime;
    private boolean isRunning = false;

    public interface BillingListener {
        void onMinuteCharge(int amount, int totalMinutes);

        void onInsufficientBalance();

        void onSessionEnd(int totalCharge, int totalMinutes);
    }

    public BillingManager(int pricePerMinute, BillingListener listener) {
        this.pricePerMinute = pricePerMinute;
        this.listener = listener;
        this.billingHandler = new Handler();
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

        billingRunnable = new Runnable() {
            @Override
            public void run() {
                if (!isRunning)
                    return;

                int elapsedMinutes = getElapsedMinutes();
                Log.d(TAG, "Billing tick: " + elapsedMinutes + " minutes");

                // Charge for the minute
                listener.onMinuteCharge(pricePerMinute, elapsedMinutes);

                // Schedule next billing (every 60 seconds)
                billingHandler.postDelayed(this, 60000);
            }
        };

        // First charge after 1 minute
        billingHandler.postDelayed(billingRunnable, 60000);

        Log.d(TAG, "Billing started: ₹" + pricePerMinute + "/min");
    }

    /**
     * Stop billing and calculate total
     */
    public void stopBilling() {
        if (!isRunning)
            return;

        isRunning = false;
        billingHandler.removeCallbacks(billingRunnable);

        int totalMinutes = getElapsedMinutes();
        int totalCharge = calculateTotalCharge(totalMinutes);

        listener.onSessionEnd(totalCharge, totalMinutes);

        Log.d(TAG, "Billing stopped: " + totalMinutes + " min, ₹" + totalCharge);
    }

    /**
     * Get elapsed minutes since session start
     */
    private int getElapsedMinutes() {
        long elapsed = System.currentTimeMillis() - sessionStartTime;
        return (int) Math.ceil(elapsed / 60000.0); // Round up
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
        // Require at least 2 minutes worth of balance
        return walletBalance >= (pricePerMinute * 2);
    }

    /**
     * Cleanup
     */
    public void cleanup() {
        if (billingHandler != null) {
            billingHandler.removeCallbacks(billingRunnable);
        }
        isRunning = false;
    }
}
