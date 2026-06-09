package com.genai.model;

public class BoxOpenResult {
    private Long submissionId;
    private String boxGrade;
    private int expAmount;
    private int currentLevel;
    private int currentExp;

    public Long getSubmissionId() {
        return submissionId;
    }

    public void setSubmissionId(Long submissionId) {
        this.submissionId = submissionId;
    }

    public String getBoxGrade() {
        return boxGrade;
    }

    public void setBoxGrade(String boxGrade) {
        this.boxGrade = boxGrade;
    }

    public int getExpAmount() {
        return expAmount;
    }

    public void setExpAmount(int expAmount) {
        this.expAmount = expAmount;
    }

    public int getCurrentLevel() {
        return currentLevel;
    }

    public void setCurrentLevel(int currentLevel) {
        this.currentLevel = currentLevel;
    }

    public int getCurrentExp() {
        return currentExp;
    }

    public void setCurrentExp(int currentExp) {
        this.currentExp = currentExp;
    }
}
