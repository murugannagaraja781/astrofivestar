package com.astro5star.app.model;

public class Astrologer {
    private String userId;
    private String name;
    private String role;
    private boolean isOnline;
    private String image;
    private int price;
    private String[] skills;

    public String getUserId() {
        return userId;
    }

    public String getName() {
        return name;
    }

    public boolean isOnline() {
        return isOnline;
    }

    public String getImage() {
        return image;
    }

    public int getPrice() {
        return price;
    }

    public String[] getSkills() {
        return skills;
    }
}
