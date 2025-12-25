package com.astro5star.app;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // Splash screen delay then check session
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            checkSessionAndRoute();
        }, 1000); // 1 second delay
    }

    private void checkSessionAndRoute() {
        SharedPreferences prefs = getSharedPreferences("APP_PREFS", MODE_PRIVATE);
        String userId = prefs.getString("USER_ID", "");
        String role = prefs.getString("USER_ROLE", "");
        long expiresAt = prefs.getLong("EXPIRES_AT", 0);

        // ✅ Check if session exists and not expired (24 hours)
        if (!userId.isEmpty() && System.currentTimeMillis() < expiresAt) {
            // Session valid - auto login
            android.util.Log.d("MainActivity", "✅ Session valid - Auto login as " + role);

            Intent intent;
            if ("astrologer".equals(role)) {
                intent = new Intent(this, AstrologerActivity.class);
            } else if ("client".equals(role)) {
                intent = new Intent(this, HomeActivity.class);
            } else {
                // Unknown role - go to login
                intent = new Intent(this, LoginActivity.class);
            }
            startActivity(intent);
            finish();
        } else {
            // Session expired or not found - clear and go to login
            if (!userId.isEmpty()) {
                android.util.Log.d("MainActivity", "❌ Session expired - Clearing data");
                prefs.edit().clear().apply();
            }

            Intent intent = new Intent(this, LoginActivity.class);
            startActivity(intent);
            finish();
        }
    }
}
