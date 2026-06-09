package com.genai.controller;

import java.io.IOException;

import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.genai.model.Parent;
import com.genai.service.MissionService;
import com.genai.session.SessionKeys;

@WebServlet("/parent/submissions/approve")
public class SubmissionApproveServlet extends HttpServlet {
    private MissionService missionService;

    @Override
    public void init() {
        missionService = new MissionService();
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        Parent parent = (Parent) request.getSession(false).getAttribute(SessionKeys.PARENT);
        try {
            Long submissionId = Long.valueOf(request.getParameter("submissionId"));
            boolean approved = missionService.approve(
                    submissionId, parent.getParentId(), request.getParameter("boxGrade"));
            response.sendRedirect(request.getContextPath()
                    + "/parent/submissions?" + (approved ? "reviewed=1" : "error=not-found"));
        } catch (RuntimeException exception) {
            getServletContext().log("Submission approval failed.", exception);
            response.sendRedirect(request.getContextPath() + "/parent/submissions?error=approve");
        }
    }
}
