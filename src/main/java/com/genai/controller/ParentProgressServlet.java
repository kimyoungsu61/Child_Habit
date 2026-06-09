package com.genai.controller;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.genai.model.Parent;
import com.genai.service.MissionService;
import com.genai.session.SessionKeys;

@WebServlet("/parent/progress")
public class ParentProgressServlet extends HttpServlet {
    private MissionService missionService;

    @Override
    public void init() {
        missionService = new MissionService();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        Parent parent = (Parent) request.getSession(false).getAttribute(SessionKeys.PARENT);
        request.setAttribute(
                "progressList", missionService.findTodayProgressForParent(parent.getParentId()));
        request.getRequestDispatcher("/WEB-INF/views/parent-progress.jsp").forward(request, response);
    }
}
