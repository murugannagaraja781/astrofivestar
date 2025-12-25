package com.astro5star.app.model;

public class ChatMessage {
    private String fromUserId;
    private String toUserId;
    private String text;
    private long timestamp;

    // For local use
    private boolean isSentByMe;

    public ChatMessage(String fromUserId, String toUserId, String text, long timestamp) {
        this.fromUserId = fromUserId;
        this.toUserId = toUserId;
        this.text = text;
        this.timestamp = timestamp;
    }

    public String getText() {
        return text;
    }

    public String getFromUserId() {
        return fromUserId;
    }

    public void setSentByMe(boolean sentByMe) {
        isSentByMe = sentByMe;
    }

    public boolean isSentByMe() {
        return isSentByMe;
    }
}
