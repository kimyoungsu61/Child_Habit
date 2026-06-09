package com.genai.model;

import java.util.List;

import org.apache.ibatis.session.SqlSession;

import com.genai.database.SqlSessionManager;
import com.genai.mapper.ChildAccountMapper;

public class ChildAccountDAO {
    public ChildProfile createChild(Long parentId, String nickname, String inviteCode) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession(false)) {
            ChildAccountMapper mapper = session.getMapper(ChildAccountMapper.class);
            if (mapper.countInviteCode(inviteCode) > 0) {
                return null;
            }

            Long frameId = mapper.findFrameIdByType("wood");
            if (frameId == null) {
                throw new IllegalStateException("기본 wood 액자 데이터가 없습니다.");
            }

            ChildInvite invite = new ChildInvite();
            invite.setParentId(parentId);
            invite.setInviteCode(inviteCode);
            mapper.insertInvite(invite);

            ChildProfile child = new ChildProfile();
            child.setParentId(parentId);
            child.setInviteId(invite.getInviteId());
            child.setFrameId(frameId);
            child.setNickname(nickname);
            child.setCharacterLevel(1);
            mapper.insertChild(child);

            session.commit();
            child.setInviteCode(inviteCode);
            child.setFrameType("wood");
            return child;
        }
    }

    public List<ChildProfile> findByParentId(Long parentId) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession()) {
            return session.getMapper(ChildAccountMapper.class).findChildrenByParentId(parentId);
        }
    }

    public ChildProfile findByInviteCode(String inviteCode) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession()) {
            return session.getMapper(ChildAccountMapper.class).findChildByInviteCode(inviteCode);
        }
    }

    public ChildProfile findById(Long childId) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession()) {
            return session.getMapper(ChildAccountMapper.class).findChildById(childId);
        }
    }

    public boolean regenerateInviteCode(Long childId, Long parentId, String inviteCode) {
        try (SqlSession session = SqlSessionManager.getFactory().openSession(false)) {
            ChildAccountMapper mapper = session.getMapper(ChildAccountMapper.class);
            if (mapper.countInviteCode(inviteCode) > 0) {
                return false;
            }
            int updated = mapper.regenerateInviteCode(childId, parentId, inviteCode);
            if (updated == 1) {
                session.commit();
                return true;
            }
            session.rollback();
            throw new IllegalArgumentException("부모에게 연결된 아이를 찾을 수 없습니다.");
        }
    }
}
