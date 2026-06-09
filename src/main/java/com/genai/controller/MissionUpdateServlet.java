package com.genai.controller;

import java.io.IOException;

import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.genai.model.ChildProfile;
import com.genai.model.Parent;
import com.genai.service.ChildAccountService;
import com.genai.service.MissionService;
import com.genai.session.SessionKeys;

@WebServlet("/parent/missions/update")
public class MissionUpdateServlet extends HttpServlet {
    private MissionService missionService;
    private ChildAccountService childAccountService;

    @Override
    public void init() {
        missionService = new MissionService();
        childAccountService = new ChildAccountService();
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        request.setCharacterEncoding("UTF-8");
        Parent parent = (Parent) request.getSession(false).getAttribute(SessionKeys.PARENT);
        try {
            Long missionId = Long.valueOf(request.getParameter("missionId"));
            Long childId = Long.valueOf(request.getParameter("childId"));
            ChildProfile child = childAccountService.findById(childId);
            if (child == null || !parent.getParentId().equals(child.getParentId())) {
                throw new IllegalArgumentException("The child does not belong to this parent.");
            }
            boolean updated = missionService.updateMission(
                    missionId,
                    parent.getParentId(),
                    childId,
                    request.getParameter("missionTitle"),
                    request.getParameter("missionDescription"),
                    request.getParameter("missionGrade"),
                    request.getParameter("mediaType"));
            response.sendRedirect(request.getContextPath()
                    + "/parent/dashboard?" + (updated ? "updated=mission" : "error=mission-not-found"));
        } catch (RuntimeException exception) {
            getServletContext().log("Mission update failed.", exception);
            response.sendRedirect(request.getContextPath() + "/parent/dashboard?error=update-mission");
        }
    }
}
