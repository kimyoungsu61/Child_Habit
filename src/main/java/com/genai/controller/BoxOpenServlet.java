package com.genai.controller;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.genai.model.BoxOpenResult;
import com.genai.model.ChildProfile;
import com.genai.service.MissionService;
import com.genai.session.SessionKeys;

@WebServlet("/child/boxes/open")
public class BoxOpenServlet extends HttpServlet {
    private MissionService missionService;

    @Override
    public void init() {
        missionService = new MissionService();
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws IOException, ServletException {
        ChildProfile child = (ChildProfile) request.getSession(false).getAttribute(SessionKeys.CHILD);
        try {
            Long submissionId = Long.valueOf(request.getParameter("submissionId"));
            BoxOpenResult result = missionService.openBox(child.getChildId(), submissionId);
            request.setAttribute("boxResult", result);
            request.setAttribute("submissions", missionService.findChildSubmissions(child.getChildId()));
            request.getRequestDispatcher("/WEB-INF/views/child-mission.jsp").forward(request, response);
        } catch (RuntimeException exception) {
            getServletContext().log("Reward box open failed.", exception);
            response.sendRedirect(request.getContextPath() + "/child/mission?error=box");
        }
    }
}
