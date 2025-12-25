package com.astro5star.app;

import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import androidx.appcompat.app.AppCompatActivity;
import androidx.browser.customtabs.CustomTabsIntent;

public class PaymentActivity extends AppCompatActivity {

    private static final String TAG = "PaymentActivity";
    private static final String TARGET_URL = "https://astro5star.com/wallet";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        handleIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIntent(intent);
    }

    private void handleIntent(Intent intent) {
        Uri data = intent.getData();
        if (data != null) {
            String status = data.getQueryParameter("status");
            Log.d(TAG, "Payment Deep Link received: " + data.toString());

            String title = "Payment Status";
            String message = "Processing...";

            if ("success".equalsIgnoreCase(status)) {
                message = "Payment Successful!";
            } else if ("failed".equalsIgnoreCase(status)) {
                message = "Payment Failed.";
            } else {
                message = "Payment completed with status: " + status;
            }

            new AlertDialog.Builder(this)
                    .setTitle(title)
                    .setMessage(message)
                    .setPositiveButton("OK", new DialogInterface.OnClickListener() {
                        @Override
                        public void onClick(DialogInterface dialog, int which) {
                            redirectToWeb();
                        }
                    })
                    .setOnDismissListener(new DialogInterface.OnDismissListener() {
                        @Override
                        public void onDismiss(DialogInterface dialog) {
                            redirectToWeb();
                        }
                    })
                    .show();
        } else {
            redirectToWeb();
        }
    }

    private void redirectToWeb() {
        // Relaunch the CCT
        CustomTabsIntent.Builder builder = new CustomTabsIntent.Builder();
        CustomTabsIntent customTabsIntent = builder.build();
        customTabsIntent.launchUrl(this, Uri.parse(TARGET_URL));

        // Also ensure WebViewActivity or similar is in stack?
        // For CCT flow, we just launch the URL.
        finish();
    }
}
