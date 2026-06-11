package com.genai.service;

public class AiImageGenerationResult {
    private final String imageBase64;
    private final String prompt;
    private final Long seed;

    public AiImageGenerationResult(String imageBase64, String prompt, Long seed) {
        this.imageBase64 = imageBase64;
        this.prompt = prompt;
        this.seed = seed;
    }

    public String getImageBase64() {
        return imageBase64;
    }

    public String getPrompt() {
        return prompt;
    }

    public Long getSeed() {
        return seed;
    }
}
