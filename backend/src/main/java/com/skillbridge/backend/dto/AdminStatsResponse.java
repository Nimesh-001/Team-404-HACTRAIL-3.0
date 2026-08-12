package com.skillbridge.backend.dto;

public class AdminStatsResponse {
    private long totalStudents;
    private long totalPartners;
    private long totalGigs;
    private long approvedGigs;
    private double economicImpact;

    public AdminStatsResponse() {
    }

    public AdminStatsResponse(long totalStudents, long totalPartners, long totalGigs, long approvedGigs, double economicImpact) {
        this.totalStudents = totalStudents;
        this.totalPartners = totalPartners;
        this.totalGigs = totalGigs;
        this.approvedGigs = approvedGigs;
        this.economicImpact = economicImpact;
    }

    public long getTotalStudents() {
        return totalStudents;
    }

    public void setTotalStudents(long totalStudents) {
        this.totalStudents = totalStudents;
    }

    public long getTotalPartners() {
        return totalPartners;
    }

    public void setTotalPartners(long totalPartners) {
        this.totalPartners = totalPartners;
    }

    public long getTotalGigs() {
        return totalGigs;
    }

    public void setTotalGigs(long totalGigs) {
        this.totalGigs = totalGigs;
    }

    public long getApprovedGigs() {
        return approvedGigs;
    }

    public void setApprovedGigs(long approvedGigs) {
        this.approvedGigs = approvedGigs;
    }

    public double getEconomicImpact() {
        return economicImpact;
    }

    public void setEconomicImpact(double economicImpact) {
        this.economicImpact = economicImpact;
    }
}
