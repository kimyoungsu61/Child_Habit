package com.genai.model;

public class ProfileFrame {
    private Long frameId;
    private String frameType;
    private String frameName;
    private String frameImageUrl;
    private int requiredBadgeCount;

    public Long getFrameId() {
        return frameId;
    }

    public void setFrameId(Long frameId) {
        this.frameId = frameId;
    }

    public String getFrameType() {
        return frameType;
    }

    public void setFrameType(String frameType) {
        this.frameType = frameType;
    }

    public String getFrameName() {
        return frameName;
    }

    public void setFrameName(String frameName) {
        this.frameName = frameName;
    }

    public String getFrameImageUrl() {
        return frameImageUrl;
    }

    public void setFrameImageUrl(String frameImageUrl) {
        this.frameImageUrl = frameImageUrl;
    }

    public int getRequiredBadgeCount() {
        return requiredBadgeCount;
    }

    public void setRequiredBadgeCount(int requiredBadgeCount) {
        this.requiredBadgeCount = requiredBadgeCount;
    }
}
