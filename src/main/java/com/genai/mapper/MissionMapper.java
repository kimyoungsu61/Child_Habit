package com.genai.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;

import com.genai.model.ActivityRecord;
import com.genai.model.ChildMissionProgress;
import com.genai.model.Mission;
import com.genai.model.MissionSubmission;
import com.genai.model.Notification;
import com.genai.model.RewardBox;
import com.genai.model.RewardInventoryItem;

public interface MissionMapper {
    Long findDefaultMissionIdByChildId(Long childId);

    int insertDefaultMission(Long childId);

    int insertMission(Mission mission);

    int insertMissionAssignedNotification(Mission mission);

    int countActiveMissionsByChild(Long childId);

    int countTodayAssignedMissionsByChild(Long childId);

    int updateMission(Mission mission);

    int deactivateMission(@Param("missionId") Long missionId,
            @Param("parentId") Long parentId);

    int deleteMissionNotifications(@Param("missionId") Long missionId,
            @Param("parentId") Long parentId);

    int deleteMission(@Param("missionId") Long missionId,
            @Param("parentId") Long parentId);

    List<Mission> findMissionsForParent(Long parentId);

    List<Mission> findMissionsForChild(Long childId);

    Mission findMissionForParent(@Param("missionId") Long missionId,
            @Param("parentId") Long parentId);

    Mission findMissionForChild(@Param("missionId") Long missionId,
            @Param("childId") Long childId);

    int insertSubmission(MissionSubmission submission);

    int insertRewardRequestNotification(MissionSubmission submission);

    List<MissionSubmission> findByChildId(Long childId);

    int countTodaySubmissionsByChild(Long childId);

    int countOpenSubmissionForMissionToday(@Param("childId") Long childId,
            @Param("missionId") Long missionId);

    int countMediaAccessForParent(@Param("mediaUrl") String mediaUrl,
            @Param("parentId") Long parentId);

    int countMediaAccessForChild(@Param("mediaUrl") String mediaUrl,
            @Param("childId") Long childId);

    List<MissionSubmission> findPendingByParentId(Long parentId);

    List<MissionSubmission> findTodayByParentId(Long parentId);

    List<MissionSubmission> findAvailableRewardsByParentId(Long parentId);

    List<RewardBox> findRewardBoxes();

    RewardBox findRewardBoxByGrade(String boxGrade);

    MissionSubmission findPendingForReview(@Param("submissionId") Long submissionId,
            @Param("parentId") Long parentId);

    MissionSubmission findApprovedRewardForChild(@Param("submissionId") Long submissionId,
            @Param("childId") Long childId);

    int reviewSubmission(@Param("submissionId") Long submissionId,
            @Param("parentId") Long parentId,
            @Param("status") String status,
            @Param("boxGrade") String boxGrade,
            @Param("deleteMedia") int deleteMedia);

    int insertReviewNotification(@Param("childId") Long childId,
            @Param("missionId") Long missionId,
            @Param("submissionId") Long submissionId,
            @Param("status") String status,
            @Param("boxGrade") String boxGrade);

    int markRewardGiven(@Param("submissionId") Long submissionId,
            @Param("childId") Long childId);

    int insertExpRewardHistory(@Param("childId") Long childId,
            @Param("submissionId") Long submissionId,
            @Param("boxGrade") String boxGrade,
            @Param("expAmount") int expAmount);

    int insertRewardPaidNotification(@Param("childId") Long childId,
            @Param("submissionId") Long submissionId,
            @Param("rewardId") Long rewardId,
            @Param("boxGrade") String boxGrade,
            @Param("expAmount") int expAmount);

    List<Notification> findNotificationsForParent(Long parentId);

    List<Notification> findNotificationsForChild(Long childId);

    int markParentNotificationRead(@Param("notificationId") Long notificationId,
            @Param("parentId") Long parentId);

    int markChildNotificationRead(@Param("notificationId") Long notificationId,
            @Param("childId") Long childId);

    int markAllParentNotificationsRead(Long parentId);

    int markAllChildNotificationsRead(Long childId);

    List<ChildMissionProgress> findTodayProgressForParent(Long parentId);

    List<RewardInventoryItem> findRewardInventoryForChild(Long childId);

    List<ActivityRecord> findActivityHistoryForChild(Long childId);
}
