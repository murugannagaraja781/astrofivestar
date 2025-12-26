package com.astro5star.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.browser.customtabs.CustomTabsIntent;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import java.util.ArrayList;

public class WalletActivity extends AppCompatActivity {

    private static final String WALLET_URL = "https://astro5star.com/wallet";

    private TextView tvBalance;
    private RecyclerView rvTransactions;
    private TextView tvNoTransactions;
    private int walletBalance = 0;
    private String userId;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_wallet);

        // Get user data from SharedPreferences
        android.content.SharedPreferences prefs = getSharedPreferences("APP_PREFS", MODE_PRIVATE);
        userId = prefs.getString("USER_ID", "");
        walletBalance = prefs.getInt("WALLET_BALANCE", 0);

        // Initialize views
        tvBalance = findViewById(R.id.tvBalance);
        rvTransactions = findViewById(R.id.rvTransactions);
        tvNoTransactions = findViewById(R.id.tvNoTransactions);

        // Set balance
        tvBalance.setText("₹ " + walletBalance);

        // Back button
        findViewById(R.id.btnBack).setOnClickListener(v -> finish());

        // Add Money button
        findViewById(R.id.btnAddMoney).setOnClickListener(v -> openPaymentPage(0));

        // Quick add buttons
        findViewById(R.id.btnAdd100).setOnClickListener(v -> openPaymentPage(100));
        findViewById(R.id.btnAdd200).setOnClickListener(v -> openPaymentPage(200));
        findViewById(R.id.btnAdd500).setOnClickListener(v -> openPaymentPage(500));

        // Setup transaction list
        rvTransactions.setLayoutManager(new LinearLayoutManager(this));
        // For now, show empty state
        tvNoTransactions.setVisibility(android.view.View.VISIBLE);
    }

    private void openPaymentPage(int amount) {
        try {
            String url = WALLET_URL;
            if (amount > 0) {
                url += "?amount=" + amount + "&userId=" + userId;
            } else {
                url += "?userId=" + userId;
            }

            // Open in Chrome Custom Tab
            CustomTabsIntent.Builder builder = new CustomTabsIntent.Builder();
            builder.setToolbarColor(getResources().getColor(android.R.color.holo_green_dark));
            CustomTabsIntent customTabsIntent = builder.build();
            customTabsIntent.launchUrl(this, Uri.parse(url));

        } catch (Exception e) {
            // Fallback to browser
            Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(WALLET_URL));
            startActivity(browserIntent);
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        // Refresh balance when returning from payment
        android.content.SharedPreferences prefs = getSharedPreferences("APP_PREFS", MODE_PRIVATE);
        walletBalance = prefs.getInt("WALLET_BALANCE", 0);
        tvBalance.setText("₹ " + walletBalance);
    }
}
