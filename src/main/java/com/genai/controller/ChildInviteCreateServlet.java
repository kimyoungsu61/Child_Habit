package com.genai.controller;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.genai.model.Parent;
import com.genai.service.ChildAccountService;
import com.genai.session.SessionKeys;

@WebServlet({"/parent/children/new", "/parent/invites/create"})
public class ChildInviteCreateServlet extends HttpServlet {
    private ChildAccountService childAccountService;

    @Override
    public void init() {
        childAccountService = new ChildAccountService();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        request.getRequestDispatcher("/WEB-INF/views/child-create.jsp").forward(request, response);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        Parent parent = (Parent) request.getSession(false).getAttribute(SessionKeys.PARENT);
        try {
            childAccountService.createChildInviteSlot(parent.getParentId());
            response.sendRedirect(request.getContextPath() + "/parent/dashboard?created=1");
        } catch (RuntimeException exception) {
            getServletContext().log("Child invite slot creation failed.", exception);
            request.setAttribute("error", "초대코드 생성 중 오류가 발생했습니다.");
            request.getRequestDispatcher("/WEB-INF/views/child-create.jsp").forward(request, response);
        }
    }
}
