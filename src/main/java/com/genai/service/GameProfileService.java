package com.genai.service;

import java.util.List;
import java.util.Map;
import java.util.Set;

import com.genai.model.ChildPet;
import com.genai.model.GameProfileDAO;
import com.genai.model.Pet;
import com.genai.model.PetInteractionCooldown;
import com.genai.model.PetInteractionResult;

public class GameProfileService {
    private static final Set<String> CHARACTER_PRESETS =
            Set.of("forest", "space", "ocean");
    private static final Map<String, Integer> INTERACTION_EXP = Map.of(
            "touch", 5,
            "praise", 15,
            "play", 10,
            "magic", 20);

    private final GameProfileDAO gameProfileDAO;

    public GameProfileService() {
        this(new GameProfileDAO());
    }

    GameProfileService(GameProfileDAO gameProfileDAO) {
        this.gameProfileDAO = gameProfileDAO;
    }

    public List<Pet> findStarterPets() {
        return gameProfileDAO.findStarterPets();
    }

    public void completeInitialSetup(
            Long childId, String nickname, String characterPreset, Long petId) {
        completeInitialSetup(childId, nickname, characterPreset, null, petId);
    }

    public void completeInitialSetup(Long childId, String nickname,
            String characterPreset, String characterImageUrl, Long petId) {
        validateNickname(nickname);
        if (!CHARACTER_PRESETS.contains(characterPreset)) {
            throw new IllegalArgumentException("선택할 수 없는 캐릭터입니다.");
        }
        String imageUrl = validateCharacterImageUrl(characterImageUrl)
                ? characterImageUrl
                : "/assets/characters/avatar-smile-none.svg";
        gameProfileDAO.completeInitialSetup(childId, nickname.trim(), imageUrl, petId);
    }

    public ChildPet findActivePet(Long childId) {
        return gameProfileDAO.findActivePet(childId);
    }

    public List<ChildPet> findOwnedPets(Long childId) {
        return gameProfileDAO.findOwnedPets(childId);
    }

    public ChildPet switchActivePet(Long childId, Long petId) {
        if (petId == null || petId <= 0) {
            throw new IllegalArgumentException("대표 펫으로 설정할 펫을 선택해 주세요.");
        }
        return gameProfileDAO.switchActivePet(childId, petId);
    }

    public PetInteractionResult interactWithPet(Long childId, String action) {
        Integer expAmount = INTERACTION_EXP.get(action);
        if (expAmount == null) {
            throw new IllegalArgumentException("지원하지 않는 펫 상호작용입니다.");
        }
        return gameProfileDAO.interactWithActivePet(childId, action, expAmount);
    }

    public List<PetInteractionCooldown> findInteractionCooldowns(Long childId) {
        return gameProfileDAO.findInteractionCooldowns(childId);
    }

    private void validateNickname(String nickname) {
        if (nickname == null || nickname.trim().isBlank() || nickname.trim().length() > 50) {
            throw new IllegalArgumentException("아이 닉네임을 1자 이상 50자 이하로 입력해 주세요.");
        }
    }

    private boolean validateCharacterImageUrl(String imageUrl) {
        return imageUrl != null
                && (imageUrl.matches("/assets/characters/avatar-(smile|focus|curious)-(wear|none)\\.svg")
                || imageUrl.matches("/media/generated/[a-f0-9\\-]{36}\\.png"));
    }
}
