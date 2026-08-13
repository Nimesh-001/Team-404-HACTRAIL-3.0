package com.skillbridge.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

@Entity
@Table(name = "job_posts")
public class JobPost {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false)
    private String title;

    @NotBlank
    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(columnDefinition = "TEXT", nullable = true)
    private String requirements;

    @Column(name = "price_range", nullable = true)
    private String priceRange;

    private String status = "PENDING";

    @Column(nullable = false)
    private String type = "JOB";

    private Integer vacancies = 1;

    @Column(name = "max_applications")
    private Integer maxApplications = 100;

    @Column(name = "application_count")
    private Integer applicationCount = 0;

    @Column(name = "bank_slip", columnDefinition = "LONGTEXT")
    private String bankSlip;

    @Column(name = "signed_report_slip", columnDefinition = "LONGTEXT")
    private String signedReportSlip;

    @Column(name = "website_link")
    private String websiteLink;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "posted_by_id", nullable = false)
    private User postedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public JobPost() {
    }

    public JobPost(String title, String description, String requirements, String priceRange, User postedBy) {
        this.title = title;
        this.description = description;
        this.requirements = requirements;
        this.priceRange = priceRange;
        this.postedBy = postedBy;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public User getPostedBy() {
        return postedBy;
    }

    public void setPostedBy(User postedBy) {
        this.postedBy = postedBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
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

    public Integer getApplicationCount() {
        return applicationCount;
    }

    public void setApplicationCount(Integer applicationCount) {
        this.applicationCount = applicationCount;
    }

    public String getBankSlip() {
        return bankSlip;
    }

    public void setBankSlip(String bankSlip) {
        this.bankSlip = bankSlip;
    }

    public String getSignedReportSlip() {
        return signedReportSlip;
    }

    public void setSignedReportSlip(String signedReportSlip) {
        this.signedReportSlip = signedReportSlip;
    }

    public String getWebsiteLink() {
        return websiteLink;
    }

    public void setWebsiteLink(String websiteLink) {
        this.websiteLink = websiteLink;
    }
}
