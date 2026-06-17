package com.genai.model;

import java.util.List;
import java.util.Set;

import org.apache.ibatis.session.SqlSession;

import com.genai.database.SqlSessionManager;
import com.genai.mapper.GameProfileMapper;
import com.genai.mapper.MissionMapper;

public class MissionDAO {
    private static final Set<String> ADMIN_DEMO_BOX_GRADES =
            Set.of("low", "middle", "high");

    public void createMission(Mission mission) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession(false)) {
            MissionMapper mapper = session.getMapper(MissionMapper.class);
            int inserted = mapper.insertMission(mission);
            if (inserted != 1) {
                session.rollback();
                throw new IllegalStateException("미션이 저장되지 않았습니다.");
            }
            mapper.insertMissionAssignedNotification(mission);
            session.commit();
        }
    }

    public int countActiveMissionsByChild(Long childId) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession()) {
            return session.getMapper(MissionMapper.class).countActiveMissionsByChild(childId);
        }
    }

    public int countTodayAssignedMissionsByChild(Long childId) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession()) {
            return session.getMapper(MissionMapper.class).countTodayAssignedMissionsByChild(childId);
        }
    }

    public boolean updateMission(Mission mission) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession(false)) {
            int updated = session.getMapper(MissionMapper.class).updateMission(mission);
            if (updated == 1) {
                session.commit();
                return true;
            }
            session.rollback();
            return false;
        }
    }

    public boolean deactivateMission(Long missionId, Long parentId) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession(false)) {
            int updated = session.getMapper(MissionMapper.class)
                    .deactivateMission(missionId, parentId);
            if (updated == 1) {
                session.commit();
                return true;
            }
            session.rollback();
            return false;
        }
    }

    public boolean deleteMission(Long missionId, Long parentId) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession(false)) {
            MissionMapper mapper = session.getMapper(MissionMapper.class);
            mapper.deleteMissionNotifications(missionId, parentId);
            if (mapper.deleteMission(missionId, parentId) == 1) {
                session.commit();
                return true;
            }
            session.rollback();
            return false;
        }
    }

    public List<Mission> findMissionsForParent(Long parentId) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession()) {
            return session.getMapper(MissionMapper.class).findMissionsForParent(parentId);
        }
    }

    public List<Mission> findMissionsForChild(Long childId) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession()) {
            return session.getMapper(MissionMapper.class).findMissionsForChild(childId);
        }
    }

    public Mission findMissionForParent(Long missionId, Long parentId) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession()) {
            return session.getMapper(MissionMapper.class).findMissionForParent(missionId, parentId);
        }
    }

    public Mission findMissionForChild(Long missionId, Long childId) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession()) {
            return session.getMapper(MissionMapper.class).findMissionForChild(missionId, childId);
        }
    }

    public void createSubmission(MissionSubmission submission) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession(false)) {
            MissionMapper mapper = session.getMapper(MissionMapper.class);
            Long missionId = submission.getMissionId();
            if (missionId == null) {
                missionId = mapper.findDefaultMissionIdByChildId(submission.getChildId());
                if (missionId == null) {
                    mapper.insertDefaultMission(submission.getChildId());
                    missionId = mapper.findDefaultMissionIdByChildId(submission.getChildId());
                }
                if (missionId == null) {
                    throw new IllegalStateException("기본 미션을 생성하지 못했습니다.");
                }
                submission.setMissionId(missionId);
            }

            mapper.insertSubmission(submission);
            mapper.insertRewardRequestNotification(submission);
            session.commit();
        }
    }

    public List<MissionSubmission> findByChildId(Long childId) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession()) {
            return session.getMapper(MissionMapper.class).findByChildId(childId);
        }
    }

    public int countTodaySubmissionsByChild(Long childId) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession()) {
            return session.getMapper(MissionMapper.class).countTodaySubmissionsByChild(childId);
        }
    }

    public int countOpenSubmissionForMissionToday(Long childId, Long missionId) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession()) {
            return session.getMapper(MissionMapper.class)
                    .countOpenSubmissionForMissionToday(childId, missionId);
        }
    }

    public boolean canParentAccessMedia(String mediaUrl, Long parentId) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession()) {
            return session.getMapper(MissionMapper.class)
                    .countMediaAccessForParent(mediaUrl, parentId) > 0;
        }
    }

    public boolean canChildAccessMedia(String mediaUrl, Long childId) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession()) {
            return session.getMapper(MissionMapper.class)
                    .countMediaAccessForChild(mediaUrl, childId) > 0;
        }
    }

    public List<MissionSubmission> findPendingByParentId(Long parentId) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession()) {
            return session.getMapper(MissionMapper.class).findPendingByParentId(parentId);
        }
    }

    public List<MissionSubmission> findTodayByParentId(Long parentId) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession()) {
            return session.getMapper(MissionMapper.class).findTodayByParentId(parentId);
        }
    }

    public List<MissionSubmission> findAvailableRewardsByParentId(Long parentId) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession()) {
            return session.getMapper(MissionMapper.class).findAvailableRewardsByParentId(parentId);
        }
    }

    public List<RewardBox> findRewardBoxes() {
        try (SqlSession session = SqlSessionManager.getFactory().openSession()) {
            return session.getMapper(MissionMapper.class).findRewardBoxes();
        }
    }

    public RewardBox findRewardBoxByGrade(String boxGrade) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession()) {
            return session.getMapper(MissionMapper.class).findRewardBoxByGrade(boxGrade);
        }
    }

    public MissionSubmission findPendingForReview(Long submissionId, Long parentId) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession()) {
            return session.getMapper(MissionMapper.class).findPendingForReview(submissionId, parentId);
        }
    }

    public MissionSubmission findApprovedRewardForChild(Long submissionId, Long childId) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession()) {
            return session.getMapper(MissionMapper.class).findApprovedRewardForChild(submissionId, childId);
        }
    }

    public boolean review(
            Long submissionId, Long parentId, String status, String boxGrade, boolean deleteMedia) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession(false)) {
            MissionMapper mapper = session.getMapper(MissionMapper.class);
            MissionSubmission submission = mapper.findPendingForReview(submissionId, parentId);
            if (submission == null) {
                session.rollback();
                return false;
            }
            int updated = mapper.reviewSubmission(
                    submissionId, parentId, status, boxGrade, deleteMedia ? 1 : 0);
            if (updated == 1) {
                mapper.insertReviewNotification(
                        submission.getChildId(),
                        submission.getMissionId(),
                        submissionId,
                        status,
                        boxGrade);
                session.commit();
                return true;
            }
            session.rollback();
            return false;
        }
    }

    public ChildPet openRewardBox(Long childId, Long submissionId, String boxGrade, int expAmount) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession(false)) {
            MissionMapper missionMapper = session.getMapper(MissionMapper.class);
            GameProfileMapper gameProfileMapper = session.getMapper(GameProfileMapper.class);

            int marked = missionMapper.markRewardGiven(submissionId, childId);
            if (marked != 1) {
                session.rollback();
                return null;
            }
            int updatedPet = gameProfileMapper.addExpToActivePet(childId, expAmount);
            if (updatedPet != 1) {
                session.rollback();
                throw new IllegalStateException("활성 펫 경험치를 갱신하지 못했습니다.");
            }
            Long nextPetId = gameProfileMapper.findNextPetIdAfterActiveMaxed(childId);
            if (nextPetId != null) {
                gameProfileMapper.unlockNextPetAfterActiveMaxed(childId);
                gameProfileMapper.deactivateChildPets(childId);
                if (gameProfileMapper.activateChildPet(childId, nextPetId) != 1) {
                    session.rollback();
                    throw new IllegalStateException("다음 펫을 대표 펫으로 설정하지 못했습니다.");
                }
            }
            missionMapper.insertExpRewardHistory(childId, submissionId, boxGrade, expAmount);
            missionMapper.insertRewardPaidNotification(
                    childId, submissionId, null, boxGrade, expAmount);
            ChildPet activePet = gameProfileMapper.findActivePet(childId);
            session.commit();
            return activePet;
        }
    }

    public ChildPet openAdminDemoRewardBox(Long childId, String boxGrade, int expAmount) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession(false)) {
            MissionMapper missionMapper = session.getMapper(MissionMapper.class);
            GameProfileMapper gameProfileMapper = session.getMapper(GameProfileMapper.class);

            int updatedPet = gameProfileMapper.addExpToActivePet(childId, expAmount);
            if (updatedPet != 1) {
                session.rollback();
                throw new IllegalStateException("?쒖꽦 ??寃쏀뿕移섎? 媛깆떊?섏? 紐삵뻽?듬땲??");
            }
            if (gameProfileMapper.countActiveMongleMaxed(childId) > 0) {
                gameProfileMapper.unlockAllPetsMaxedForAdminDemo(childId);
            }
            missionMapper.insertExpRewardHistory(childId, null, boxGrade, expAmount);
            missionMapper.insertRewardPaidNotification(
                    childId, null, null, boxGrade, expAmount);
            ChildPet activePet = gameProfileMapper.findActivePet(childId);
            session.commit();
            return activePet;
        }
    }

    public void ensureAdminDemoRewardBoxes(Long childId) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession(false)) {
            MissionMapper mapper = session.getMapper(MissionMapper.class);
            for (String boxGrade : ADMIN_DEMO_BOX_GRADES) {
                if (mapper.countAvailableRewardByGrade(childId, boxGrade) > 0) {
                    continue;
                }
                Long missionId = mapper.findAdminDemoMissionId(childId, boxGrade);
                if (missionId == null) {
                    mapper.insertAdminDemoMission(childId, boxGrade);
                    missionId = mapper.findAdminDemoMissionId(childId, boxGrade);
                }
                if (missionId == null) {
                    session.rollback();
                    throw new IllegalStateException("Admin demo mission could not be created.");
                }
                mapper.insertAdminDemoApprovedSubmission(childId, missionId, boxGrade);
            }
            session.commit();
        }
    }

    public List<Notification> findNotificationsForParent(Long parentId) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession()) {
            return session.getMapper(MissionMapper.class).findNotificationsForParent(parentId);
        }
    }

    public List<Notification> findNotificationsForChild(Long childId) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession()) {
            return session.getMapper(MissionMapper.class).findNotificationsForChild(childId);
        }
    }

    public boolean markParentNotificationRead(Long notificationId, Long parentId) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession(false)) {
            int updated = session.getMapper(MissionMapper.class)
                    .markParentNotificationRead(notificationId, parentId);
            session.commit();
            return updated == 1;
        }
    }

    public boolean markChildNotificationRead(Long notificationId, Long childId) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession(false)) {
            int updated = session.getMapper(MissionMapper.class)
                    .markChildNotificationRead(notificationId, childId);
            session.commit();
            return updated == 1;
        }
    }

    public int markAllParentNotificationsRead(Long parentId) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession(false)) {
            int updated = session.getMapper(MissionMapper.class)
                    .markAllParentNotificationsRead(parentId);
            session.commit();
            return updated;
        }
    }

    public int markAllChildNotificationsRead(Long childId) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession(false)) {
            int updated = session.getMapper(MissionMapper.class)
                    .markAllChildNotificationsRead(childId);
            session.commit();
            return updated;
        }
    }

    public List<ChildMissionProgress> findTodayProgressForParent(Long parentId) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession()) {
            return session.getMapper(MissionMapper.class).findTodayProgressForParent(parentId);
        }
    }

    public List<RewardInventoryItem> findRewardInventoryForChild(Long childId) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession()) {
            return session.getMapper(MissionMapper.class).findRewardInventoryForChild(childId);
        }
    }

    public List<ActivityRecord> findActivityHistoryForChild(Long childId) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession()) {
            return session.getMapper(MissionMapper.class).findActivityHistoryForChild(childId);
        }
    }
}
