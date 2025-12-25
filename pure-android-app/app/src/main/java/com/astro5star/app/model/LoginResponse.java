package com.astro5star.app.model;

public class LoginResponse {
    private boolean ok;
    private String error;
    private String userId;
    private String name;
    private String role;
    private int walletBalance;
    private int totalEarnings;

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

    public int getWalletBalance() {
        return walletBalance;
    }

    public int getTotalEarnings() {
        return totalEarnings;
    }
}
