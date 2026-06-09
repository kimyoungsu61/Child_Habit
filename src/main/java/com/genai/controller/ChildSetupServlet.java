package com.genai.controller;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.genai.model.ChildProfile;
import com.genai.service.ChildAccountService;
import com.genai.service.GameProfileService;
import com.genai.session.SessionKeys;

@WebServlet("/child/setup")
public class ChildSetupServlet extends HttpServlet {
    private GameProfileService gameProfileService;
    private ChildAccountService childAccountService;

    @Override
    public void init() {
        gameProfileService = new GameProfileService();
        childAccountService = new ChildAccountService();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        request.setAttribute("starterPets", gameProfileService.findStarterPets());
        request.getRequestDispatcher("/WEB-INF/views/child-setup.jsp").forward(request, response);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        request.setCharacterEncoding("UTF-8");
        ChildProfile loginChild =
                (ChildProfile) request.getSession(false).getAttribute(SessionKeys.CHILD);

        try {
            String petIdParameter = request.getParameter("petId");
            if (petIdParameter == null || petIdParameter.isBlank()) {
                throw new IllegalArgumentException("시작할 펫을 선택해 주세요.");
            }
            Long petId = Long.valueOf(petIdParameter);
            gameProfileService.completeInitialSetup(
                    loginChild.getChildId(),
                    request.getParameter("nickname"),
                    request.getParameter("characterPreset"),
                    petId);

            ChildProfile refreshed = childAccountService.findById(loginChild.getChildId());
            request.getSession(false).setAttribute(SessionKeys.CHILD, refreshed);
            response.sendRedirect(request.getContextPath() + "/child/home?setup=1");
        } catch (RuntimeException exception) {
            getServletContext().log("Child initial setup failed.", exception);
            request.setAttribute("starterPets", gameProfileService.findStarterPets());
            request.setAttribute("nickname", request.getParameter("nickname"));
            request.setAttribute("error", exception.getMessage());
            request.getRequestDispatcher("/WEB-INF/views/child-setup.jsp").forward(request, response);
        }
    }
}
