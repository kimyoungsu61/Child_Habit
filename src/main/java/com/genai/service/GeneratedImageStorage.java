package com.genai.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;
import java.util.UUID;

public class GeneratedImageStorage {
    private static final String URL_PREFIX = "/media/generated/";
    private static final int MAX_IMAGE_BYTES = 12 * 1024 * 1024;

    private final Path rootDirectory;

    public GeneratedImageStorage() {
        this(Path.of(System.getProperty("java.io.tmpdir"), "genai-generated-images"));
    }

    GeneratedImageStorage(Path rootDirectory) {
        this.rootDirectory = rootDirectory;
    }

    public String savePngBase64(String imageBase64) {
        byte[] imageBytes = decodeImage(imageBase64);
        if (imageBytes.length == 0 || imageBytes.length > MAX_IMAGE_BYTES) {
            throw new IllegalArgumentException("생성 이미지 크기가 올바르지 않습니다.");
        }

        try {
            Files.createDirectories(rootDirectory);
            String fileName = UUID.randomUUID() + ".png";
            Path target = rootDirectory.resolve(fileName).normalize();
            Files.write(target, imageBytes);
            return URL_PREFIX + fileName;
        } catch (IOException exception) {
            throw new IllegalStateException("생성 이미지를 저장하지 못했습니다.", exception);
        }
    }

    public Path resolveUrl(String mediaUrl) {
        if (mediaUrl == null || !mediaUrl.startsWith(URL_PREFIX)) {
            return null;
        }
        String fileName = mediaUrl.substring(URL_PREFIX.length());
        if (fileName.contains("/") || fileName.contains("\\") || fileName.isBlank()) {
            return null;
        }
        Path path = rootDirectory.resolve(fileName).normalize();
        return Files.exists(path) ? path : null;
    }

    private byte[] decodeImage(String imageBase64) {
        String value = imageBase64 == null ? "" : imageBase64.trim();
        int comma = value.indexOf(',');
        if (value.startsWith("data:image/") && comma >= 0) {
            value = value.substring(comma + 1);
        }
        try {
            return Base64.getDecoder().decode(value);
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("생성 이미지 데이터가 base64 형식이 아닙니다.", exception);
        }
    }
}
