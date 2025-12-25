package com.astro5star.app.model;

public class LoginResponse {
    private boolean ok;
    private String error;
    private String userId;
    private String name;
    private String role;
    private String phone;
    private double walletBalance;
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

    public double getWalletBalance() {
        return walletBalance;
    }

    public String getImage() {
        return image;
    }
}
