package com.genai.controller;

import java.io.IOException;

import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.genai.model.Parent;
import com.genai.service.MissionService;
import com.genai.session.SessionKeys;

@WebServlet("/parent/submissions/reject")
public class SubmissionRejectServlet extends HttpServlet {
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
            boolean rejected = missionService.reject(submissionId, parent.getParentId());
            response.sendRedirect(request.getContextPath()
                    + "/parent/submissions?" + (rejected ? "reviewed=1" : "error=not-found"));
        } catch (RuntimeException exception) {
            getServletContext().log("Submission rejection failed.", exception);
            response.sendRedirect(request.getContextPath() + "/parent/submissions?error=reject");
        }
    }
}
