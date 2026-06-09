package com.genai.service;

import java.util.List;
import java.util.Locale;

import com.genai.model.ChildAccountDAO;
import com.genai.model.ChildProfile;

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
        throw new IllegalStateException("고유한 초대코드를 생성하지 못했습니다.");
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

    public String regenerateInviteCode(Long childId, Long parentId) {
        for (int attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
            String code = codeGenerator.generate();
            if (childAccountDAO.regenerateInviteCode(childId, parentId, code)) {
                new PersistentLoginService().revokeChildTokens(childId);
                return code;
            }
        }
        throw new IllegalStateException("고유한 초대코드를 재발급하지 못했습니다.");
    }

    private String normalizeCode(String inviteCode) {
        return inviteCode == null ? "" : inviteCode.replaceAll("\\s+", "").toUpperCase(Locale.ROOT);
    }
}
