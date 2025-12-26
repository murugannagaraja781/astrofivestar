package com.astro5star.app.model;

public class LoginResponse {
    private boolean ok;
    private String error;
    private String userId;
    private String name;
    private String role;
    private Integer walletBalance; // ✅ Changed to Integer (nullable)
    private Integer totalEarnings; // ✅ Changed to Integer (nullable)
    private String image;

    public boolean isOk() {
        return ok;
    }

    public String getError() {
        return error;
    }

    public String getUserId() {
        return userId;
    }

    public String getName() {
        return name;
    }

    public String getRole() {
        return role;
    }

    // ✅ Safe getter with default value
    public int getWalletBalance() {
        return walletBalance != null ? walletBalance : 0;
    }

    // ✅ Safe getter with default value
    public int getTotalEarnings() {
        return totalEarnings != null ? totalEarnings : 0;
    }

    public String getImage() {
        return image;
    }
}
