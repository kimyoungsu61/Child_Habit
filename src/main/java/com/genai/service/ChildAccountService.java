package com.genai.service;

import java.util.List;
import java.util.Locale;

import com.genai.model.ChildAccountDAO;
import com.genai.model.ChildProfile;
import com.genai.model.ProfileFrame;

public class ChildAccountService {
    public static final String UNSET_NICKNAME = "미설정 아이";
    private static final int MAX_CODE_ATTEMPTS = 10;

    private final ChildAccountDAO childAccountDAO;
    private final InviteCodeGenerator codeGenerator;

    public ChildAccountService() {
        this(new ChildAccountDAO(), new InviteCodeGenerator());
    }

    ChildAccountService(ChildAccountDAO childAccountDAO, InviteCodeGenerator codeGenerator) {
        this.childAccountDAO = childAccountDAO;
        this.codeGenerator = codeGenerator;
    }

    public ChildProfile createChildInviteSlot(Long parentId) {
        for (int attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
            ChildProfile child = childAccountDAO.createChild(
                    parentId, UNSET_NICKNAME, codeGenerator.generate());
            if (child != null) {
                return child;
            }
        }
        throw new IllegalStateException("고유한 초대 코드를 생성하지 못했습니다.");
    }

    public List<ChildProfile> findChildren(Long parentId) {
        return childAccountDAO.findByParentId(parentId);
    }

    public ChildProfile loginByInviteCode(String inviteCode) {
        return childAccountDAO.findByInviteCode(normalizeCode(inviteCode));
    }

    public ChildProfile findById(Long childId) {
        return childAccountDAO.findById(childId);
    }

    public List<ProfileFrame> findFrames() {
        List<ProfileFrame> frames = childAccountDAO.findAllFrames();
        frames.forEach(this::normalizeFrameRequirement);
        return frames;
    }

    public int countApprovedSubmissions(Long childId) {
        return childAccountDAO.countApprovedSubmissions(childId);
    }

    public ProfileFrame findFrameById(Long frameId) {
        return frameId == null ? null : normalizeFrameRequirement(childAccountDAO.findFrameById(frameId));
    }

    public ProfileFrame findFrameByType(String frameType) {
        String normalizedFrameType = normalizeFrameType(frameType);
        if (normalizedFrameType.isBlank()) {
            return null;
        }
        ProfileFrame frame = childAccountDAO.findFrameByType(normalizedFrameType);
        if (frame == null && "bronze".equals(normalizedFrameType)) {
            frame = childAccountDAO.findFrameByType("wood");
        }
        if (frame == null && "wood".equals(normalizedFrameType)) {
            frame = childAccountDAO.findFrameByType("bronze");
        }
        return normalizeFrameRequirement(frame);
    }

    public ChildProfile updateFrameById(Long childId, Long frameId) {
        ProfileFrame frame = findFrameById(frameId);
        if (frame == null) {
            throw new IllegalArgumentException("선택할 수 없는 액자입니다.");
        }
        int badgeCount = countApprovedSubmissions(childId);
        if (badgeCount < frame.getRequiredBadgeCount()) {
            throw new IllegalArgumentException(
                    "뱃지 " + frame.getRequiredBadgeCount() + "개부터 사용할 수 있는 액자입니다.");
        }
        if (!childAccountDAO.updateFrameById(childId, frameId)) {
            throw new IllegalArgumentException("아이 프로필 액자를 변경하지 못했습니다.");
        }
        return childAccountDAO.findById(childId);
    }

    public ChildProfile updateFrame(Long childId, String frameType, int currentLevel) {
        ProfileFrame frame = findFrameByType(frameType);
        if (frame == null) {
            throw new IllegalArgumentException("선택할 수 없는 액자입니다.");
        }
        return updateFrameById(childId, frame.getFrameId());
    }

    public String regenerateInviteCode(Long childId, Long parentId) {
        for (int attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
            String code = codeGenerator.generate();
            if (childAccountDAO.regenerateInviteCode(childId, parentId, code)) {
                new PersistentLoginService().revokeChildTokens(childId);
                return code;
            }
        }
        throw new IllegalStateException("고유한 초대 코드를 재발급하지 못했습니다.");
    }

    private String normalizeCode(String inviteCode) {
        return inviteCode == null ? "" : inviteCode.replaceAll("\\s+", "").toUpperCase(Locale.ROOT);
    }

    private String normalizeFrameType(String frameType) {
        String normalized = frameType == null ? "" : frameType.trim();
        if ("silver".equals(normalized)) {
            return "iron";
        }
        return normalized;
    }

    private ProfileFrame normalizeFrameRequirement(ProfileFrame frame) {
        if (frame == null) {
            return null;
        }
        String frameType = frame.getFrameType() == null
                ? ""
                : frame.getFrameType().trim().toLowerCase(Locale.ROOT);
        switch (frameType) {
            case "wood", "bronze" -> frame.setRequiredBadgeCount(0);
            case "iron" -> frame.setRequiredBadgeCount(2);
            case "gold" -> frame.setRequiredBadgeCount(3);
            case "crystal" -> frame.setRequiredBadgeCount(4);
            case "aurora" -> frame.setRequiredBadgeCount(5);
            case "legend" -> frame.setRequiredBadgeCount(6);
            default -> {
                if (Long.valueOf(1L).equals(frame.getFrameId())) frame.setRequiredBadgeCount(0);
                if (Long.valueOf(2L).equals(frame.getFrameId())) frame.setRequiredBadgeCount(2);
                if (Long.valueOf(3L).equals(frame.getFrameId())) frame.setRequiredBadgeCount(3);
                if (Long.valueOf(4L).equals(frame.getFrameId())) frame.setRequiredBadgeCount(4);
                if (Long.valueOf(6L).equals(frame.getFrameId())) frame.setRequiredBadgeCount(5);
                if (Long.valueOf(5L).equals(frame.getFrameId())) frame.setRequiredBadgeCount(6);
            }
        }
        return frame;
    }
}
