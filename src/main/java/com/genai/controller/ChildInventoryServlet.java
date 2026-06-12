package com.genai.controller;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.genai.model.ChildProfile;
import com.genai.service.ChildAccountService;
import com.genai.service.MissionService;
import com.genai.session.SessionKeys;

@WebServlet("/child/inventory")
public class ChildInventoryServlet extends HttpServlet {
    private MissionService missionService;
    private ChildAccountService childAccountService;

    @Override
    public void init() {
        missionService = new MissionService();
        childAccountService = new ChildAccountService();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        ChildProfile child =
                (ChildProfile) request.getSession(false).getAttribute(SessionKeys.CHILD);
        request.setAttribute(
                "inventory", missionService.findRewardInventoryForChild(child.getChildId()));
        ChildProfile refreshed = childAccountService.findById(child.getChildId());
        request.setAttribute("frames", childAccountService.findFrames());
        request.setAttribute("badgeCount",
                childAccountService.countApprovedSubmissions(child.getChildId()));
        request.setAttribute("currentFrameId", refreshed.getFrameId());
        request.getRequestDispatcher("/WEB-INF/views/child-inventory.jsp").forward(request, response);
    }
}
