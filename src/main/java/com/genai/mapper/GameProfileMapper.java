package com.genai.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;

import com.genai.model.ChildPet;
import com.genai.model.Pet;

public interface GameProfileMapper {
    List<Pet> findStarterPets();

    Pet findStarterPetById(Long petId);

    int updateNickname(@Param("childId") Long childId, @Param("nickname") String nickname);

    int updateCharacterImage(@Param("childId") Long childId,
            @Param("characterImageUrl") String characterImageUrl);

    int countOwnedPet(@Param("childId") Long childId, @Param("petId") Long petId);

    int insertChildPet(ChildPet childPet);

    int deactivateChildPets(Long childId);

    int activateChildPet(@Param("childId") Long childId, @Param("petId") Long petId);

    ChildPet findActivePet(Long childId);

    List<ChildPet> findOwnedPets(Long childId);

    int addExpToActivePet(@Param("childId") Long childId, @Param("expAmount") int expAmount);

    Long findNextPetIdAfterActiveMaxed(Long childId);

    int unlockNextPetAfterActiveMaxed(Long childId);
}
