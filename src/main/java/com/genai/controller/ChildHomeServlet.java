package com.genai.controller;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.genai.model.ChildPet;
import com.genai.model.ChildProfile;
import com.genai.service.ChildAccountService;
import com.genai.service.GameProfileService;
import com.genai.session.SessionKeys;

@WebServlet("/child/home")
public class ChildHomeServlet extends HttpServlet {
    private ChildAccountService childAccountService;
    private GameProfileService gameProfileService;

    @Override
    public void init() {
        childAccountService = new ChildAccountService();
        gameProfileService = new GameProfileService();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        ChildProfile loginChild =
                (ChildProfile) request.getSession(false).getAttribute(SessionKeys.CHILD);
        ChildProfile child = childAccountService.findById(loginChild.getChildId());
        ChildPet activePet = gameProfileService.findActivePet(loginChild.getChildId());

        if (child.getCharacterImageUrl() == null || activePet == null) {
            response.sendRedirect(request.getContextPath() + "/child/setup");
            return;
        }

        request.getSession(false).setAttribute(SessionKeys.CHILD, child);
        request.setAttribute("activePet", activePet);
        request.getRequestDispatcher("/WEB-INF/views/child-home.jsp").forward(request, response);
    }
}
