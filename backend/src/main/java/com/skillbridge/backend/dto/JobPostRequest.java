package com.skillbridge.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class JobPostRequest {
    @NotBlank(message = "Job Title is required")
    private String title;

    @NotBlank(message = "Job Description is required")
    private String description;

    @NotBlank(message = "Requirements are required")
    private String requirements;

    @NotBlank(message = "Price Range is required")
    private String priceRange;

    private String type = "JOB";

    private Integer vacancies = 1;

    private Integer maxApplications = 100;

    public JobPostRequest() {
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getRequirements() {
        return requirements;
    }

    public void setRequirements(String requirements) {
        this.requirements = requirements;
    }

    public String getPriceRange() {
        return priceRange;
    }

    public void setPriceRange(String priceRange) {
        this.priceRange = priceRange;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Integer getVacancies() {
        return vacancies;
    }

    public void setVacancies(Integer vacancies) {
        this.vacancies = vacancies;
    }

    public Integer getMaxApplications() {
        return maxApplications;
    }

    public void setMaxApplications(Integer maxApplications) {
        this.maxApplications = maxApplications;
    }
}
