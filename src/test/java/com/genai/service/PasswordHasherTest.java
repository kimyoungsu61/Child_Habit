package com.genai.service;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class PasswordHasherTest {
    private final PasswordHasher hasher = new PasswordHasher();

    @Test
    void hashesAndVerifiesPassword() {
        String hash = hasher.hash("password123!");

        assertNotEquals("password123!", hash);
        assertTrue(hasher.matches("password123!", hash));
        assertFalse(hasher.matches("wrong-password", hash));
    }

    @Test
    void usesDifferentSaltForEachHash() {
        String first = hasher.hash("password123!");
        String second = hasher.hash("password123!");

        assertNotEquals(first, second);
    }
}
