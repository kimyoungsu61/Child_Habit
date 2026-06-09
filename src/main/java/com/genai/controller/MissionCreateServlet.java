package com.genai.controller;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.genai.model.Parent;
import com.genai.model.ChildProfile;
import com.genai.service.ChildAccountService;
import com.genai.service.MissionService;
import com.genai.session.SessionKeys;

@WebServlet("/parent/missions/create")
public class MissionCreateServlet extends HttpServlet {
    private ChildAccountService childAccountService;
    private MissionService missionService;

    @Override
    public void init() {
        childAccountService = new ChildAccountService();
        missionService = new MissionService();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        Parent parent = (Parent) request.getSession(false).getAttribute(SessionKeys.PARENT);
        request.setAttribute("children", childAccountService.findChildren(parent.getParentId()));
        request.getRequestDispatcher("/WEB-INF/views/parent-dashboard.jsp").forward(request, response);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws IOException, ServletException {
        request.setCharacterEncoding("UTF-8");
        Parent parent = (Parent) request.getSession(false).getAttribute(SessionKeys.PARENT);
        try {
            Long childId = Long.valueOf(request.getParameter("childId"));
            ChildProfile child = childAccountService.findById(childId);
            if (child == null || !parent.getParentId().equals(child.getParentId())) {
                throw new IllegalArgumentException("The child does not belong to this parent.");
            }
            missionService.createMission(
                    parent.getParentId(),
                    childId,
                    request.getParameter("missionTitle"),
                    request.getParameter("missionDescription"),
                    request.getParameter("missionGrade"),
                    request.getParameter("mediaType"));
            response.sendRedirect(request.getContextPath() + "/parent/dashboard?created=mission");
        } catch (RuntimeException exception) {
            getServletContext().log("Mission creation failed.", exception);
            response.sendRedirect(request.getContextPath() + "/parent/dashboard?error=create-mission");
        }
    }
}
