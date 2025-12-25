package com.astro5star.app;

import android.content.Context;
import android.content.Intent;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.astro5star.app.model.Astrologer;
import com.bumptech.glide.Glide;
import java.util.List;

public class AstrologerAdapter extends RecyclerView.Adapter<AstrologerAdapter.ViewHolder> {

    private Context context;
    private List<Astrologer> astrologers;

    public AstrologerAdapter(Context context, List<Astrologer> astrologers) {
        this.context = context;
        this.astrologers = astrologers;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(context).inflate(R.layout.item_astrologer, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        Astrologer astro = astrologers.get(position);
        holder.tvName.setText(astro.getName());
        holder.tvPrice.setText("₹ " + astro.getPrice() + "/min");

        if (astro.getSkills() != null && astro.getSkills().length > 0) {
            StringBuilder sb = new StringBuilder();
            for (String s : astro.getSkills())
                sb.append(s).append(", ");
            holder.tvSkills.setText(sb.toString().replaceAll(", $", ""));
        } else {
            holder.tvSkills.setText("Astrology");
        }

        // Load Image using Glide
        // Assuming astro.getImage() returns a strict path or URL. If local path, might
        // need tweaking.
        if (astro.getImage() != null && !astro.getImage().isEmpty()) {
            // If image is relative (Phase 16), prepend base URL? Or assumed full URL?
            // ApiClient URL is 10.0.2.2. If image is /uploads/..., we need to append.
            String imageUrl = astro.getImage();
            if (imageUrl.startsWith("/")) {
                imageUrl = "http://10.0.2.2:3000" + imageUrl;
            }
            Glide.with(context).load(imageUrl).placeholder(R.mipmap.ic_launcher).into(holder.ivAstrologer);
        }

        holder.btnChat.setOnClickListener(v -> {
            Intent intent = new Intent(context, ChatActivity.class);
            intent.putExtra("PARTNER_ID", astro.getUserId());
            intent.putExtra("PARTNER_NAME", astro.getName());
            context.startActivity(intent);
        });

        holder.btnCall.setOnClickListener(v -> {
            Intent intent = new Intent(context, CallActivity.class);
            intent.putExtra("PARTNER_ID", astro.getUserId());
            intent.putExtra("IS_INCOMING", false);
            // In a real app, define AUDIO/VIDEO type here
            context.startActivity(intent);
        });
    }

    @Override
    public int getItemCount() {
        return astrologers.size();
    }

    public static class ViewHolder extends RecyclerView.ViewHolder {
        TextView tvName, tvSkills, tvPrice;
        ImageView ivAstrologer;
        Button btnCall, btnChat;

        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            tvName = itemView.findViewById(R.id.tvName);
            tvSkills = itemView.findViewById(R.id.tvSkills);
            tvPrice = itemView.findViewById(R.id.tvPrice);
            ivAstrologer = itemView.findViewById(R.id.ivAstrologer);
            btnCall = itemView.findViewById(R.id.btnCall);
            btnChat = itemView.findViewById(R.id.btnChat);
        }
    }
}
