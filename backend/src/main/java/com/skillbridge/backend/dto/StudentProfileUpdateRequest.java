package com.skillbridge.backend.dto;

import jakarta.validation.constraints.Size;

public class StudentProfileUpdateRequest {
    @Size(max = 1000, message = "Bio cannot exceed 1000 characters")
    private String bio;

    private String profilePhoto;

    @Size(max = 255, message = "GitHub link is too long")
    private String githubLink;

    @Size(max = 255, message = "LinkedIn link is too long")
    private String linkedinLink;

    private String skills;

    public StudentProfileUpdateRequest() {
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

    public String getGithubLink() {
        return githubLink;
    }

    public void setGithubLink(String githubLink) {
        this.githubLink = githubLink;
    }

    public String getLinkedinLink() {
        return linkedinLink;
    }

    public void setLinkedinLink(String linkedinLink) {
        this.linkedinLink = linkedinLink;
    }

    private String password;

    public String getSkills() {
        return skills;
    }

    public void setSkills(String skills) {
        this.skills = skills;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
