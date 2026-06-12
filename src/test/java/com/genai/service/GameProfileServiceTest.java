package com.genai.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

import com.genai.model.ChildPet;
import com.genai.model.GameProfileDAO;

class GameProfileServiceTest {
    @Test
    void awardsConfiguredExpForEachSupportedInteraction() {
        FakeGameProfileDAO dao = new FakeGameProfileDAO();
        GameProfileService service = new GameProfileService(dao);

        assertSame(dao.pet, service.addInteractionExp(7L, "touch"));
        assertEquals(5, dao.lastExp);
        service.addInteractionExp(7L, "praise");
        assertEquals(15, dao.lastExp);
        service.addInteractionExp(7L, "play");
        assertEquals(10, dao.lastExp);
        service.addInteractionExp(7L, "magic");
        assertEquals(20, dao.lastExp);
    }

    @Test
    void rejectsUnsupportedInteractionWithoutAddingExp() {
        FakeGameProfileDAO dao = new FakeGameProfileDAO();
        GameProfileService service = new GameProfileService(dao);

        assertThrows(IllegalArgumentException.class,
                () -> service.addInteractionExp(7L, "unknown"));
        assertEquals(0, dao.calls);
    }

    private static final class FakeGameProfileDAO extends GameProfileDAO {
        private final ChildPet pet = new ChildPet();
        private int calls;
        private int lastExp;

        @Override
        public ChildPet addExpToActivePet(Long childId, int expAmount) {
            calls++;
            lastExp = expAmount;
            return pet;
        }
    }
}
