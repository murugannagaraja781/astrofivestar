package com.astro5star.app.model;

public class WebRTCSignal {

    // Signal types
    public static final String TYPE_OFFER = "offer";
    public static final String TYPE_ANSWER = "answer";
    public static final String TYPE_ICE_CANDIDATE = "ice-candidate";

    private String type;
    private String sdp; // Session Description Protocol
    private String candidate; // ICE candidate
    private String sdpMid;
    private int sdpMLineIndex;
    private String partnerId;

    // For SDP Offer/Answer
    public WebRTCSignal(String type, String sdp, String partnerId) {
        this.type = type;
        this.sdp = sdp;
        this.partnerId = partnerId;
    }

    // For ICE Candidate
    public WebRTCSignal(String type, String candidate, String sdpMid, int sdpMLineIndex, String partnerId) {
        this.type = type;
        this.candidate = candidate;
        this.sdpMid = sdpMid;
        this.sdpMLineIndex = sdpMLineIndex;
        this.partnerId = partnerId;
    }

    public String getType() {
        return type;
    }

    public String getSdp() {
        return sdp;
    }

    public String getCandidate() {
        return candidate;
    }

    public String getSdpMid() {
        return sdpMid;
    }

    public int getSdpMLineIndex() {
        return sdpMLineIndex;
    }

    public String getPartnerId() {
        return partnerId;
    }
}
