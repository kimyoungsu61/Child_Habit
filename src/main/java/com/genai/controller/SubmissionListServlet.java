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

@WebServlet({"/parent/reviews", "/parent/submissions"})
public class SubmissionListServlet extends HttpServlet {
    private MissionService missionService;

    @Override
    public void init() {
        missionService = new MissionService();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        Parent parent =
                (Parent) request.getSession(false).getAttribute(SessionKeys.PARENT);
        request.setAttribute("submissions",
                missionService.findPendingForParent(parent.getParentId()));
        request.setAttribute("rewardBoxes", missionService.findRewardBoxes());
        request.getRequestDispatcher("/WEB-INF/views/parent-reviews.jsp").forward(request, response);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        Parent parent =
                (Parent) request.getSession(false).getAttribute(SessionKeys.PARENT);
        try {
            Long submissionId = Long.valueOf(request.getParameter("submissionId"));
            boolean reviewed = missionService.review(
                    submissionId,
                    parent.getParentId(),
                    request.getParameter("decision"),
                    request.getParameter("boxGrade"));
            response.sendRedirect(request.getContextPath()
                    + "/parent/reviews?" + (reviewed ? "reviewed=1" : "error=not-found"));
        } catch (RuntimeException exception) {
            getServletContext().log("Mission review failed.", exception);
            response.sendRedirect(request.getContextPath() + "/parent/reviews?error=invalid");
        }
    }
}
