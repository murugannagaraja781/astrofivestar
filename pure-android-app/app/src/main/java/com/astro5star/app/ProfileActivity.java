package com.astro5star.app;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;

public class ProfileActivity extends AppCompatActivity {

    private TextView tvName, tvPhone, tvUserId;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_profile);

        // Get user data from SharedPreferences
        SharedPreferences prefs = getSharedPreferences("APP_PREFS", MODE_PRIVATE);
        String userId = prefs.getString("USER_ID", "");
        String userName = prefs.getString("USER_NAME", "User");
        String userPhone = prefs.getString("USER_PHONE", "");

        // Initialize views
        tvName = findViewById(R.id.tvName);
        tvPhone = findViewById(R.id.tvPhone);
        tvUserId = findViewById(R.id.tvUserId);

        // Set data
        tvName.setText(userName);
        tvPhone.setText(userPhone);
        tvUserId.setText(userId);

        // Back button
        findViewById(R.id.btnBack).setOnClickListener(v -> finish());

        // Change photo button
        findViewById(R.id.btnChangePhoto).setOnClickListener(v -> {
            Toast.makeText(this, "Photo change coming soon", Toast.LENGTH_SHORT).show();
        });

        // Wallet button
        findViewById(R.id.btnWallet).setOnClickListener(v -> {
            Intent intent = new Intent(this, WalletActivity.class);
            startActivity(intent);
        });

        // Help button
        findViewById(R.id.btnHelp).setOnClickListener(v -> {
            Toast.makeText(this, "Contact: support@astro5star.com", Toast.LENGTH_LONG).show();
        });

        // Logout button
        findViewById(R.id.btnLogout).setOnClickListener(v -> {
            logout();
        });
    }

    private void logout() {
        // Clear SharedPreferences
        SharedPreferences prefs = getSharedPreferences("APP_PREFS", MODE_PRIVATE);
        prefs.edit().clear().apply();

        // Disconnect socket
        SocketManager.getInstance().disconnect();

        android.util.Log.d("ProfileActivity", "✅ Logged out");
        Toast.makeText(this, "Logged out successfully", Toast.LENGTH_SHORT).show();

        // Go to Login
        Intent intent = new Intent(this, LoginActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }
}
