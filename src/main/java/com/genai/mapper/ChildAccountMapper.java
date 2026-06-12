package com.genai.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;

import com.genai.model.ChildInvite;
import com.genai.model.ChildProfile;
import com.genai.model.ProfileFrame;

public interface ChildAccountMapper {
    int countInviteCode(String inviteCode);

    int insertInvite(ChildInvite invite);

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
}
