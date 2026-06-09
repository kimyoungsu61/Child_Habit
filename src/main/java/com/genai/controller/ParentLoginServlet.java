package com.genai.controller;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import com.genai.model.Parent;
import com.genai.service.ParentService;
import com.genai.service.PersistentLoginService;
import com.genai.session.RememberCookies;
import com.genai.session.SessionKeys;

@WebServlet("/parent/login")
public class ParentLoginServlet extends HttpServlet {
    private ParentService parentService;
    private PersistentLoginService persistentLoginService;

    @Override
    public void init() {
        parentService = new ParentService();
        persistentLoginService = new PersistentLoginService();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        if (request.getSession(false) != null
                && request.getSession(false).getAttribute(SessionKeys.PARENT) != null) {
            response.sendRedirect(request.getContextPath() + "/parent/dashboard");
            return;
        }

        String rememberToken = RememberCookies.read(request, RememberCookies.PARENT);
        Parent remembered = persistentLoginService.restoreParent(rememberToken);
        if (remembered != null) {
            createParentSession(request, remembered);
            response.sendRedirect(request.getContextPath() + "/parent/dashboard");
            return;
        }
        if (rememberToken != null) {
            RememberCookies.clear(request, response, RememberCookies.PARENT);
        }
        request.getRequestDispatcher("/WEB-INF/views/parent-login.jsp").forward(request, response);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        request.setCharacterEncoding("UTF-8");
        String email = value(request.getParameter("email"));
        String password = value(request.getParameter("password"));

        if (email.isBlank() || password.isBlank()) {
            showError(request, response, email, "이메일과 비밀번호를 입력해 주세요.");
            return;
        }

        Parent parent = parentService.login(email, password);
        if (parent == null) {
            showError(request, response, email, "이메일 또는 비밀번호가 올바르지 않습니다.");
            return;
        }

        createParentSession(request, parent);

        String oldToken = RememberCookies.read(request, RememberCookies.PARENT);
        persistentLoginService.revoke(oldToken);
        if ("on".equals(request.getParameter("rememberMe"))) {
            String token = persistentLoginService.issueParentToken(parent.getParentId());
            RememberCookies.add(request, response, RememberCookies.PARENT, token,
                    PersistentLoginService.PARENT_MAX_AGE_SECONDS);
        } else {
            RememberCookies.clear(request, response, RememberCookies.PARENT);
        }
        response.sendRedirect(request.getContextPath() + "/parent/dashboard");
    }

    private void createParentSession(HttpServletRequest request, Parent parent) {
        HttpSession oldSession = request.getSession(false);
        if (oldSession != null) {
            oldSession.invalidate();
        }
        HttpSession session = request.getSession(true);
        session.setAttribute(SessionKeys.PARENT, parent);
        session.setMaxInactiveInterval(30 * 60);
    }

    private void showError(HttpServletRequest request, HttpServletResponse response,
            String email, String error) throws ServletException, IOException {
        request.setAttribute("email", email);
        request.setAttribute("error", error);
        request.getRequestDispatcher("/WEB-INF/views/parent-login.jsp").forward(request, response);
    }

    private String value(String input) {
        return input == null ? "" : input.trim();
    }
}
