package com.genai.controller;

import java.io.IOException;

import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import com.genai.service.PersistentLoginService;
import com.genai.session.RememberCookies;

@WebServlet({"/logout", "/parent/logout"})
public class ParentLogoutServlet extends HttpServlet {
    private PersistentLoginService persistentLoginService;

    @Override
    public void init() {
        persistentLoginService = new PersistentLoginService();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        logout(request, response);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        logout(request, response);
    }

    private void logout(HttpServletRequest request, HttpServletResponse response) throws IOException {
        persistentLoginService.revoke(
                RememberCookies.read(request, RememberCookies.PARENT));
        persistentLoginService.revoke(
                RememberCookies.read(request, RememberCookies.CHILD));
        RememberCookies.clear(request, response, RememberCookies.PARENT);
        RememberCookies.clear(request, response, RememberCookies.CHILD);

        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        response.sendRedirect(request.getContextPath() + "/login");
    }
}
