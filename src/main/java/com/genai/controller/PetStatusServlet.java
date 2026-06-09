package com.genai.controller;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.genai.model.ChildPet;
import com.genai.model.ChildProfile;
import com.genai.service.GameProfileService;
import com.genai.session.SessionKeys;

@WebServlet("/child/pet/status")
public class PetStatusServlet extends HttpServlet {
    private GameProfileService gameProfileService;

    @Override
    public void init() {
        gameProfileService = new GameProfileService();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        ChildProfile child = (ChildProfile) request.getSession(false).getAttribute(SessionKeys.CHILD);
        ChildPet activePet = gameProfileService.findActivePet(child.getChildId());
        request.setAttribute("activePet", activePet);
        request.getRequestDispatcher("/WEB-INF/views/child-home.jsp").forward(request, response);
    }
}
