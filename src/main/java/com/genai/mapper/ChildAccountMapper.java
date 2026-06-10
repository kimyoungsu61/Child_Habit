package com.genai.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;

import com.genai.model.ChildInvite;
import com.genai.model.ChildProfile;

public interface ChildAccountMapper {
    int countInviteCode(String inviteCode);

    int insertInvite(ChildInvite invite);

    Long findFrameIdByType(String frameType);

    int insertChild(ChildProfile child);

    List<ChildProfile> findChildrenByParentId(Long parentId);

    ChildProfile findChildByInviteCode(String inviteCode);

    ChildProfile findChildById(Long childId);

    int updateFrame(@Param("childId") Long childId, @Param("frameType") String frameType);

    int regenerateInviteCode(@Param("childId") Long childId,
            @Param("parentId") Long parentId,
            @Param("inviteCode") String inviteCode);
}
