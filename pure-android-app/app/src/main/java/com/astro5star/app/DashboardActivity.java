package com.astro5star.app;

import android.os.Bundle;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.astro5star.app.model.Transaction;
import com.google.android.material.bottomnavigation.BottomNavigationView;
import java.util.ArrayList;
import java.util.List;

public class DashboardActivity extends AppCompatActivity {

    private RecyclerView rvTransactions;
    private TransactionAdapter adapter;
    private TextView tvWalletBalance, tvHeaderBalance;
    private BottomNavigationView bottomNavigation;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_dashboard);

        tvWalletBalance = findViewById(R.id.tvWalletBalance);
        tvHeaderBalance = findViewById(R.id.tvHeaderBalance);
        rvTransactions = findViewById(R.id.rvTransactions);
        bottomNavigation = findViewById(R.id.bottomNavigation);

        rvTransactions.setLayoutManager(new LinearLayoutManager(this));

        // Set Bottom Navigation
        bottomNavigation.setSelectedItemId(R.id.nav_dash);
        bottomNavigation.setOnItemSelectedListener(item -> {
            // Navigation logic will be handled here
            return true;
        });

        loadMockData();
    }

    private void loadMockData() {
        String balance = "₹967648.33";
        tvWalletBalance.setText(balance);
        tvHeaderBalance.setText(balance);

        List<Transaction> transactions = new ArrayList<>();
        transactions.add(new Transaction("1", "₹1", "25/12/2025 09:25", "Pending", "#325993"));
        transactions.add(new Transaction("2", "₹1", "25/12/2025 09:13", "Pending", "#365234"));
        transactions.add(new Transaction("3", "₹1", "25/12/2025 08:10", "Pending", "#117165"));
        transactions.add(new Transaction("4", "₹1", "25/12/2025 08:07", "Pending", "#599593"));
        transactions.add(new Transaction("5", "₹1", "25/12/2025 08:06", "Pending", "#149570"));
        transactions.add(new Transaction("6", "₹1", "25/12/2025 08:01", "Pending", "#392311"));
        transactions.add(new Transaction("7", "₹1", "24/12/2025 20:18", "Pending", "#800532"));

        adapter = new TransactionAdapter(this, transactions);
        rvTransactions.setAdapter(adapter);
    }
}
