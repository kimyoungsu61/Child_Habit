package com.genai.controller;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.genai.model.ChildProfile;
import com.genai.model.Mission;
import com.genai.model.Parent;
import com.genai.service.MissionService;
import com.genai.session.SessionKeys;

@WebServlet({"/parent/missions/detail", "/child/missions/detail"})
public class MissionDetailServlet extends HttpServlet {
    private MissionService missionService;

    @Override
    public void init() {
        missionService = new MissionService();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        Long missionId = Long.valueOf(request.getParameter("missionId"));
        String path = request.getRequestURI().substring(request.getContextPath().length());
        Mission mission;
        if (path.startsWith("/parent/")) {
            Parent parent = (Parent) request.getSession(false).getAttribute(SessionKeys.PARENT);
            mission = missionService.findMissionForParent(missionId, parent.getParentId());
        } else {
            ChildProfile child = (ChildProfile) request.getSession(false).getAttribute(SessionKeys.CHILD);
            mission = missionService.findMissionForChild(missionId, child.getChildId());
        }
        if (mission == null) {
            response.sendError(HttpServletResponse.SC_NOT_FOUND);
            return;
        }
        request.setAttribute("mission", mission);
        request.getRequestDispatcher("/WEB-INF/views/child-mission.jsp").forward(request, response);
    }
}
