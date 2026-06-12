package com.genai.model;

import java.time.LocalDateTime;

public class PetInteractionCooldown {
    private String actionType;
    private LocalDateTime lastRewardedAt;

    public String getActionType() {
        return actionType;
    }

    public void setActionType(String actionType) {
        this.actionType = actionType;
    }

    public LocalDateTime getLastRewardedAt() {
        return lastRewardedAt;
    }

    public void setLastRewardedAt(LocalDateTime lastRewardedAt) {
        this.lastRewardedAt = lastRewardedAt;
    }
}
