package com.genai.controller;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import com.genai.model.ChildProfile;
import com.genai.service.ChildAccountService;
import com.genai.service.PersistentLoginService;
import com.genai.session.RememberCookies;
import com.genai.session.SessionKeys;

@WebServlet("/child/login")
public class ChildInviteLoginServlet extends HttpServlet {
    private ChildAccountService childAccountService;
    private PersistentLoginService persistentLoginService;

    @Override
    public void init() {
        childAccountService = new ChildAccountService();
        persistentLoginService = new PersistentLoginService();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        HttpSession session = request.getSession(false);
        if (session != null && session.getAttribute(SessionKeys.CHILD) != null) {
            response.sendRedirect(request.getContextPath() + "/child/home");
            return;
        }

        String rememberToken = RememberCookies.read(request, RememberCookies.CHILD);
        ChildProfile remembered = persistentLoginService.restoreChild(rememberToken);
        if (remembered != null) {
            createChildSession(request, remembered);
            response.sendRedirect(request.getContextPath() + "/child/home");
            return;
        }
        if (rememberToken != null) {
            RememberCookies.clear(request, response, RememberCookies.CHILD);
        }
        request.getRequestDispatcher("/WEB-INF/views/child-login.jsp").forward(request, response);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        request.setCharacterEncoding("UTF-8");
        String inviteCode = request.getParameter("inviteCode");
        ChildProfile child = childAccountService.loginByInviteCode(inviteCode);
        if (child == null) {
            request.setAttribute("inviteCode", inviteCode);
            request.setAttribute("error", "유효하지 않은 초대코드입니다.");
            request.getRequestDispatcher("/WEB-INF/views/child-login.jsp").forward(request, response);
            return;
        }

        createChildSession(request, child);

        String oldToken = RememberCookies.read(request, RememberCookies.CHILD);
        persistentLoginService.revoke(oldToken);
        if ("on".equals(request.getParameter("rememberMe"))) {
            String token = persistentLoginService.issueChildToken(child.getChildId());
            RememberCookies.add(request, response, RememberCookies.CHILD, token,
                    PersistentLoginService.CHILD_MAX_AGE_SECONDS);
        } else {
            RememberCookies.clear(request, response, RememberCookies.CHILD);
        }
        response.sendRedirect(request.getContextPath() + "/child/home");
    }

    private void createChildSession(HttpServletRequest request, ChildProfile child) {
        HttpSession oldSession = request.getSession(false);
        if (oldSession != null) {
            oldSession.invalidate();
        }
        HttpSession session = request.getSession(true);
        session.setAttribute(SessionKeys.CHILD, child);
        session.setMaxInactiveInterval(30 * 60);
    }
}
