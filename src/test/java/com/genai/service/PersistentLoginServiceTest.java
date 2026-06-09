package com.genai.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class PersistentLoginServiceTest {
    @Test
    void generatesUrlSafeRandomTokens() {
        String first = PersistentLoginService.generateToken();
        String second = PersistentLoginService.generateToken();

        assertNotEquals(first, second);
        assertTrue(first.matches("[A-Za-z0-9_-]+"));
    }

    @Test
    void hashesTokensWithoutStoringTheRawValue() {
        String rawToken = "sample-token";
        String hash = PersistentLoginService.hashToken(rawToken);

        assertEquals(64, hash.length());
        assertNotEquals(rawToken, hash);
    }
}
