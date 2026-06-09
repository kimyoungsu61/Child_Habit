package com.genai.controller;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.genai.model.ChildProfile;
import com.genai.model.Parent;
import com.genai.service.MissionService;
import com.genai.session.SessionKeys;

@WebServlet({"/parent/missions", "/child/missions"})
public class MissionListServlet extends HttpServlet {
    private MissionService missionService;

    @Override
    public void init() {
        missionService = new MissionService();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String path = request.getRequestURI().substring(request.getContextPath().length());
        if (path.startsWith("/parent/")) {
            Parent parent = (Parent) request.getSession(false).getAttribute(SessionKeys.PARENT);
            request.setAttribute("missions", missionService.findMissionsForParent(parent.getParentId()));
            request.getRequestDispatcher("/WEB-INF/views/parent-dashboard.jsp").forward(request, response);
            return;
        }

        ChildProfile child = (ChildProfile) request.getSession(false).getAttribute(SessionKeys.CHILD);
        request.setAttribute("missions", missionService.findMissionsForChild(child.getChildId()));
        request.getRequestDispatcher("/WEB-INF/views/child-mission.jsp").forward(request, response);
    }
}
