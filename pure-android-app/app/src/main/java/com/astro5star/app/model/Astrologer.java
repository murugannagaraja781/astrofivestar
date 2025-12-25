package com.astro5star.app.model;

public class Astrologer {
    private String userId;
    private String name;
    private String role;
    private boolean isOnline;
    private boolean chatOnline;
    private boolean audioOnline;
    private boolean videoOnline;
    private String image;
    private int price;
    private String[] skills;

    public String getUserId() {
        return userId;
    }

    public String getName() {
        return name;
    }

    public boolean isChatOnline() {
        return chatOnline;
    }

    public void setChatOnline(boolean chatOnline) {
        this.chatOnline = chatOnline;
    }

    public boolean isAudioOnline() {
        return audioOnline;
    }

    public void setAudioOnline(boolean audioOnline) {
        this.audioOnline = audioOnline;
    }

    public boolean isVideoOnline() {
        return videoOnline;
    }

    public void setVideoOnline(boolean videoOnline) {
        this.videoOnline = videoOnline;
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
