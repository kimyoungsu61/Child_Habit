package com.genai.model;

import java.util.List;

public class PetInteractionResult {
    private final ChildPet activePet;
    private final boolean expGranted;
    private final int expAmount;
    private final List<PetInteractionCooldown> cooldowns;

    public PetInteractionResult(ChildPet activePet, boolean expGranted, int expAmount,
            List<PetInteractionCooldown> cooldowns) {
        this.activePet = activePet;
        this.expGranted = expGranted;
        this.expAmount = expAmount;
        this.cooldowns = cooldowns;
    }

    public ChildPet getActivePet() {
        return activePet;
    }

    public boolean isExpGranted() {
        return expGranted;
    }

    public int getExpAmount() {
        return expAmount;
    }

    public List<PetInteractionCooldown> getCooldowns() {
        return cooldowns;
    }
}
