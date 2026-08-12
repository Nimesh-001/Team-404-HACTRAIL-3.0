package com.skillbridge.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class AdminMessageRequest {
    @NotNull(message = "Recipient ID is required")
    private Long recipientId;

    @NotBlank(message = "Message Content is required")
    private String messageContent;

    public AdminMessageRequest() {
    }

    public Long getRecipientId() {
        return recipientId;
    }

    public void setRecipientId(Long recipientId) {
        this.recipientId = recipientId;
    }

    public String getMessageContent() {
        return messageContent;
    }

    public void setMessageContent(String messageContent) {
        this.messageContent = messageContent;
    }
}
