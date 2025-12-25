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

        // ✅ Check if ANY service is online
        boolean isChatOnline = astro.isChatOnline();
        boolean isAudioOnline = astro.isAudioOnline();
        boolean isVideoOnline = astro.isVideoOnline();
        boolean isAnyOnline = isChatOnline || isAudioOnline || isVideoOnline;

        // ✅ Show GREEN dot if online, ORANGE if offline
        if (isAnyOnline) {
            holder.viewOnlineIndicator.setBackgroundResource(R.drawable.circle_status_green);
        } else {
            holder.viewOnlineIndicator.setBackgroundResource(R.drawable.circle_status_orange);
        }
        holder.viewOnlineIndicator.setVisibility(View.VISIBLE);

        // ✅ Enable/Disable buttons based on service status
        holder.btnChat.setEnabled(isChatOnline);
        holder.btnChat.setAlpha(isChatOnline ? 1.0f : 0.5f);

        holder.btnCall.setEnabled(isAudioOnline);
        holder.btnCall.setAlpha(isAudioOnline ? 1.0f : 0.5f);

        if (astro.getSkills() != null && astro.getSkills().length > 0) {
            StringBuilder sb = new StringBuilder();
            for (String s : astro.getSkills())
                sb.append(s).append(", ");
            holder.tvSkills.setText(sb.toString().replaceAll(", $", ""));
        } else {
            holder.tvSkills.setText("Astrology");
        }

        // Load Image using Glide
        if (astro.getImage() != null && !astro.getImage().isEmpty()) {
            String imageUrl = astro.getImage();
            if (imageUrl.startsWith("/")) {
                imageUrl = "https://astro5star.com" + imageUrl;
            }
            Glide.with(context).load(imageUrl).placeholder(R.mipmap.ic_launcher).into(holder.ivAstrologer);
        }

        holder.btnChat.setOnClickListener(v -> {
            if (!isChatOnline) {
                android.widget.Toast.makeText(context, "Chat is currently offline", android.widget.Toast.LENGTH_SHORT)
                        .show();
                return;
            }

            Intent intent = new Intent(context, ChatActivity.class);
            intent.putExtra("PARTNER_ID", astro.getUserId());
            intent.putExtra("PARTNER_NAME", astro.getName());
            context.startActivity(intent);
        });

        holder.btnCall.setOnClickListener(v -> {
            if (!isAudioOnline) {
                android.widget.Toast.makeText(context, "Call is currently offline", android.widget.Toast.LENGTH_SHORT)
                        .show();
                return;
            }

            Intent intent = new Intent(context, CallActivity.class);
            intent.putExtra("PARTNER_ID", astro.getUserId());
            intent.putExtra("PARTNER_NAME", astro.getName());
            intent.putExtra("IS_INCOMING", false);
            intent.putExtra("CALL_TYPE", "audio");
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
        View viewOnlineIndicator;

        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            tvName = itemView.findViewById(R.id.tvName);
            tvSkills = itemView.findViewById(R.id.tvSkills);
            tvPrice = itemView.findViewById(R.id.tvPrice);
            ivAstrologer = itemView.findViewById(R.id.ivAstrologer);
            btnCall = itemView.findViewById(R.id.btnCall);
            btnChat = itemView.findViewById(R.id.btnChat);
            viewOnlineIndicator = itemView.findViewById(R.id.viewOnlineIndicator);
        }
    }
}
