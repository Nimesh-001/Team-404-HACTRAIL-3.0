package com.skillbridge.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class CloseJobRequest {
    @NotBlank(message = "Signed report slip image is required")
    private String signedReportSlip;

    public CloseJobRequest() {
    }

    public CloseJobRequest(String signedReportSlip) {
        this.signedReportSlip = signedReportSlip;
    }

    public String getSignedReportSlip() {
        return signedReportSlip;
    }

    public void setSignedReportSlip(String signedReportSlip) {
        this.signedReportSlip = signedReportSlip;
    }
}
