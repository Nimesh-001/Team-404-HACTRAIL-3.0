package com.skillbridge.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class JobApplicationRequest {

    @NotBlank(message = "LinkedIn URL is required")
    private String linkedinUrl;

    private String coverLetter;

    public JobApplicationRequest() {
    }

    public String getLinkedinUrl() {
        return linkedinUrl;
    }

    public void setLinkedinUrl(String linkedinUrl) {
        this.linkedinUrl = linkedinUrl;
    }

    public String getCoverLetter() {
        return coverLetter;
    }

    public void setCoverLetter(String coverLetter) {
        this.coverLetter = coverLetter;
    }
}
