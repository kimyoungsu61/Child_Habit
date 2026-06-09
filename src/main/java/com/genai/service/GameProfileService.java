package com.genai.service;

import java.util.List;
import java.util.Set;

import com.genai.model.ChildPet;
import com.genai.model.GameProfileDAO;
import com.genai.model.Pet;

public class GameProfileService {
    private static final Set<String> CHARACTER_PRESETS =
            Set.of("forest", "space", "ocean");

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

    private void validateNickname(String nickname) {
        if (nickname == null || nickname.trim().isBlank() || nickname.trim().length() > 50) {
            throw new IllegalArgumentException("아이 닉네임을 1자 이상 50자 이하로 입력해 주세요.");
        }
    }

    private boolean validateCharacterImageUrl(String imageUrl) {
        return imageUrl != null
                && imageUrl.matches("/assets/characters/avatar-(smile|focus|curious)-(wear|none)\\.svg");
    }
}
