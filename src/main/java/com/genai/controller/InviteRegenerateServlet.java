package com.genai.controller;

import java.io.IOException;

import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.genai.model.Parent;
import com.genai.service.ChildAccountService;
import com.genai.session.SessionKeys;

@WebServlet("/parent/invite/regenerate")
public class InviteRegenerateServlet extends HttpServlet {
    private ChildAccountService childAccountService;

    @Override
    public void init() {
        childAccountService = new ChildAccountService();
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        Parent parent = (Parent) request.getSession(false).getAttribute(SessionKeys.PARENT);
        try {
            Long childId = Long.valueOf(request.getParameter("childId"));
            childAccountService.regenerateInviteCode(childId, parent.getParentId());
            response.sendRedirect(request.getContextPath() + "/parent/dashboard?regenerated=1");
        } catch (RuntimeException exception) {
            getServletContext().log("Invite code regeneration failed.", exception);
            response.sendRedirect(request.getContextPath() + "/parent/dashboard?error=invite");
        }
    }
}
