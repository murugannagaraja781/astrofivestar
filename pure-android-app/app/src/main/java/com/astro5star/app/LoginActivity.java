package com.astro5star.app;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import com.astro5star.app.model.LoginResponse;
import com.astro5star.app.model.PhoneLoginRequest;
import com.astro5star.app.network.ApiClient;
import com.astro5star.app.network.ApiService;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class LoginActivity extends AppCompatActivity {

    private EditText etPhone;
    private Button btnGetOtp;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        etPhone = findViewById(R.id.etPhone);
        btnGetOtp = findViewById(R.id.btnGetOtp);

        btnGetOtp.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                String phone = etPhone.getText().toString().trim();
                if (phone.isEmpty() || phone.length() < 10) {
                    Toast.makeText(LoginActivity.this, getString(R.string.error_phone), Toast.LENGTH_SHORT).show();
                    return;
                }
                sendOtp(phone);
            }
        });
    }

    private void sendOtp(String phone) {
        ApiService apiService = ApiClient.getClient().create(ApiService.class);
        Call<LoginResponse> call = apiService.sendOtp(new PhoneLoginRequest(phone));

        call.enqueue(new Callback<LoginResponse>() {
            @Override
            public void onResponse(Call<LoginResponse> call, Response<LoginResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    if (response.body().isOk()) {
                        Intent intent = new Intent(LoginActivity.this, OtpActivity.class);
                        intent.putExtra("PHONE", phone);
                        startActivity(intent);
                    } else {
                        Toast.makeText(LoginActivity.this, "Error: " + response.body().getError(), Toast.LENGTH_SHORT)
                                .show();
                    }
                } else {
                    Toast.makeText(LoginActivity.this, "Request Failed", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<LoginResponse> call, Throwable t) {
                Toast.makeText(LoginActivity.this, "Network Error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }
}
