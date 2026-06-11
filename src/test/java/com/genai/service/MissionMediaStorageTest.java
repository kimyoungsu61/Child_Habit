package com.genai.service;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Collection;
import java.util.List;

import javax.servlet.http.Part;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class MissionMediaStorageTest {
    @TempDir
    Path tempDirectory;

    @Test
    void savesWebmWithCodecParametersAndDeletesIt() {
        MissionMediaStorage storage = new MissionMediaStorage(tempDirectory);
        Part video = new MemoryPart(
                "mediaFile",
                "mission-video.webm",
                "video/webm;codecs=vp8,opus",
                new byte[] { 1, 2, 3, 4 });

        String mediaUrl = storage.save(video, "video");
        Path saved = storage.resolveUrl(mediaUrl);

        assertNotNull(saved);
        assertTrue(Files.exists(saved));
        assertTrue(storage.deleteByUrl(mediaUrl));
        assertFalse(Files.exists(saved));
    }

    private static final class MemoryPart implements Part {
        private final String name;
        private final String submittedFileName;
        private final String contentType;
        private final byte[] content;

        private MemoryPart(String name, String submittedFileName,
                String contentType, byte[] content) {
            this.name = name;
            this.submittedFileName = submittedFileName;
            this.contentType = contentType;
            this.content = content;
        }

        @Override
        public InputStream getInputStream() {
            return new ByteArrayInputStream(content);
        }

        @Override
        public String getContentType() {
            return contentType;
        }

        @Override
        public String getName() {
            return name;
        }

        @Override
        public String getSubmittedFileName() {
            return submittedFileName;
        }

        @Override
        public long getSize() {
            return content.length;
        }

        @Override
        public void write(String fileName) throws IOException {
            throw new UnsupportedOperationException();
        }

        @Override
        public void delete() {
        }

        @Override
        public String getHeader(String name) {
            return null;
        }

        @Override
        public Collection<String> getHeaders(String name) {
            return List.of();
        }

        @Override
        public Collection<String> getHeaderNames() {
            return List.of();
        }
    }
}
