package com.genai.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.net.CookieHandler;
import java.net.ProxySelector;
import java.net.URI;
import java.net.Authenticator;
import java.net.http.HttpClient;
import java.net.http.HttpHeaders;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLParameters;
import javax.net.ssl.SSLSession;

import org.junit.jupiter.api.Test;

class AiImageServiceTest {
    @Test
    void parsesSuccessfulImageResponse() {
        FakeHttpClient client = FakeHttpClient.withResponse(200,
                """
                {
                  "success": true,
                  "image_base64": "abc123",
                  "prompt": "generated prompt",
                  "seed": 123456
                }
                """);
        AiImageService service = new AiImageService(client, "https://example.ngrok-free.app/generate", "");

        AiImageGenerationResult result = service.generateCharacter(Map.of(
                "gender", "girl",
                "userEmotion", "smile",
                "background", "city",
                "glasses", "none",
                "prompt", "browser prompt"));

        assertEquals("abc123", result.getImageBase64());
        assertEquals("generated prompt", result.getPrompt());
        assertEquals(123456L, result.getSeed());
        assertEquals(URI.create("https://example.ngrok-free.app/generate"), client.lastRequest.uri());
    }

    @Test
    void addsBearerTokenWhenConfigured() {
        FakeHttpClient client = FakeHttpClient.withResponse(200, "{\"image_base64\":\"abc\"}");
        AiImageService service = new AiImageService(client, "https://example.ngrok-free.app/generate", "token");

        service.generateCharacter(Map.of());

        assertEquals(Optional.of("Bearer token"),
                client.lastRequest.headers().firstValue("Authorization"));
    }

    @Test
    void propagatesServerFailureMessage() {
        FakeHttpClient client = FakeHttpClient.withResponse(200,
                "{\"success\":false,\"message\":\"model is not ready\"}");
        AiImageService service = new AiImageService(client, "https://example.ngrok-free.app/generate", "");

        IllegalStateException exception = assertThrows(IllegalStateException.class,
                () -> service.generateCharacter(Map.of()));

        assertEquals("model is not ready", exception.getMessage());
    }

    @Test
    void reportsColabNgrokGuidanceOnConnectionFailure() {
        FakeHttpClient client = FakeHttpClient.withException(new IOException("connection refused"));
        AiImageService service = new AiImageService(client, "https://example.ngrok-free.app/generate", "");

        IllegalStateException exception = assertThrows(IllegalStateException.class,
                () -> service.generateCharacter(Map.of()));

        assertTrue(exception.getMessage().contains("AI_IMAGE_API_URL"));
        assertTrue(exception.getMessage().contains("Colab/ngrok"));
    }

    @Test
    void reportsHttpStatusWhenServerReturnsError() {
        FakeHttpClient client = FakeHttpClient.withResponse(500, "{\"message\":\"broken\"}");
        AiImageService service = new AiImageService(client, "https://example.ngrok-free.app/generate", "");

        IllegalStateException exception = assertThrows(IllegalStateException.class,
                () -> service.generateCharacter(Map.of()));

        assertEquals("AI 이미지 서버 응답 오류: HTTP 500", exception.getMessage());
    }

    private static final class FakeHttpClient extends HttpClient {
        private final int statusCode;
        private final String body;
        private final IOException exception;
        private HttpRequest lastRequest;

        private FakeHttpClient(int statusCode, String body, IOException exception) {
            this.statusCode = statusCode;
            this.body = body;
            this.exception = exception;
        }

        static FakeHttpClient withResponse(int statusCode, String body) {
            return new FakeHttpClient(statusCode, body, null);
        }

        static FakeHttpClient withException(IOException exception) {
            return new FakeHttpClient(0, "", exception);
        }

        @Override
        public <T> HttpResponse<T> send(HttpRequest request, HttpResponse.BodyHandler<T> responseBodyHandler)
                throws IOException {
            this.lastRequest = request;
            if (exception != null) {
                throw exception;
            }
            HttpResponse.BodySubscriber<T> subscriber = responseBodyHandler.apply(
                    new HttpResponse.ResponseInfo() {
                        @Override
                        public int statusCode() {
                            return statusCode;
                        }

                        @Override
                        public HttpHeaders headers() {
                            return HttpHeaders.of(Map.of(), (name, value) -> true);
                        }

                        @Override
                        public HttpClient.Version version() {
                            return HttpClient.Version.HTTP_1_1;
                        }
                    });
            subscriber.onSubscribe(new java.util.concurrent.Flow.Subscription() {
                @Override
                public void request(long n) {
                }

                @Override
                public void cancel() {
                }
            });
            subscriber.onNext(java.util.List.of(java.nio.ByteBuffer.wrap(body.getBytes(StandardCharsets.UTF_8))));
            subscriber.onComplete();
            return new FakeHttpResponse<>(statusCode, subscriber.getBody().toCompletableFuture().join(), request);
        }

        @Override
        public <T> CompletableFuture<HttpResponse<T>> sendAsync(HttpRequest request,
                HttpResponse.BodyHandler<T> responseBodyHandler) {
            throw new UnsupportedOperationException();
        }

        @Override
        public <T> CompletableFuture<HttpResponse<T>> sendAsync(HttpRequest request,
                HttpResponse.BodyHandler<T> responseBodyHandler,
                HttpResponse.PushPromiseHandler<T> pushPromiseHandler) {
            throw new UnsupportedOperationException();
        }

        @Override
        public Optional<CookieHandler> cookieHandler() {
            return Optional.empty();
        }

        @Override
        public Optional<Duration> connectTimeout() {
            return Optional.empty();
        }

        @Override
        public Redirect followRedirects() {
            return Redirect.NEVER;
        }

        @Override
        public Optional<ProxySelector> proxy() {
            return Optional.empty();
        }

        @Override
        public SSLContext sslContext() {
            return null;
        }

        @Override
        public SSLParameters sslParameters() {
            return null;
        }

        @Override
        public Optional<Authenticator> authenticator() {
            return Optional.empty();
        }

        @Override
        public Version version() {
            return Version.HTTP_1_1;
        }

        @Override
        public Optional<Executor> executor() {
            return Optional.empty();
        }
    }

    private record FakeHttpResponse<T>(int statusCode, T body, HttpRequest request) implements HttpResponse<T> {
        @Override
        public Optional<HttpResponse<T>> previousResponse() {
            return Optional.empty();
        }

        @Override
        public HttpHeaders headers() {
            return HttpHeaders.of(Map.of(), (name, value) -> true);
        }

        @Override
        public Optional<SSLSession> sslSession() {
            return Optional.empty();
        }

        @Override
        public URI uri() {
            return request.uri();
        }

        @Override
        public HttpClient.Version version() {
            return HttpClient.Version.HTTP_1_1;
        }
    }
}
