package com.astro5star.app;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import com.astro5star.app.model.LoginResponse;
import com.astro5star.app.model.OtpVerifyRequest;
import com.astro5star.app.network.ApiClient;
import com.astro5star.app.network.ApiService;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class OtpActivity extends AppCompatActivity {

    private String phone;
    private TextView tvPhone;
    private EditText etOtp;
    private Button btnVerify;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_otp);

        phone = getIntent().getStringExtra("PHONE");

        tvPhone = findViewById(R.id.tvPhone);
        etOtp = findViewById(R.id.etOtp);
        btnVerify = findViewById(R.id.btnVerify);

        tvPhone.setText("Sent to +91 " + phone);

        btnVerify.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                String otp = etOtp.getText().toString().trim();
                if (otp.length() < 4) {
                    Toast.makeText(OtpActivity.this, getString(R.string.error_otp), Toast.LENGTH_SHORT).show();
                    return;
                }
                verifyOtp(phone, otp);
            }
        });
    }

    private void verifyOtp(String phone, String otp) {
        ApiService apiService = ApiClient.getClient().create(ApiService.class);
        Call<LoginResponse> call = apiService.verifyOtp(new OtpVerifyRequest(phone, otp));

        call.enqueue(new Callback<LoginResponse>() {
            @Override
            public void onResponse(Call<LoginResponse> call, Response<LoginResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    if (response.body().isOk()) {
                        // Success - Route based on role
                        LoginResponse user = response.body();
                        String role = user.getRole();

                        // ✅ SAVE USER DATA TO SHAREDPREFERENCES
                        android.content.SharedPreferences prefs = getSharedPreferences("APP_PREFS", MODE_PRIVATE);
                        android.content.SharedPreferences.Editor editor = prefs.edit();
                        editor.putString("USER_ID", user.getUserId());
                        editor.putString("USER_NAME", user.getName());
                        editor.putString("USER_ROLE", user.getRole());
                        editor.putString("USER_PHONE", phone); // ✅ SAVE PHONE
                        editor.putInt("WALLET_BALANCE", user.getWalletBalance());
                        editor.putInt("TOTAL_EARNINGS", user.getTotalEarnings());
                        editor.apply();

                        android.util.Log.d("OtpActivity", "✅ Saved userId: " + user.getUserId());

                        Intent intent;
                        if ("astrologer".equals(role)) {
                            // Route to Astrologer Dashboard
                            intent = new Intent(OtpActivity.this, AstrologerActivity.class);
                            intent.putExtra("USER_ID", user.getUserId());
                            intent.putExtra("USER_NAME", user.getName());
                            intent.putExtra("TOTAL_EARNINGS", user.getTotalEarnings());
                        } else {
                            // Route to Client Home
                            intent = new Intent(OtpActivity.this, HomeActivity.class);
                        }

                        // Clear back stack
                        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                        startActivity(intent);
                        finish();
                    } else {
                        Toast.makeText(OtpActivity.this, "Error: " + response.body().getError(), Toast.LENGTH_SHORT)
                                .show();
                    }
                } else {
                    Toast.makeText(OtpActivity.this, "Request Failed", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<LoginResponse> call, Throwable t) {
                Toast.makeText(OtpActivity.this, "Network Error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }
}
