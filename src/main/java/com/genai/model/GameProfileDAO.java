package com.genai.model;

import java.util.List;

import org.apache.ibatis.session.SqlSession;

import com.genai.database.SqlSessionManager;
import com.genai.mapper.GameProfileMapper;

public class GameProfileDAO {
    public List<Pet> findStarterPets() {
        try (SqlSession session = SqlSessionManager.getFactory().openSession()) {
            return session.getMapper(GameProfileMapper.class).findStarterPets();
        }
    }

    public void completeInitialSetup(
            Long childId, String nickname, String characterImageUrl, Long petId) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession(false)) {
            GameProfileMapper mapper = session.getMapper(GameProfileMapper.class);
            if (mapper.findStarterPetById(petId) == null) {
                throw new IllegalArgumentException("선택할 수 없는 기본 펫입니다.");
            }
            if (mapper.updateNickname(childId, nickname) != 1) {
                throw new IllegalArgumentException("아이 프로필을 찾을 수 없습니다.");
            }
            if (mapper.updateCharacterImage(childId, characterImageUrl) != 1) {
                throw new IllegalArgumentException("아이 프로필을 찾을 수 없습니다.");
            }
            if (mapper.countOwnedPet(childId, petId) == 0) {
                ChildPet childPet = new ChildPet();
                childPet.setChildId(childId);
                childPet.setPetId(petId);
                mapper.insertChildPet(childPet);
            }
            mapper.deactivateChildPets(childId);
            if (mapper.activateChildPet(childId, petId) != 1) {
                throw new IllegalStateException("대표 펫을 설정하지 못했습니다.");
            }
            session.commit();
        }
    }

    public ChildPet findActivePet(Long childId) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession()) {
            return session.getMapper(GameProfileMapper.class).findActivePet(childId);
        }
    }

    public List<ChildPet> findOwnedPets(Long childId) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession()) {
            return session.getMapper(GameProfileMapper.class).findOwnedPets(childId);
        }
    }

    public ChildPet switchActivePet(Long childId, Long petId) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession(false)) {
            GameProfileMapper mapper = session.getMapper(GameProfileMapper.class);
            if (mapper.countOwnedPet(childId, petId) != 1) {
                session.rollback();
                throw new IllegalArgumentException("보유 중인 펫만 대표 펫으로 설정할 수 있습니다.");
            }
            mapper.deactivateChildPets(childId);
            if (mapper.activateChildPet(childId, petId) != 1) {
                session.rollback();
                throw new IllegalStateException("대표 펫을 설정하지 못했습니다.");
            }
            ChildPet activePet = mapper.findActivePet(childId);
            session.commit();
            return activePet;
        }
    }

    public ChildPet addExpToActivePet(Long childId, int expAmount) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession(false)) {
            GameProfileMapper mapper = session.getMapper(GameProfileMapper.class);
            if (mapper.addExpToActivePet(childId, expAmount) != 1) {
                session.rollback();
                throw new IllegalStateException("대표 펫의 경험치를 저장하지 못했습니다.");
            }
            Long nextPetId = mapper.findNextPetIdAfterActiveMaxed(childId);
            if (nextPetId != null) {
                mapper.unlockNextPetAfterActiveMaxed(childId);
                mapper.deactivateChildPets(childId);
                if (mapper.activateChildPet(childId, nextPetId) != 1) {
                    session.rollback();
                    throw new IllegalStateException("다음 펫을 대표 펫으로 설정하지 못했습니다.");
                }
            }
            ChildPet activePet = mapper.findActivePet(childId);
            session.commit();
            return activePet;
        }
    }

    public PetInteractionResult interactWithActivePet(
            Long childId, String actionType, int expAmount) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession(false)) {
            GameProfileMapper mapper = session.getMapper(GameProfileMapper.class);
            boolean expGranted = mapper.claimInteractionReward(childId, actionType) == 1;
            if (expGranted && mapper.addExpToActivePet(childId, expAmount) != 1) {
                session.rollback();
                throw new IllegalStateException("대표 펫의 경험치를 저장하지 못했습니다.");
            }
            if (expGranted) {
                Long nextPetId = mapper.findNextPetIdAfterActiveMaxed(childId);
                if (nextPetId != null) {
                    mapper.unlockNextPetAfterActiveMaxed(childId);
                    mapper.deactivateChildPets(childId);
                    if (mapper.activateChildPet(childId, nextPetId) != 1) {
                        session.rollback();
                        throw new IllegalStateException("다음 펫을 대표 펫으로 설정하지 못했습니다.");
                    }
                }
            }
            ChildPet activePet = mapper.findActivePet(childId);
            if (activePet == null) {
                session.rollback();
                throw new IllegalStateException("대표 펫을 찾을 수 없습니다.");
            }
            List<PetInteractionCooldown> cooldowns =
                    mapper.findInteractionCooldowns(childId);
            session.commit();
            return new PetInteractionResult(
                    activePet, expGranted, expGranted ? expAmount : 0, cooldowns);
        }
    }

    public void ensureAdminDemoProfile(Long childId) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession(false)) {
            GameProfileMapper mapper = session.getMapper(GameProfileMapper.class);
            Pet mongle = mapper.findPetById(1L);
            if (mongle == null) {
                throw new IllegalStateException("Admin demo pet mongle is missing.");
            }
            mapper.updateNickname(childId, "admin");
            mapper.updateCharacterImage(childId, "/assets/characters/avatar-smile-none.svg");
            if (mapper.countOwnedPet(childId, mongle.getPetId()) == 0) {
                ChildPet childPet = new ChildPet();
                childPet.setChildId(childId);
                childPet.setPetId(mongle.getPetId());
                mapper.insertChildPet(childPet);
            }
            mapper.deactivateChildPets(childId);
            if (mapper.activateChildPet(childId, mongle.getPetId()) != 1) {
                session.rollback();
                throw new IllegalStateException("Admin demo pet could not be activated.");
            }
            session.commit();
        }
    }

    public PetInteractionResult interactWithActivePetForAdminDemo(
            Long childId, String actionType, int levelAmount) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession(false)) {
            GameProfileMapper mapper = session.getMapper(GameProfileMapper.class);
            if (mapper.addLevelsToActivePet(childId, levelAmount) != 1) {
                session.rollback();
                throw new IllegalStateException("Admin demo pet level could not be updated.");
            }
            // 3. 몽글 만렙 확인하기 (전체 해금 트리거 확인)
            if (mapper.countActiveMongleMaxed(childId) > 0) {
                // 4. 전체 펫/뱃지/액자 해금하기 (시연용 상태 반영)
                mapper.unlockAllPetsMaxedForAdminDemo(childId);
            }
            ChildPet activePet = mapper.findActivePet(childId);
            if (activePet == null) {
                session.rollback();
                throw new IllegalStateException("????レ쓣 李얠쓣 ???놁뒿?덈떎.");
            }
            List<PetInteractionCooldown> cooldowns =
                    mapper.findInteractionCooldowns(childId);
            session.commit();
            return new PetInteractionResult(
                    activePet, true, levelAmount * 300, cooldowns);
        }
    }

    public List<PetInteractionCooldown> findInteractionCooldowns(Long childId) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession()) {
            return session.getMapper(GameProfileMapper.class)
                    .findInteractionCooldowns(childId);
        }
    }
}
