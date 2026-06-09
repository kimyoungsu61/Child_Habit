package com.genai.model;

import java.time.LocalDateTime;

public class ChildPet {
    private Long childPetId;
    private Long childId;
    private Long petId;
    private int currentLevel;
    private int currentExp;
    private String isActive;
    private String isMaxed;
    private String badgeAcquired;
    private LocalDateTime badgeAcquiredAt;
    private LocalDateTime acquiredAt;
    private Pet pet;

    public Long getChildPetId() {
        return childPetId;
    }

    public void setChildPetId(Long childPetId) {
        this.childPetId = childPetId;
    }

    public Long getChildId() {
        return childId;
    }

    public void setChildId(Long childId) {
        this.childId = childId;
    }

    public Long getPetId() {
        return petId;
    }

    public void setPetId(Long petId) {
        this.petId = petId;
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

    public String getIsActive() {
        return isActive;
    }

    public void setIsActive(String isActive) {
        this.isActive = isActive;
    }

    public String getIsMaxed() {
        return isMaxed;
    }

    public void setIsMaxed(String isMaxed) {
        this.isMaxed = isMaxed;
    }

    public String getBadgeAcquired() {
        return badgeAcquired;
    }

    public void setBadgeAcquired(String badgeAcquired) {
        this.badgeAcquired = badgeAcquired;
    }

    public LocalDateTime getBadgeAcquiredAt() {
        return badgeAcquiredAt;
    }

    public void setBadgeAcquiredAt(LocalDateTime badgeAcquiredAt) {
        this.badgeAcquiredAt = badgeAcquiredAt;
    }

    public LocalDateTime getAcquiredAt() {
        return acquiredAt;
    }

    public void setAcquiredAt(LocalDateTime acquiredAt) {
        this.acquiredAt = acquiredAt;
    }

    public Pet getPet() {
        return pet;
    }

    public void setPet(Pet pet) {
        this.pet = pet;
    }
}
