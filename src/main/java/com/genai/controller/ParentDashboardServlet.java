package com.genai.controller;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.genai.model.Parent;
import com.genai.service.ChildAccountService;
import com.genai.service.MissionService;
import com.genai.session.SessionKeys;

@WebServlet("/parent/dashboard")
public class ParentDashboardServlet extends HttpServlet {
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
        request.setAttribute("missions", missionService.findMissionsForParent(parent.getParentId()));
        request.getRequestDispatcher("/WEB-INF/views/parent-dashboard.jsp").forward(request, response);
    }
}
