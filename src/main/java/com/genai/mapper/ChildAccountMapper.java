package com.genai.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;

import com.genai.model.ChildInvite;
import com.genai.model.ChildProfile;
import com.genai.model.ProfileFrame;

public interface ChildAccountMapper {
    int countInviteCode(String inviteCode);

    Long findInviteIdByCode(String inviteCode);

    int insertInvite(ChildInvite invite);

    int updateInviteParent(@Param("inviteCode") String inviteCode,
            @Param("parentId") Long parentId);

    Long findFrameIdByType(String frameType);

    ProfileFrame findFrameById(Long frameId);

    ProfileFrame findFrameByType(String frameType);

    List<ProfileFrame> findAllFrames();

    int countApprovedSubmissions(Long childId);

    int insertChild(ChildProfile child);

    List<ChildProfile> findChildrenByParentId(Long parentId);

    ChildProfile findChildByInviteCode(String inviteCode);

    ChildProfile findChildById(Long childId);

    int updateFrame(@Param("childId") Long childId, @Param("frameType") String frameType);

    int updateFrameById(@Param("childId") Long childId, @Param("frameId") Long frameId);

    int regenerateInviteCode(@Param("childId") Long childId,
            @Param("parentId") Long parentId,
            @Param("inviteCode") String inviteCode);

    int deleteNotificationsForChild(Long childId);

    int deleteRewardHistoryForChild(Long childId);

    int deleteSubmissionsForChild(Long childId);

    int deleteMissionsForChild(Long childId);

    int deleteInteractionCooldownsForChild(Long childId);

    int deleteChildTokens(Long childId);

    int deleteChildPets(Long childId);

    int deleteChild(Long childId);
}
