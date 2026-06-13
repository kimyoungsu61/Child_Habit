package com.genai.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.Test;

import com.genai.model.ChildAccountDAO;
import com.genai.model.ChildProfile;
import com.genai.model.ProfileFrame;

class ChildAccountServiceTest {
    @Test
    void appliesFramesWhenRequiredBadgeCountsAreMet() {
        FakeChildAccountDAO dao = new FakeChildAccountDAO();
        dao.addFrame(1L, "wood", 0);
        dao.addFrame(2L, "iron", 2);
        dao.addFrame(3L, "gold", 3);
        dao.approvedSubmissionCount = 3;
        ChildAccountService service = new ChildAccountService(dao, new InviteCodeGenerator());

        service.updateFrame(1L, "wood", 1);
        assertEquals(1L, dao.lastFrameId);
        service.updateFrame(1L, "iron", 2);
        assertEquals(2L, dao.lastFrameId);
        service.updateFrame(1L, "gold", 3);
        assertEquals(3L, dao.lastFrameId);
        assertEquals(3, dao.updateCalls);
    }

    @Test
    void rejectsLockedOrUnknownFrames() {
        FakeChildAccountDAO dao = new FakeChildAccountDAO();
        dao.addFrame(2L, "iron", 1);
        dao.approvedSubmissionCount = 0;
        ChildAccountService service = new ChildAccountService(dao, new InviteCodeGenerator());

        assertThrows(IllegalArgumentException.class,
                () -> service.updateFrame(1L, "iron", 1));
        assertThrows(IllegalArgumentException.class,
                () -> service.updateFrame(1L, "crystal", 99));
        assertEquals(0, dao.updateCalls);
    }

    @Test
    void reportsFailureWhenFrameRowCannotBeApplied() {
        FakeChildAccountDAO dao = new FakeChildAccountDAO();
        dao.addFrame(1L, "wood", 0);
        dao.updateSucceeds = false;
        ChildAccountService service = new ChildAccountService(dao, new InviteCodeGenerator());

        assertThrows(IllegalArgumentException.class,
                () -> service.updateFrame(1L, "wood", 1));
        assertFalse(dao.updateSucceeds);
    }

    private static final class FakeChildAccountDAO extends ChildAccountDAO {
        private final ChildProfile child = new ChildProfile();
        private final Map<Long, ProfileFrame> framesById = new HashMap<>();
        private final Map<String, ProfileFrame> framesByType = new HashMap<>();
        private boolean updateSucceeds = true;
        private int approvedSubmissionCount;
        private int updateCalls;
        private Long lastFrameId;

        @Override
        public ProfileFrame findFrameById(Long frameId) {
            return framesById.get(frameId);
        }

        @Override
        public ProfileFrame findFrameByType(String frameType) {
            return framesByType.get(frameType);
        }

        @Override
        public int countApprovedSubmissions(Long childId) {
            return approvedSubmissionCount;
        }

        @Override
        public boolean updateFrameById(Long childId, Long frameId) {
            updateCalls++;
            lastFrameId = frameId;
            child.setChildId(childId);
            child.setFrameId(frameId);
            return updateSucceeds;
        }

        @Override
        public ChildProfile findById(Long childId) {
            return child;
        }

        private void addFrame(Long frameId, String frameType, int requiredBadgeCount) {
            ProfileFrame frame = new ProfileFrame();
            frame.setFrameId(frameId);
            frame.setFrameType(frameType);
            frame.setRequiredBadgeCount(requiredBadgeCount);
            framesById.put(frameId, frame);
            framesByType.put(frameType, frame);
        }
    }
}
