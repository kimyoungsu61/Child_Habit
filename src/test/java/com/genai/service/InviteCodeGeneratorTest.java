package com.genai.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class InviteCodeGeneratorTest {
    private final InviteCodeGenerator generator = new InviteCodeGenerator();

    @Test
    void generatesEightCharacterReadableCode() {
        String code = generator.generate();

        assertEquals(8, code.length());
        assertTrue(code.matches("[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}"));
    }

    @Test
    void generatesDifferentCodes() {
        assertNotEquals(generator.generate(), generator.generate());
    }
}
