package com.genai.model;

public class RewardBox {
    private String boxGrade;
    private String boxName;
    private int minExp;
    private int maxExp;
    private double petDropRate;

    public String getBoxGrade() {
        return boxGrade;
    }

    public void setBoxGrade(String boxGrade) {
        this.boxGrade = boxGrade;
    }

    public String getBoxName() {
        return boxName;
    }

    public void setBoxName(String boxName) {
        this.boxName = boxName;
    }

    public int getMinExp() {
        return minExp;
    }

    public void setMinExp(int minExp) {
        this.minExp = minExp;
    }

    public int getMaxExp() {
        return maxExp;
    }

    public void setMaxExp(int maxExp) {
        this.maxExp = maxExp;
    }

    public double getPetDropRate() {
        return petDropRate;
    }

    public void setPetDropRate(double petDropRate) {
        this.petDropRate = petDropRate;
    }
}
