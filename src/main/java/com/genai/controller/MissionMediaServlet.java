package com.genai.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.genai.model.ChildProfile;
import com.genai.model.Parent;
import com.genai.service.MissionMediaStorage;
import com.genai.service.MissionService;
import com.genai.session.SessionKeys;

@WebServlet("/media/submissions/*")
public class MissionMediaServlet extends HttpServlet {
    private MissionMediaStorage mediaStorage;
    private MissionService missionService;

    @Override
    public void init() {
        mediaStorage = new MissionMediaStorage();
        missionService = new MissionService();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String mediaUrl = request.getRequestURI().substring(request.getContextPath().length());
        Parent parent = request.getSession(false) == null
                ? null
                : (Parent) request.getSession(false).getAttribute(SessionKeys.PARENT);
        ChildProfile child = request.getSession(false) == null
                ? null
                : (ChildProfile) request.getSession(false).getAttribute(SessionKeys.CHILD);
        boolean allowed = parent != null
                && missionService.canParentAccessMedia(mediaUrl, parent.getParentId());
        if (!allowed && child != null) {
            allowed = missionService.canChildAccessMedia(mediaUrl, child.getChildId());
        }
        if (!allowed) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN);
            return;
        }
        Path file = mediaStorage.resolveUrl(mediaUrl);
        if (file == null) {
            response.sendError(HttpServletResponse.SC_NOT_FOUND);
            return;
        }

        String contentType = Files.probeContentType(file);
        response.setContentType(contentType == null ? "application/octet-stream" : contentType);
        response.setHeader("Cache-Control", "no-store");
        Files.copy(file, response.getOutputStream());
    }
}
