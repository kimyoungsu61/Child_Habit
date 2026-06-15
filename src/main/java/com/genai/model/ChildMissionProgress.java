package com.genai.model;

public class ChildMissionProgress {
    private static final int DAILY_ASSIGNMENT_LIMIT = 5;

    private Long childId;
    private String childNickname;
    private int assignedCount;
    private int pendingCount;
    private int approvedCount;
    private int rejectedCount;

    public Long getChildId() {
        return childId;
    }

    public void setChildId(Long childId) {
        this.childId = childId;
    }

    public String getChildNickname() {
        return childNickname;
    }

    public void setChildNickname(String childNickname) {
        this.childNickname = childNickname;
    }

    public int getAssignedCount() {
        return assignedCount;
    }

    public void setAssignedCount(int assignedCount) {
        this.assignedCount = assignedCount;
    }

    public int getPendingCount() {
        return pendingCount;
    }

    public void setPendingCount(int pendingCount) {
        this.pendingCount = pendingCount;
    }

    public int getApprovedCount() {
        return approvedCount;
    }

    public void setApprovedCount(int approvedCount) {
        this.approvedCount = approvedCount;
    }

    public int getRejectedCount() {
        return rejectedCount;
    }

    public void setRejectedCount(int rejectedCount) {
        this.rejectedCount = rejectedCount;
    }

    public int getCompletedCount() {
        return approvedCount;
    }

    public int getDailyLimit() {
        return DAILY_ASSIGNMENT_LIMIT;
    }

    public int getAssignmentRemainingCount() {
        return Math.max(0, DAILY_ASSIGNMENT_LIMIT - assignedCount);
    }

    public int getRemainingCount() {
        return getAssignmentRemainingCount();
    }
}
