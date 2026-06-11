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
import com.genai.service.GeneratedImageStorage;
import com.genai.session.SessionKeys;

@WebServlet("/media/generated/*")
public class GeneratedImageServlet extends HttpServlet {
    private GeneratedImageStorage imageStorage;

    @Override
    public void init() {
        imageStorage = new GeneratedImageStorage();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        Parent parent = request.getSession(false) == null
                ? null
                : (Parent) request.getSession(false).getAttribute(SessionKeys.PARENT);
        ChildProfile child = request.getSession(false) == null
                ? null
                : (ChildProfile) request.getSession(false).getAttribute(SessionKeys.CHILD);
        if (parent == null && child == null) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN);
            return;
        }

        String mediaUrl = request.getRequestURI().substring(request.getContextPath().length());
        Path file = imageStorage.resolveUrl(mediaUrl);
        if (file == null) {
            response.sendError(HttpServletResponse.SC_NOT_FOUND);
            return;
        }

        String contentType = Files.probeContentType(file);
        response.setContentType(contentType == null ? "image/png" : contentType);
        response.setHeader("Cache-Control", "no-store");
        Files.copy(file, response.getOutputStream());
    }
}
