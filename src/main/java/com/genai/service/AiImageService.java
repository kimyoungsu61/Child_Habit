package com.genai.service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

public class AiImageService {
    private static final String DEFAULT_API_URL = "http://127.0.0.1:5000/generate";
    private static final Duration REQUEST_TIMEOUT = Duration.ofMinutes(5);

    private final Gson gson = new Gson();
    private final HttpClient httpClient;
    private final String apiUrl;
    private final String apiToken;

    public AiImageService() {
        this(HttpClient.newBuilder()
                        .connectTimeout(Duration.ofSeconds(10))
                        .build(),
                config("AI_IMAGE_API_URL", DEFAULT_API_URL),
                config("AI_IMAGE_API_TOKEN", ""));
    }

    AiImageService(HttpClient httpClient, String apiUrl, String apiToken) {
        this.httpClient = httpClient;
        this.apiUrl = apiUrl;
        this.apiToken = apiToken;
    }

    public AiImageGenerationResult generateCharacter(Map<String, String> options) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("gender", valueOrDefault(options.get("gender"), "boy"));
        body.put("user_emotion", valueOrDefault(options.get("userEmotion"), "normal"));
        body.put("background", valueOrDefault(options.get("background"), "city"));
        body.put("glasses", valueOrDefault(options.get("glasses"), "none"));
        body.put("prompt", valueOrDefault(options.get("prompt"), ""));

        HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
                .uri(URI.create(apiUrl))
                .timeout(REQUEST_TIMEOUT)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(gson.toJson(body)));
        if (!apiToken.isBlank()) {
            requestBuilder.header("Authorization", "Bearer " + apiToken);
        }

        try {
            HttpResponse<String> response = httpClient.send(
                    requestBuilder.build(), HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException(
                        "AI 이미지 서버 응답 오류: HTTP " + response.statusCode());
            }
            return parseResponse(response.body());
        } catch (IOException exception) {
            throw new IllegalStateException(
                    "AI 이미지 서버에 연결할 수 없습니다. 로컬 Jupyter Flask 서버를 실행해 주세요.", exception);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("AI 이미지 생성 요청이 중단되었습니다.", exception);
        }
    }

    private AiImageGenerationResult parseResponse(String responseBody) {
        JsonObject root = JsonParser.parseString(responseBody).getAsJsonObject();
        if (root.has("success") && !root.get("success").getAsBoolean()) {
            String message = root.has("message")
                    ? root.get("message").getAsString()
                    : "AI 이미지 생성에 실패했습니다.";
            throw new IllegalStateException(message);
        }

        JsonObject data = root.has("data") && root.get("data").isJsonObject()
                ? root.getAsJsonObject("data")
                : root;
        String imageBase64 = firstString(data, "image_base64", "imageBase64", "image");
        if (imageBase64.isBlank()) {
            throw new IllegalStateException("AI 이미지 서버 응답에 image_base64 값이 없습니다.");
        }
        return new AiImageGenerationResult(
                imageBase64,
                firstString(data, "prompt", "positive_prompt", "positivePrompt"),
                firstLong(data, "seed"));
    }

    private static String firstString(JsonObject object, String... names) {
        for (String name : names) {
            if (object.has(name) && !object.get(name).isJsonNull()) {
                return object.get(name).getAsString();
            }
        }
        return "";
    }

    private static Long firstLong(JsonObject object, String name) {
        if (!object.has(name) || object.get(name).isJsonNull()) {
            return null;
        }
        try {
            return object.get(name).getAsLong();
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private static String valueOrDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private static String config(String key, String fallback) {
        String property = System.getProperty(key);
        if (property != null && !property.isBlank()) {
            return property.trim();
        }
        String environment = System.getenv(key);
        return environment == null || environment.isBlank() ? fallback : environment.trim();
    }
}
