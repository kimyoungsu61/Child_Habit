package com.genai.model;

import java.time.LocalDateTime;

public class MissionSubmission {
    private Long submissionId;
    private Long missionId;
    private Long childId;
    private java.time.LocalDate missionDate;
    private String boxGrade;
    private String mediaType;
    private String mediaUrl;
    private String status;
    private LocalDateTime submittedAt;
    private LocalDateTime reviewedAt;
    private String rewardGiven;
    private LocalDateTime mediaDeletedAt;
    private String childNickname;

    public Long getSubmissionId() {
        return submissionId;
    }

    public void setSubmissionId(Long submissionId) {
        this.submissionId = submissionId;
    }

    public Long getMissionId() {
        return missionId;
    }

    public void setMissionId(Long missionId) {
        this.missionId = missionId;
    }

    public Long getChildId() {
        return childId;
    }

    public void setChildId(Long childId) {
        this.childId = childId;
    }

    public java.time.LocalDate getMissionDate() {
        return missionDate;
    }

    public void setMissionDate(java.time.LocalDate missionDate) {
        this.missionDate = missionDate;
    }

    public String getBoxGrade() {
        return boxGrade;
    }

    public void setBoxGrade(String boxGrade) {
        this.boxGrade = boxGrade;
    }

    public String getMediaType() {
        return mediaType;
    }

    public void setMediaType(String mediaType) {
        this.mediaType = mediaType;
    }

    public String getMediaUrl() {
        return mediaUrl;
    }

    public void setMediaUrl(String mediaUrl) {
        this.mediaUrl = mediaUrl;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }

    public LocalDateTime getReviewedAt() {
        return reviewedAt;
    }

    public void setReviewedAt(LocalDateTime reviewedAt) {
        this.reviewedAt = reviewedAt;
    }

    public String getRewardGiven() {
        return rewardGiven;
    }

    public void setRewardGiven(String rewardGiven) {
        this.rewardGiven = rewardGiven;
    }

    public LocalDateTime getMediaDeletedAt() {
        return mediaDeletedAt;
    }

    public void setMediaDeletedAt(LocalDateTime mediaDeletedAt) {
        this.mediaDeletedAt = mediaDeletedAt;
    }

    public String getChildNickname() {
        return childNickname;
    }

    public void setChildNickname(String childNickname) {
        this.childNickname = childNickname;
    }
}
