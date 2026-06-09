package com.genai.service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

import javax.servlet.http.Part;

public class MissionMediaStorage {
    private static final String URL_PREFIX = "/media/submissions/";
    private static final Set<String> PHOTO_TYPES = Set.of("image/jpeg", "image/png", "image/webp");
    private static final Set<String> VIDEO_TYPES = Set.of("video/mp4", "video/webm", "video/quicktime");

    private final Path rootDirectory;

    public MissionMediaStorage() {
        this(Path.of(System.getProperty("java.io.tmpdir"), "genai-mission-media"));
    }

    MissionMediaStorage(Path rootDirectory) {
        this.rootDirectory = rootDirectory;
    }

    public String save(Part part, String mediaType) {
        validate(part, mediaType);

        try {
            Files.createDirectories(rootDirectory);
            String extension = extensionFrom(part);
            String fileName = UUID.randomUUID() + extension;
            Path target = rootDirectory.resolve(fileName).normalize();

            try (InputStream input = part.getInputStream()) {
                Files.copy(input, target, StandardCopyOption.REPLACE_EXISTING);
            }
            return URL_PREFIX + fileName;
        } catch (IOException exception) {
            throw new IllegalStateException("미션 파일을 임시 저장하지 못했습니다.", exception);
        }
    }

    public boolean deleteByUrl(String mediaUrl) {
        if (mediaUrl == null || !mediaUrl.startsWith(URL_PREFIX)) {
            return false;
        }

        String fileName = mediaUrl.substring(URL_PREFIX.length());
        if (fileName.contains("/") || fileName.contains("\\") || fileName.isBlank()) {
            return false;
        }

        try {
            return Files.deleteIfExists(rootDirectory.resolve(fileName).normalize());
        } catch (IOException exception) {
            throw new IllegalStateException("임시 미션 파일을 삭제하지 못했습니다.", exception);
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

    private void validate(Part part, String mediaType) {
        if (part == null || part.getSize() <= 0) {
            throw new IllegalArgumentException("촬영된 사진 또는 영상이 없습니다.");
        }
        String contentType = normalizedContentType(part);
        if ("photo".equals(mediaType) && !PHOTO_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("사진은 JPG, PNG, WEBP 형식만 지원합니다.");
        }
        if ("video".equals(mediaType) && !VIDEO_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("영상은 MP4, WEBM, MOV 형식만 지원합니다.");
        }
        if (!"photo".equals(mediaType) && !"video".equals(mediaType)) {
            throw new IllegalArgumentException("지원하지 않는 촬영 형식입니다.");
        }
    }

    private String extensionFrom(Part part) {
        String submitted = part.getSubmittedFileName();
        if (submitted != null) {
            int dot = submitted.lastIndexOf('.');
            if (dot >= 0 && dot < submitted.length() - 1) {
                String extension = submitted.substring(dot).toLowerCase(Locale.ROOT);
                if (extension.matches("\\.[a-z0-9]{2,5}")) {
                    return extension;
                }
            }
        }
        return switch (normalizedContentType(part)) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            case "video/mp4" -> ".mp4";
            case "video/webm" -> ".webm";
            case "video/quicktime" -> ".mov";
            default -> ".jpg";
        };
    }

    private String normalizedContentType(Part part) {
        return part.getContentType() == null
                ? ""
                : part.getContentType().toLowerCase(Locale.ROOT);
    }
}
