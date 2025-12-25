package com.astro5star.app.model;

import com.google.gson.annotations.SerializedName;
import java.util.List;

public class AstrologerListResponse {
    @SerializedName("ok")
    public boolean ok;
    @SerializedName("astrologers")
    public List<Astrologer> astrologers;

    public boolean isOk() {
        return ok;
    }

    public List<Astrologer> getAstrologers() {
        return astrologers;
    }
}
