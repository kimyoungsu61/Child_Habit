package com.genai.controller;

import java.io.IOException;

import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import com.genai.model.ChildProfile;
import com.genai.model.Parent;
import com.genai.service.AdminDemoService;
import com.genai.service.PersistentLoginService;
import com.genai.session.RememberCookies;
import com.genai.session.SessionKeys;

@WebServlet({"/logout", "/parent/logout"})
public class ParentLogoutServlet extends HttpServlet {
    private PersistentLoginService persistentLoginService;
    private AdminDemoService adminDemoService;

    @Override
    public void init() {
        persistentLoginService = new PersistentLoginService();
        adminDemoService = new AdminDemoService();
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
        HttpSession session = request.getSession(false);
        Parent parent = session == null ? null
                : (Parent) session.getAttribute(SessionKeys.PARENT);
        ChildProfile child = session == null ? null
                : (ChildProfile) session.getAttribute(SessionKeys.CHILD);
        if (adminDemoService.isAdminParent(parent)
                || adminDemoService.isAdminChild(child)) {
            // 5. admin 데모 상태 초기화하기 (로그아웃/서버 재시작 시 초기화)
            adminDemoService.resetAdminChildDemo();
        }
        persistentLoginService.revoke(
                RememberCookies.read(request, RememberCookies.PARENT));
        persistentLoginService.revoke(
                RememberCookies.read(request, RememberCookies.CHILD));
        RememberCookies.clear(request, response, RememberCookies.PARENT);
        RememberCookies.clear(request, response, RememberCookies.CHILD);

        if (session != null) {
            session.invalidate();
        }
        response.sendRedirect(request.getContextPath() + "/login");
    }
}
