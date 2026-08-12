package com.skillbridge.backend.dto;

import jakarta.validation.constraints.Size;

public class JobPosterProfileUpdateRequest {
    @Size(max = 1000, message = "Bio cannot exceed 1000 characters")
    private String bio;

    private String profilePhoto;

    @Size(max = 100, message = "Current Position is too long")
    private String currentPosition;

    public JobPosterProfileUpdateRequest() {
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public String getProfilePhoto() {
        return profilePhoto;
    }

    public void setProfilePhoto(String profilePhoto) {
        this.profilePhoto = profilePhoto;
    }

    public String getCurrentPosition() {
        return currentPosition;
    }

    public void setCurrentPosition(String currentPosition) {
        this.currentPosition = currentPosition;
    }
}
