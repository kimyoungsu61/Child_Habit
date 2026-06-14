package com.genai.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.file.Path;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import com.genai.model.ChildPet;
import com.genai.model.Mission;
import com.genai.model.MissionDAO;
import com.genai.model.MissionSubmission;
import com.genai.model.RewardBox;

class MissionServiceTest {
    @TempDir
    Path tempDirectory;

    @Test
    void createsMissionWhenChildHasCapacity() {
        FakeMissionDAO dao = new FakeMissionDAO();
        MissionService service = service(dao);

        service.createMission(10L, 20L, "Clean room", "Before dinner", "middle", "photo");

        assertEquals(1, dao.createMissionCalls);
        assertEquals(10L, dao.createdMission.getParentId());
        assertEquals(20L, dao.createdMission.getChildId());
        assertEquals("Clean room", dao.createdMission.getMissionTitle());
        assertEquals("photo", dao.createdMission.getMediaType());
    }

    @Test
    void rejectsMissionWhenChildAlreadyHasFiveTodayAssignedMissions() {
        FakeMissionDAO dao = new FakeMissionDAO();
        dao.todayAssignedMissionCount = 5;
        MissionService service = service(dao);

        assertThrows(IllegalArgumentException.class,
                () -> service.createMission(10L, 20L, "Clean room", "", "low", "video"));
        assertEquals(0, dao.createMissionCalls);
    }

    @Test
    void createsMissionWhenOnlyPastAssignmentsFillOldActiveCapacity() {
        FakeMissionDAO dao = new FakeMissionDAO();
        dao.activeMissionCount = 5;
        dao.todayAssignedMissionCount = 0;
        MissionService service = service(dao);

        service.createMission(10L, 20L, "Clean room", "", "low", "video");

        assertEquals(1, dao.createMissionCalls);
    }

    @Test
    void createsMissionWhenTodayAssignedMissionsAreBelowLimit() {
        FakeMissionDAO dao = new FakeMissionDAO();
        dao.todayAssignedMissionCount = 4;
        MissionService service = service(dao);

        service.createMission(10L, 20L, "Clean room", "", "low", "video");

        assertEquals(1, dao.createMissionCalls);
    }

    @Test
    void submitsMatchingMissionOnlyOncePerDay() {
        FakeMissionDAO dao = new FakeMissionDAO();
        dao.childMission = mission(30L, "photo");
        MissionService service = service(dao);

        service.submit(20L, 30L, "photo", "/media/submissions/photo.jpg");

        assertEquals(1, dao.createSubmissionCalls);
        assertEquals(30L, dao.createdSubmission.getMissionId());

        dao.openSubmissionCount = 1;
        assertThrows(IllegalArgumentException.class,
                () -> service.submit(20L, 30L, "photo", "/media/submissions/again.jpg"));
    }

    @Test
    void rejectsSubmissionWithWrongMediaType() {
        FakeMissionDAO dao = new FakeMissionDAO();
        dao.childMission = mission(30L, "video");
        MissionService service = service(dao);

        assertThrows(IllegalArgumentException.class,
                () -> service.submit(20L, 30L, "photo", "/media/submissions/photo.jpg"));
        assertEquals(0, dao.createSubmissionCalls);
    }

    @Test
    void approvesAndRejectsPendingSubmissions() {
        FakeMissionDAO dao = new FakeMissionDAO();
        dao.pendingSubmission = submission(40L, "middle");
        FakeMissionMediaStorage storage = new FakeMissionMediaStorage(tempDirectory);
        MissionService service = new MissionService(dao, storage);

        assertTrue(service.approve(40L, 10L, "high"));
        assertEquals("approved", dao.reviewStatus);
        assertEquals("high", dao.reviewBoxGrade);
        assertTrue(storage.deleteCalled);

        storage.deleteCalled = false;
        dao.pendingSubmission = submission(41L, "low");
        assertTrue(service.reject(41L, 10L));
        assertEquals("rejected", dao.reviewStatus);
        assertEquals(null, dao.reviewBoxGrade);
        assertTrue(storage.deleteCalled);
    }

    @Test
    void opensBoxAsExpOnlyAndRejectsDuplicateOpen() {
        FakeMissionDAO dao = new FakeMissionDAO();
        dao.approvedSubmission = submission(50L, "high");
        dao.rewardBox = rewardBox("high", 42, 42);
        dao.openedPet = childPet(3, 642);
        MissionService service = service(dao);

        var result = service.openBox(20L, 50L);

        assertEquals(42, result.getExpAmount());
        assertEquals(3, result.getCurrentLevel());
        assertEquals(642, result.getCurrentExp());
        assertEquals(42, dao.lastExpAmount);

        dao.openedPet = null;
        assertThrows(IllegalArgumentException.class, () -> service.openBox(20L, 50L));
    }

    @Test
    void delegatesMediaAuthorizationToOwnershipQueries() {
        FakeMissionDAO dao = new FakeMissionDAO();
        dao.parentMediaAllowed = true;
        dao.childMediaAllowed = false;
        MissionService service = service(dao);

        assertTrue(service.canParentAccessMedia("/media/submissions/a.jpg", 10L));
        assertFalse(service.canChildAccessMedia("/media/submissions/a.jpg", 20L));
    }

    private MissionService service(FakeMissionDAO dao) {
        return new MissionService(dao, new FakeMissionMediaStorage(tempDirectory));
    }

    private static Mission mission(Long missionId, String mediaType) {
        Mission mission = new Mission();
        mission.setMissionId(missionId);
        mission.setMediaType(mediaType);
        return mission;
    }

    private static MissionSubmission submission(Long submissionId, String boxGrade) {
        MissionSubmission submission = new MissionSubmission();
        submission.setSubmissionId(submissionId);
        submission.setMissionId(30L);
        submission.setChildId(20L);
        submission.setBoxGrade(boxGrade);
        submission.setMediaUrl("/media/submissions/test.jpg");
        return submission;
    }

    private static RewardBox rewardBox(String grade, int minExp, int maxExp) {
        RewardBox box = new RewardBox();
        box.setBoxGrade(grade);
        box.setMinExp(minExp);
        box.setMaxExp(maxExp);
        return box;
    }

    private static ChildPet childPet(int level, int exp) {
        ChildPet pet = new ChildPet();
        pet.setCurrentLevel(level);
        pet.setCurrentExp(exp);
        return pet;
    }

    private static final class FakeMissionMediaStorage extends MissionMediaStorage {
        private boolean deleteCalled;

        private FakeMissionMediaStorage(Path rootDirectory) {
            super(rootDirectory);
        }

        @Override
        public boolean deleteByUrl(String mediaUrl) {
            deleteCalled = true;
            return true;
        }
    }

    private static final class FakeMissionDAO extends MissionDAO {
        private int activeMissionCount;
        private int todayAssignedMissionCount;
        private int openSubmissionCount;
        private int createMissionCalls;
        private int createSubmissionCalls;
        private int lastExpAmount;
        private boolean parentMediaAllowed;
        private boolean childMediaAllowed;
        private Mission createdMission;
        private Mission childMission;
        private MissionSubmission createdSubmission;
        private MissionSubmission pendingSubmission;
        private MissionSubmission approvedSubmission;
        private RewardBox rewardBox;
        private ChildPet openedPet;
        private String reviewStatus;
        private String reviewBoxGrade;

        @Override
        public int countActiveMissionsByChild(Long childId) {
            return activeMissionCount;
        }

        @Override
        public int countTodayAssignedMissionsByChild(Long childId) {
            return todayAssignedMissionCount;
        }

        @Override
        public void createMission(Mission mission) {
            createMissionCalls++;
            createdMission = mission;
        }

        @Override
        public int countTodaySubmissionsByChild(Long childId) {
            return 0;
        }

        @Override
        public Mission findMissionForChild(Long missionId, Long childId) {
            return childMission;
        }

        @Override
        public int countOpenSubmissionForMissionToday(Long childId, Long missionId) {
            return openSubmissionCount;
        }

        @Override
        public void createSubmission(MissionSubmission submission) {
            createSubmissionCalls++;
            createdSubmission = submission;
        }

        @Override
        public MissionSubmission findPendingForReview(Long submissionId, Long parentId) {
            return pendingSubmission;
        }

        @Override
        public boolean review(Long submissionId, Long parentId, String status,
                String boxGrade, boolean deleteMedia) {
            reviewStatus = status;
            reviewBoxGrade = boxGrade;
            return true;
        }

        @Override
        public MissionSubmission findApprovedRewardForChild(Long submissionId, Long childId) {
            return approvedSubmission;
        }

        @Override
        public RewardBox findRewardBoxByGrade(String boxGrade) {
            return rewardBox;
        }

        @Override
        public ChildPet openRewardBox(Long childId, Long submissionId,
                String boxGrade, int expAmount) {
            lastExpAmount = expAmount;
            return openedPet;
        }

        @Override
        public boolean canParentAccessMedia(String mediaUrl, Long parentId) {
            return parentMediaAllowed;
        }

        @Override
        public boolean canChildAccessMedia(String mediaUrl, Long childId) {
            return childMediaAllowed;
        }
    }
}
