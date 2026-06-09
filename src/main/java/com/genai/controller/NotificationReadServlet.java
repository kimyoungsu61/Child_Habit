package com.genai.controller;

import java.io.IOException;

import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.genai.model.ChildProfile;
import com.genai.model.Parent;
import com.genai.service.MissionService;
import com.genai.session.SessionKeys;

@WebServlet({"/parent/notifications/read", "/child/notifications/read"})
public class NotificationReadServlet extends HttpServlet {
    private MissionService missionService;

    @Override
    public void init() {
        missionService = new MissionService();
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        Long notificationId;
        try {
            notificationId = Long.valueOf(request.getParameter("notificationId"));
        } catch (RuntimeException exception) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST);
            return;
        }

        String path = request.getRequestURI().substring(request.getContextPath().length());
        if (path.startsWith("/parent/")) {
            Parent parent = (Parent) request.getSession(false).getAttribute(SessionKeys.PARENT);
            missionService.markParentNotificationRead(notificationId, parent.getParentId());
            response.sendRedirect(request.getContextPath() + "/parent/notifications");
            return;
        }

        ChildProfile child =
                (ChildProfile) request.getSession(false).getAttribute(SessionKeys.CHILD);
        missionService.markChildNotificationRead(notificationId, child.getChildId());
        response.sendRedirect(request.getContextPath() + "/child/notifications");
    }
}
