package com.genai.service;

import java.util.Locale;

import com.genai.model.ChildAccountDAO;
import com.genai.model.ChildProfile;
import com.genai.model.Parent;

public class AdminDemoService {
    public static final String ADMIN_EMAIL = "admin@admin.com";
    public static final String ADMIN_PASSWORD = "admin";
    public static final String ADMIN_INVITE_CODE = "ADMIN";
    public static final String ADMIN_CHILD_NICKNAME = ChildAccountService.UNSET_NICKNAME;

    private final ParentService parentService;
    private final ChildAccountDAO childAccountDAO;
    private final PasswordHasher passwordHasher;

    public AdminDemoService() {
        this(new ParentService(), new ChildAccountDAO(), new PasswordHasher());
    }

    AdminDemoService(ParentService parentService,
            ChildAccountDAO childAccountDAO,
            PasswordHasher passwordHasher) {
        this.parentService = parentService;
        this.childAccountDAO = childAccountDAO;
        this.passwordHasher = passwordHasher;
    }

    public void prepareAdminDemo() {
        Parent parent = parentService.ensureParent(
                ADMIN_EMAIL, ADMIN_PASSWORD, "Admin Demo");
        childAccountDAO.ensureInvite(parent.getParentId(), ADMIN_INVITE_CODE);
        resetAdminChildDemo();
    }

    public ChildProfile findOrCreateAdminChild() {
        Parent parent = parentService.findByEmail(ADMIN_EMAIL);
        if (parent == null) {
            parent = parentService.ensureParent(
                    ADMIN_EMAIL, ADMIN_PASSWORD, "Admin Demo");
        }
        childAccountDAO.ensureInvite(parent.getParentId(), ADMIN_INVITE_CODE);
        ChildProfile child = childAccountDAO.findByInviteCode(ADMIN_INVITE_CODE);
        if (child != null) {
            return child;
        }
        return childAccountDAO.createChildForExistingInvite(
                parent.getParentId(), ADMIN_CHILD_NICKNAME, ADMIN_INVITE_CODE);
    }

    public void resetAdminChildDemo() {
        // 5. admin 데모 상태 초기화하기 (로그아웃/서버 재시작 시 초기화)
        childAccountDAO.resetChildByInviteCode(ADMIN_INVITE_CODE);
    }

    public boolean isAdminParent(Parent parent) {
        // 1. admin 계정 여부 확인하기 (시연용 계정인지 확인)
        return parent != null && isAdminParent(parent.getEmail());
    }

    public boolean isAdminParent(String email) {
        return ADMIN_EMAIL.equals(normalizeEmail(email));
    }

    public boolean isAdminChild(ChildProfile child) {
        // 1. admin 계정 여부 확인하기 (시연용 계정인지 확인)
        return child != null && isAdminInviteCode(child.getInviteCode());
    }

    public boolean isAdminChild(Long childId) {
        if (childId == null) {
            return false;
        }
        ChildProfile child = childAccountDAO.findById(childId);
        return isAdminChild(child);
    }

    public boolean isAdminInviteCode(String inviteCode) {
        return ADMIN_INVITE_CODE.equals(normalizeInviteCode(inviteCode));
    }

    public boolean passwordMatchesAdmin(String password, String passwordHash) {
        return passwordHasher.matches(password, passwordHash);
    }

    public String normalizeInviteCode(String inviteCode) {
        return inviteCode == null
                ? ""
                : inviteCode.replaceAll("\\s+", "").toUpperCase(Locale.ROOT);
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}
