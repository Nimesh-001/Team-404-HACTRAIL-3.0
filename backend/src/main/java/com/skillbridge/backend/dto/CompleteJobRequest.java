package com.skillbridge.backend.dto;

import java.util.List;

public class CompleteJobRequest {
    private List<CandidateRating> ratings;

    public CompleteJobRequest() {
    }

    public CompleteJobRequest(List<CandidateRating> ratings) {
        this.ratings = ratings;
    }

    public List<CandidateRating> getRatings() {
        return ratings;
    }

    public void setRatings(List<CandidateRating> ratings) {
        this.ratings = ratings;
    }
}
