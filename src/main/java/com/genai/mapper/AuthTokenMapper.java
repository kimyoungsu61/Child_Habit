package com.genai.mapper;

import java.sql.Timestamp;

import org.apache.ibatis.annotations.Param;

import com.genai.model.ChildProfile;
import com.genai.model.Parent;

public interface AuthTokenMapper {
    int insertParentToken(@Param("tokenHash") String tokenHash,
            @Param("parentId") Long parentId,
            @Param("expiresAt") Timestamp expiresAt);

    int insertChildToken(@Param("tokenHash") String tokenHash,
            @Param("childId") Long childId,
            @Param("expiresAt") Timestamp expiresAt);

    Parent findParentByTokenHash(String tokenHash);

    ChildProfile findChildByTokenHash(String tokenHash);

    int touchToken(String tokenHash);

    int deleteByHash(String tokenHash);

    int deleteByChildId(Long childId);

    int deleteExpired();
}

