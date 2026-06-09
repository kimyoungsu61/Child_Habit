package com.genai.model;

import java.time.LocalDateTime;

public class ChildInvite {
    private Long inviteId;
    private Long parentId;
    private String inviteCode;
    private String qrUrl;
    private LocalDateTime createdAt;
    private LocalDateTime regeneratedAt;

    public Long getInviteId() {
        return inviteId;
    }

    public void setInviteId(Long inviteId) {
        this.inviteId = inviteId;
    }

    public Long getParentId() {
        return parentId;
    }

    public void setParentId(Long parentId) {
        this.parentId = parentId;
    }

    public String getInviteCode() {
        return inviteCode;
    }

    public void setInviteCode(String inviteCode) {
        this.inviteCode = inviteCode;
    }

    public String getQrUrl() {
        return qrUrl;
    }

    public void setQrUrl(String qrUrl) {
        this.qrUrl = qrUrl;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getRegeneratedAt() {
        return regeneratedAt;
    }

    public void setRegeneratedAt(LocalDateTime regeneratedAt) {
        this.regeneratedAt = regeneratedAt;
    }
}
