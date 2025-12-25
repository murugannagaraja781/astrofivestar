package com.astro5star.app;

import android.net.Uri;
import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;
import androidx.browser.customtabs.CustomTabsIntent;
import androidx.core.content.ContextCompat;

public class WebViewActivity extends AppCompatActivity {

    private static final String URL = "https://astro5star.com";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // No layout needed, direct launch
        openCustomTab();
    }

    @Override
    protected void onResume() {
        super.onResume();
        // If the user returns from CCT (back button), we might want to close the app
        // But if they are returning from PaymentActivity, we might want to relaunch?
        // For simple flow:
        // finish();
        // But let's keep it open for now or simple "Re-open" logic if needed.
        // Actually, if we finish() immediately, the app dies.
        // Let's just launch CCT. If they come back, they see a blank screen?
        // Let's add a "Re-open" button layout briefly or just finish if verified.
        // For now, let's just keep the activity alive.
    }

    private void openCustomTab() {
        CustomTabsIntent.Builder builder = new CustomTabsIntent.Builder();
        builder.setToolbarColor(ContextCompat.getColor(this, android.R.color.white));
        builder.setShowTitle(true);

        CustomTabsIntent customTabsIntent = builder.build();
        // Ensure it launches as a new task if needed, but standard is fine
        customTabsIntent.launchUrl(this, Uri.parse(URL));

        // We finish this activity so the user doesn't see a blank screen when pressing
        // back from CCT?
        // No, if we finish, the app entry closes.
        // Let's leave it.
    }
}
