package com.skillbridge.backend.dto;

public class CandidateRating {
    private Long applicationId;
    private Integer rating;

    public CandidateRating() {
    }

    public CandidateRating(Long applicationId, Integer rating) {
        this.applicationId = applicationId;
        this.rating = rating;
    }

    public Long getApplicationId() {
        return applicationId;
    }

    public void setApplicationId(Long applicationId) {
        this.applicationId = applicationId;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }
}
