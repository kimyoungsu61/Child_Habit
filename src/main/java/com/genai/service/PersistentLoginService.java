package com.genai.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;

import com.genai.model.AuthTokenDAO;
import com.genai.model.ChildProfile;
import com.genai.model.Parent;

public class PersistentLoginService {
    public static final int PARENT_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
    public static final int CHILD_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private final AuthTokenDAO authTokenDAO;

    public PersistentLoginService() {
        this(new AuthTokenDAO());
    }

    PersistentLoginService(AuthTokenDAO authTokenDAO) {
        this.authTokenDAO = authTokenDAO;
    }

    public String issueParentToken(Long parentId) {
        String rawToken = generateToken();
        authTokenDAO.insertParentToken(
                hashToken(rawToken),
                parentId,
                Timestamp.from(Instant.now().plusSeconds(PARENT_MAX_AGE_SECONDS)));
        return rawToken;
    }

    public String issueChildToken(Long childId) {
        String rawToken = generateToken();
        authTokenDAO.insertChildToken(
                hashToken(rawToken),
                childId,
                Timestamp.from(Instant.now().plusSeconds(CHILD_MAX_AGE_SECONDS)));
        return rawToken;
    }

    public Parent restoreParent(String rawToken) {
        if (isMissing(rawToken)) {
            return null;
        }
        Parent parent = authTokenDAO.findParent(hashToken(rawToken));
        if (parent != null) {
            parent.setPasswordHash(null);
        }
        return parent;
    }

    public ChildProfile restoreChild(String rawToken) {
        return isMissing(rawToken) ? null : authTokenDAO.findChild(hashToken(rawToken));
    }

    public void revoke(String rawToken) {
        if (!isMissing(rawToken)) {
            authTokenDAO.deleteByHash(hashToken(rawToken));
        }
    }

    public void revokeChildTokens(Long childId) {
        if (childId != null) {
            authTokenDAO.deleteByChildId(childId);
        }
    }

    static String generateToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    static String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(
                    digest.digest(rawToken.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available.", exception);
        }
    }

    private boolean isMissing(String value) {
        return value == null || value.isBlank();
    }
}
