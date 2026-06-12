package com.genai.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.genai.model.ChildPet;
import com.genai.model.GameProfileDAO;
import com.genai.model.PetInteractionResult;

class GameProfileServiceTest {
    @Test
    void awardsConfiguredExpForEachSupportedInteraction() {
        FakeGameProfileDAO dao = new FakeGameProfileDAO();
        GameProfileService service = new GameProfileService(dao);

        assertSame(dao.pet, service.interactWithPet(7L, "touch").getActivePet());
        assertEquals(5, dao.lastExp);
        service.interactWithPet(7L, "praise");
        assertEquals(15, dao.lastExp);
        service.interactWithPet(7L, "play");
        assertEquals(10, dao.lastExp);
        service.interactWithPet(7L, "magic");
        assertEquals(20, dao.lastExp);
    }

    @Test
    void rejectsUnsupportedInteractionWithoutAddingExp() {
        FakeGameProfileDAO dao = new FakeGameProfileDAO();
        GameProfileService service = new GameProfileService(dao);

        assertThrows(IllegalArgumentException.class,
                () -> service.interactWithPet(7L, "unknown"));
        assertEquals(0, dao.calls);
    }

    private static final class FakeGameProfileDAO extends GameProfileDAO {
        private final ChildPet pet = new ChildPet();
        private int calls;
        private int lastExp;

        @Override
        public PetInteractionResult interactWithActivePet(
                Long childId, String actionType, int expAmount) {
            calls++;
            lastExp = expAmount;
            return new PetInteractionResult(pet, true, expAmount, List.of());
        }
    }
}
