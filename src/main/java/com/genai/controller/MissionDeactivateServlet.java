package com.genai.controller;

import java.io.IOException;

import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.genai.model.Parent;
import com.genai.service.MissionService;
import com.genai.session.SessionKeys;

@WebServlet("/parent/missions/deactivate")
public class MissionDeactivateServlet extends HttpServlet {
    private MissionService missionService;

    @Override
    public void init() {
        missionService = new MissionService();
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        Parent parent = (Parent) request.getSession(false).getAttribute(SessionKeys.PARENT);
        try {
            Long missionId = Long.valueOf(request.getParameter("missionId"));
            boolean deactivated =
                    missionService.deactivateMission(missionId, parent.getParentId());
            response.sendRedirect(request.getContextPath()
                    + "/parent/dashboard?"
                    + (deactivated ? "deactivated=mission" : "error=mission-not-found"));
        } catch (RuntimeException exception) {
            getServletContext().log("Mission deactivation failed.", exception);
            response.sendRedirect(
                    request.getContextPath() + "/parent/dashboard?error=deactivate-mission");
        }
    }
}
