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
import com.google.gson.Gson;
import com.google.gson.annotations.SerializedName;
import com.google.gson.reflect.TypeToken;
import io.socket.client.IO;
import io.socket.client.Socket;
import io.socket.emitter.Emitter;
import org.json.JSONArray;
import org.json.JSONObject;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import java.lang.reflect.Type;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.List;

public class HomeActivity extends AppCompatActivity {

    private static final String SOCKET_URL = "https://astro5star.com";

    private RecyclerView rvAstrologers;
    private AstrologerAdapter adapter;
    private android.widget.ProgressBar progressBar;
    private Socket mSocket;
    private List<Astrologer> astrologerList = new ArrayList<>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_home);

        rvAstrologers = findViewById(R.id.rvAstrologers);
        progressBar = findViewById(R.id.progressBar);

        rvAstrologers.setLayoutManager(new LinearLayoutManager(this));

        initSocket();
        loadAstrologers();
    }

    private void initSocket() {
        try {
            mSocket = IO.socket(SOCKET_URL);
            mSocket.connect();

            // Listen for astrologer status updates
            mSocket.on("astrologer-update", onAstrologerUpdate);

        } catch (URISyntaxException e) {
            e.printStackTrace();
        }
    }

    private Emitter.Listener onAstrologerUpdate = new Emitter.Listener() {
        @Override
        public void call(final Object... args) {
            runOnUiThread(() -> {
                try {
                    // Parse the updated astrologer list
                    JSONArray jsonArray = (JSONArray) args[0];
                    Gson gson = new Gson();
                    Type listType = new TypeToken<List<Astrologer>>() {
                    }.getType();
                    List<Astrologer> updatedList = gson.fromJson(jsonArray.toString(), listType);

                    // Update the list and notify adapter
                    astrologerList.clear();
                    astrologerList.addAll(updatedList);

                    if (adapter != null) {
                        adapter.notifyDataSetChanged();
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            });
        }
    };

    private void loadAstrologers() {
        progressBar.setVisibility(android.view.View.VISIBLE);
        rvAstrologers.setVisibility(android.view.View.GONE);

        ApiService apiService = ApiClient.getClient().create(ApiService.class);
        Call<AstrologerListResponse> call = apiService.getAstrologers();

        call.enqueue(new Callback<AstrologerListResponse>() {
            @Override
            public void onResponse(Call<AstrologerListResponse> call, Response<AstrologerListResponse> response) {
                progressBar.setVisibility(android.view.View.GONE);

                if (response.isSuccessful() && response.body() != null) {
                    List<Astrologer> list = response.body().astrologers;
                    if (list != null && !list.isEmpty()) {
                        astrologerList.clear();
                        astrologerList.addAll(list);
                        adapter = new AstrologerAdapter(HomeActivity.this, astrologerList);
                        rvAstrologers.setAdapter(adapter);
                        rvAstrologers.setVisibility(android.view.View.VISIBLE);
                    } else {
                        Toast.makeText(HomeActivity.this, "No astrologers available", Toast.LENGTH_SHORT).show();
                    }
                } else {
                    Toast.makeText(HomeActivity.this, "Failed to load astrologers", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<AstrologerListResponse> call, Throwable t) {
                progressBar.setVisibility(android.view.View.GONE);
                Toast.makeText(HomeActivity.this, "Error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (mSocket != null) {
            mSocket.off("astrologer-update", onAstrologerUpdate);
            mSocket.disconnect();
        }
    }
}
