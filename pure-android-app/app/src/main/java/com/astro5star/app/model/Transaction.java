package com.astro5star.app.model;

public class Transaction {
    private String id;
    private String amount;
    private String date;
    private String status;
    private String transactionId;

    public Transaction(String id, String amount, String date, String status, String transactionId) {
        this.id = id;
        this.amount = amount;
        this.date = date;
        this.status = status;
        this.transactionId = transactionId;
    }

    public String getId() { return id; }
    public String getAmount() { return amount; }
    public String getDate() { return date; }
    public String getStatus() { return status; }
    public String getTransactionId() { return transactionId; }
}
