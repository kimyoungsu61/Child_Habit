package com.genai.service;

import java.security.SecureRandom;

public class InviteCodeGenerator {
    private static final char[] CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".toCharArray();
    private static final int CODE_LENGTH = 8;

    private final SecureRandom random = new SecureRandom();

    public String generate() {
        StringBuilder code = new StringBuilder(CODE_LENGTH);
        for (int i = 0; i < CODE_LENGTH; i++) {
            code.append(CHARACTERS[random.nextInt(CHARACTERS.length)]);
        }
        return code.toString();
    }
}
