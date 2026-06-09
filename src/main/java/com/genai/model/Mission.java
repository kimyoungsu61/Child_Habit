package com.genai.model;

import java.time.LocalDateTime;

public class Mission {
    private Long missionId;
    private Long parentId;
    private Long childId;
    private String missionTitle;
    private String missionDescription;
    private String missionGrade;
    private String mediaType;
    private String isActive;
    private LocalDateTime createdAt;
    private String childNickname;

    public Long getMissionId() {
        return missionId;
    }

    public void setMissionId(Long missionId) {
        this.missionId = missionId;
    }

    public Long getParentId() {
        return parentId;
    }

    public void setParentId(Long parentId) {
        this.parentId = parentId;
    }

    public Long getChildId() {
        return childId;
    }

    public void setChildId(Long childId) {
        this.childId = childId;
    }

    public String getMissionTitle() {
        return missionTitle;
    }

    public void setMissionTitle(String missionTitle) {
        this.missionTitle = missionTitle;
    }

    public String getMissionDescription() {
        return missionDescription;
    }

    public void setMissionDescription(String missionDescription) {
        this.missionDescription = missionDescription;
    }

    public String getMissionGrade() {
        return missionGrade;
    }

    public void setMissionGrade(String missionGrade) {
        this.missionGrade = missionGrade;
    }

    public String getMediaType() {
        return mediaType;
    }

    public void setMediaType(String mediaType) {
        this.mediaType = mediaType;
    }

    public String getIsActive() {
        return isActive;
    }

    public void setIsActive(String isActive) {
        this.isActive = isActive;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getChildNickname() {
        return childNickname;
    }

    public void setChildNickname(String childNickname) {
        this.childNickname = childNickname;
    }
}
