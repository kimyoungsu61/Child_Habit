package com.genai.service;

import java.util.List;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;

import com.genai.model.ActivityRecord;
import com.genai.model.BoxOpenResult;
import com.genai.model.ChildMissionProgress;
import com.genai.model.ChildPet;
import com.genai.model.Mission;
import com.genai.model.MissionDAO;
import com.genai.model.MissionSubmission;
import com.genai.model.Notification;
import com.genai.model.RewardBox;
import com.genai.model.RewardInventoryItem;

public class MissionService {
    private static final int MAX_ACTIVE_MISSIONS_PER_CHILD = 5;
    private static final Set<String> MEDIA_TYPES = Set.of("photo", "video");
    private static final Set<String> BOX_GRADES = Set.of("low", "middle", "high");

    private final MissionDAO missionDAO;
    private final MissionMediaStorage mediaStorage;

    public MissionService() {
        this(new MissionDAO(), new MissionMediaStorage());
    }

    MissionService(MissionDAO missionDAO, MissionMediaStorage mediaStorage) {
        this.missionDAO = missionDAO;
        this.mediaStorage = mediaStorage;
    }

    public void createMission(Long parentId, Long childId, String title, String description, String grade) {
        createMission(parentId, childId, title, description, grade, "video");
    }

    public void createMission(Long parentId, Long childId, String title,
            String description, String grade, String mediaType) {
        validateMission(parentId, childId, title, grade, mediaType);
        if (missionDAO.countActiveMissionsByChild(childId)
                >= MAX_ACTIVE_MISSIONS_PER_CHILD) {
            throw new IllegalArgumentException("아이에게 등록할 수 있는 미션은 최대 5개입니다.");
        }
        Mission mission = new Mission();
        mission.setParentId(parentId);
        mission.setChildId(childId);
        mission.setMissionTitle(title.trim());
        mission.setMissionDescription(description == null ? "" : description.trim());
        mission.setMissionGrade(grade.trim());
        mission.setMediaType(mediaType.trim());
        missionDAO.createMission(mission);
    }

    public boolean updateMission(Long missionId, Long parentId, Long childId, String title,
            String description, String grade, String mediaType) {
        if (missionId == null) {
            throw new IllegalArgumentException("Mission ID is required.");
        }
        Mission existing = missionDAO.findMissionForParent(missionId, parentId);
        if (existing == null) {
            return false;
        }
        Long targetChildId = childId == null ? existing.getChildId() : childId;
        if (!targetChildId.equals(existing.getChildId())) {
            throw new IllegalArgumentException("이미 배정된 미션의 아이는 변경할 수 없습니다.");
        }
        validateMission(parentId, targetChildId, title, grade, mediaType);
        Mission mission = new Mission();
        mission.setMissionId(missionId);
        mission.setParentId(parentId);
        mission.setChildId(targetChildId);
        mission.setMissionTitle(title.trim());
        mission.setMissionDescription(description == null ? "" : description.trim());
        mission.setMissionGrade(grade.trim());
        mission.setMediaType(mediaType.trim());
        return missionDAO.updateMission(mission);
    }

    public boolean deactivateMission(Long missionId, Long parentId) {
        if (missionId == null || parentId == null) {
            throw new IllegalArgumentException("Mission and parent IDs are required.");
        }
        return missionDAO.deactivateMission(missionId, parentId);
    }

    public boolean deleteMission(Long missionId, Long parentId) {
        if (missionId == null || parentId == null) {
            throw new IllegalArgumentException("취소할 미션을 선택해 주세요.");
        }
        if (!missionDAO.deleteMission(missionId, parentId)) {
            throw new IllegalArgumentException(
                    "이미 인증이 제출된 미션은 기록 보존을 위해 취소할 수 없습니다.");
        }
        return true;
    }

    public List<Mission> findMissionsForParent(Long parentId) {
        return missionDAO.findMissionsForParent(parentId);
    }

    public List<Mission> findMissionsForChild(Long childId) {
        return missionDAO.findMissionsForChild(childId);
    }

    public Mission findMissionForParent(Long missionId, Long parentId) {
        return missionDAO.findMissionForParent(missionId, parentId);
    }

    public Mission findMissionForChild(Long missionId, Long childId) {
        return missionDAO.findMissionForChild(missionId, childId);
    }

    public void submit(Long childId, String mediaType, String mediaUrl) {
        submit(childId, null, mediaType, mediaUrl);
    }

    public void submit(Long childId, Long missionId, String mediaType, String mediaUrl) {
        if (missionDAO.countTodaySubmissionsByChild(childId) >= 5) {
            throw new IllegalArgumentException("A child can submit up to five missions per day.");
        }
        if (!MEDIA_TYPES.contains(mediaType)) {
            throw new IllegalArgumentException("지원하지 않는 미디어 형식입니다.");
        }
        if (mediaUrl == null || mediaUrl.isBlank() || mediaUrl.length() > 500) {
            throw new IllegalArgumentException("미디어 저장 경로가 필요합니다.");
        }
        if (missionId != null && missionDAO.findMissionForChild(missionId, childId) == null) {
            throw new IllegalArgumentException("제출할 미션을 찾을 수 없습니다.");
        }

        if (missionId != null) {
            Mission mission = missionDAO.findMissionForChild(missionId, childId);
            if (!mediaType.equals(mission.getMediaType())) {
                throw new IllegalArgumentException(
                        "This mission requires a " + mission.getMediaType() + " submission.");
            }
            if (missionDAO.countOpenSubmissionForMissionToday(childId, missionId) > 0) {
                throw new IllegalArgumentException(
                        "This mission already has a pending or approved submission today.");
            }
        }

        MissionSubmission submission = new MissionSubmission();
        submission.setChildId(childId);
        submission.setMissionId(missionId);
        submission.setMediaType(mediaType);
        submission.setMediaUrl(mediaUrl.trim());
        missionDAO.createSubmission(submission);
    }

    public List<MissionSubmission> findChildSubmissions(Long childId) {
        return missionDAO.findByChildId(childId);
    }

    public boolean canParentAccessMedia(String mediaUrl, Long parentId) {
        return missionDAO.canParentAccessMedia(mediaUrl, parentId);
    }

    public boolean canChildAccessMedia(String mediaUrl, Long childId) {
        return missionDAO.canChildAccessMedia(mediaUrl, childId);
    }

    public List<MissionSubmission> findPendingForParent(Long parentId) {
        return missionDAO.findPendingByParentId(parentId);
    }

    public List<MissionSubmission> findTodayForParent(Long parentId) {
        return missionDAO.findTodayByParentId(parentId);
    }

    public List<RewardBox> findRewardBoxes() {
        return missionDAO.findRewardBoxes();
    }

    public boolean review(Long submissionId, Long parentId, String decision, String boxGrade) {
        MissionSubmission submission = missionDAO.findPendingForReview(submissionId, parentId);
        if (submission == null) {
            return false;
        }

        String status;
        String finalBoxGrade;
        if ("rejected".equals(decision)) {
            status = "rejected";
            finalBoxGrade = null;
        } else if ("approved".equals(decision)) {
            status = "approved";
            finalBoxGrade = (boxGrade == null || boxGrade.isBlank())
                    ? submission.getBoxGrade()
                    : boxGrade;
            if (!BOX_GRADES.contains(finalBoxGrade)) {
                throw new IllegalArgumentException("상자 등급을 확인해 주세요.");
            }
        } else {
            throw new IllegalArgumentException("승인 결과와 상자 등급을 확인해 주세요.");
        }

        boolean deleted = mediaStorage.deleteByUrl(submission.getMediaUrl());
        return missionDAO.review(submissionId, parentId, status, finalBoxGrade, deleted);
    }

    public boolean approve(Long submissionId, Long parentId, String boxGrade) {
        return review(submissionId, parentId, "approved", boxGrade);
    }

    public boolean reject(Long submissionId, Long parentId) {
        return review(submissionId, parentId, "rejected", null);
    }

    public BoxOpenResult openBox(Long childId, Long submissionId) {
        MissionSubmission submission = missionDAO.findApprovedRewardForChild(submissionId, childId);
        if (submission == null) {
            throw new IllegalArgumentException("열 수 있는 보상 상자가 없습니다.");
        }
        RewardBox rewardBox = missionDAO.findRewardBoxByGrade(submission.getBoxGrade());
        if (rewardBox == null) {
            throw new IllegalStateException("보상 상자 기준 데이터가 없습니다.");
        }

        int expAmount = ThreadLocalRandom.current()
                .nextInt(rewardBox.getMinExp(), rewardBox.getMaxExp() + 1);
        ChildPet activePet = missionDAO.openRewardBox(
                childId, submissionId, rewardBox.getBoxGrade(), expAmount);
        if (activePet == null) {
            throw new IllegalArgumentException("이미 개봉했거나 사용할 수 없는 상자입니다.");
        }

        BoxOpenResult result = new BoxOpenResult();
        result.setSubmissionId(submissionId);
        result.setBoxGrade(rewardBox.getBoxGrade());
        result.setExpAmount(expAmount);
        result.setCurrentLevel(activePet.getCurrentLevel());
        result.setCurrentExp(activePet.getCurrentExp());
        return result;
    }

    public List<Notification> findNotificationsForParent(Long parentId) {
        return missionDAO.findNotificationsForParent(parentId);
    }

    public List<Notification> findNotificationsForChild(Long childId) {
        return missionDAO.findNotificationsForChild(childId);
    }

    public boolean markParentNotificationRead(Long notificationId, Long parentId) {
        return missionDAO.markParentNotificationRead(notificationId, parentId);
    }

    public boolean markChildNotificationRead(Long notificationId, Long childId) {
        return missionDAO.markChildNotificationRead(notificationId, childId);
    }

    public int markAllParentNotificationsRead(Long parentId) {
        return missionDAO.markAllParentNotificationsRead(parentId);
    }

    public int markAllChildNotificationsRead(Long childId) {
        return missionDAO.markAllChildNotificationsRead(childId);
    }

    public List<ChildMissionProgress> findTodayProgressForParent(Long parentId) {
        return missionDAO.findTodayProgressForParent(parentId);
    }

    public List<RewardInventoryItem> findRewardInventoryForChild(Long childId) {
        return missionDAO.findRewardInventoryForChild(childId);
    }

    public List<ActivityRecord> findActivityHistoryForChild(Long childId) {
        return missionDAO.findActivityHistoryForChild(childId);
    }

    private void validateMission(
            Long parentId, Long childId, String title, String grade, String mediaType) {
        if (mediaType == null || !MEDIA_TYPES.contains(mediaType.trim())) {
            throw new IllegalArgumentException("Mission media type must be photo or video.");
        }
        if (parentId == null || childId == null) {
            throw new IllegalArgumentException("부모와 아이 정보가 필요합니다.");
        }
        if (title == null || title.trim().isBlank() || title.trim().length() > 100) {
            throw new IllegalArgumentException("미션 제목을 1자 이상 100자 이하로 입력해 주세요.");
        }
        if (grade == null || !BOX_GRADES.contains(grade.trim())) {
            throw new IllegalArgumentException("미션 등급은 low, middle, high 중 하나여야 합니다.");
        }
    }
}
