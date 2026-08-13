package com.skillbridge.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class PaymentNotifyRequest {
    @NotBlank(message = "Time is required")
    private String time;

    @NotBlank(message = "Venue is required")
    private String venue;

    public PaymentNotifyRequest() {
    }

    public PaymentNotifyRequest(String time, String venue) {
        this.time = time;
        this.venue = venue;
    }

    public String getTime() {
        return time;
    }

    public void setTime(String time) {
        this.time = time;
    }

    public String getVenue() {
        return venue;
    }

    public void setVenue(String venue) {
        this.venue = venue;
    }
}
