package com.genai.controller;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.genai.model.ChildProfile;
import com.genai.service.MissionService;
import com.genai.session.SessionKeys;

@WebServlet("/child/inventory")
public class ChildInventoryServlet extends HttpServlet {
    private MissionService missionService;

    @Override
    public void init() {
        missionService = new MissionService();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        ChildProfile child =
                (ChildProfile) request.getSession(false).getAttribute(SessionKeys.CHILD);
        request.setAttribute(
                "inventory", missionService.findRewardInventoryForChild(child.getChildId()));
        request.getRequestDispatcher("/WEB-INF/views/child-inventory.jsp").forward(request, response);
    }
}
