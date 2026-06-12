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
}
