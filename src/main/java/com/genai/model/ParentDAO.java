package com.genai.model;

import org.apache.ibatis.session.SqlSession;

import com.genai.database.SqlSessionManager;
import com.genai.mapper.ParentMapper;

public class ParentDAO {
    public boolean existsByEmail(String email) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession()) {
            return session.getMapper(ParentMapper.class).countByEmail(email) > 0;
        }
    }

    public Parent findByEmail(String email) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession()) {
            return session.getMapper(ParentMapper.class).findByEmail(email);
        }
    }

    public void insert(Parent parent) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession(false)) {
            int inserted = session.getMapper(ParentMapper.class).insert(parent);
            if (inserted != 1) {
                session.rollback();
                throw new IllegalStateException("회원 정보가 저장되지 않았습니다.");
            }
            session.commit();
        }
    }

    public void updatePasswordAndName(String email, String passwordHash, String name) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession(false)) {
            int updated = session.getMapper(ParentMapper.class)
                    .updatePasswordAndName(email, passwordHash, name);
            if (updated != 1) {
                session.rollback();
                throw new IllegalStateException("Admin parent account could not be updated.");
            }
            session.commit();
        }
    }
}
