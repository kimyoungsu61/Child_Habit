package com.genai.model;

import java.sql.Timestamp;

import org.apache.ibatis.session.SqlSession;

import com.genai.database.SqlSessionManager;
import com.genai.mapper.AuthTokenMapper;

public class AuthTokenDAO {
    public void insertParentToken(String tokenHash, Long parentId, Timestamp expiresAt) {
        executeWrite(mapper -> mapper.insertParentToken(tokenHash, parentId, expiresAt));
    }

    public void insertChildToken(String tokenHash, Long childId, Timestamp expiresAt) {
        executeWrite(mapper -> mapper.insertChildToken(tokenHash, childId, expiresAt));
    }

    public Parent findParent(String tokenHash) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession()) {
            AuthTokenMapper mapper = session.getMapper(AuthTokenMapper.class);
            Parent parent = mapper.findParentByTokenHash(tokenHash);
            if (parent != null) {
                mapper.touchToken(tokenHash);
                session.commit();
            }
            return parent;
        }
    }

    public ChildProfile findChild(String tokenHash) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession()) {
            AuthTokenMapper mapper = session.getMapper(AuthTokenMapper.class);
            ChildProfile child = mapper.findChildByTokenHash(tokenHash);
            if (child != null) {
                mapper.touchToken(tokenHash);
                session.commit();
            }
            return child;
        }
    }

    public void deleteByHash(String tokenHash) {
        executeWrite(mapper -> mapper.deleteByHash(tokenHash));
    }

    public void deleteByChildId(Long childId) {
        executeWrite(mapper -> mapper.deleteByChildId(childId));
    }

    private void executeWrite(MapperWrite write) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession(false)) {
            write.execute(session.getMapper(AuthTokenMapper.class));
            session.commit();
        }
    }

    @FunctionalInterface
    private interface MapperWrite {
        int execute(AuthTokenMapper mapper);
    }
}

