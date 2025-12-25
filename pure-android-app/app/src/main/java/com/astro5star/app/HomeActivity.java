package com.astro5star.app;

import android.os.Bundle;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.astro5star.app.model.Astrologer;
import com.astro5star.app.model.AstrologerListResponse;
import com.astro5star.app.network.ApiClient;
import com.astro5star.app.network.ApiService;
import com.google.gson.annotations.SerializedName;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import java.util.List;

public class HomeActivity extends AppCompatActivity {

    private RecyclerView rvAstrologers;
    private AstrologerAdapter adapter;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_home);

        rvAstrologers = findViewById(R.id.rvAstrologers);
        rvAstrologers.setLayoutManager(new LinearLayoutManager(this));

        loadAstrologers();
    }

    private void loadAstrologers() {
        ApiService apiService = ApiClient.getClient().create(ApiService.class);
        Call<AstrologerListResponse> call = apiService.getAstrologers();

        call.enqueue(new Callback<AstrologerListResponse>() {
            @Override
            public void onResponse(Call<AstrologerListResponse> call, Response<AstrologerListResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    List<Astrologer> list = response.body().astrologers;
                    adapter = new AstrologerAdapter(HomeActivity.this, list);
                    rvAstrologers.setAdapter(adapter);
                } else {
                    Toast.makeText(HomeActivity.this, "Failed to load astrologers", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<AstrologerListResponse> call, Throwable t) {
                Toast.makeText(HomeActivity.this, "Error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }

}
