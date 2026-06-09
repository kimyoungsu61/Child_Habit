package com.genai.filter;

import java.io.IOException;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.annotation.WebFilter;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import com.genai.model.ChildProfile;
import com.genai.service.ChildAccountService;
import com.genai.service.PersistentLoginService;
import com.genai.session.RememberCookies;
import com.genai.session.SessionKeys;

@WebFilter("/child/*")
public class ChildAuthFilter implements Filter {
    private ChildAccountService childAccountService;
    private PersistentLoginService persistentLoginService;

    @Override
    public void init(javax.servlet.FilterConfig filterConfig) {
        childAccountService = new ChildAccountService();
        persistentLoginService = new PersistentLoginService();
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        String path = httpRequest.getRequestURI().substring(httpRequest.getContextPath().length());

        if ("/child/login".equals(path)) {
            chain.doFilter(request, response);
            return;
        }

        HttpSession session = httpRequest.getSession(false);
        ChildProfile loginChild = session == null
                ? null
                : (ChildProfile) session.getAttribute(SessionKeys.CHILD);

        if (loginChild == null) {
            loginChild = persistentLoginService.restoreChild(
                    RememberCookies.read(httpRequest, RememberCookies.CHILD));
            if (loginChild != null) {
                session = httpRequest.getSession(true);
                session.setAttribute(SessionKeys.CHILD, loginChild);
                session.setMaxInactiveInterval(30 * 60);
            } else {
                RememberCookies.clear(httpRequest, httpResponse, RememberCookies.CHILD);
            }
        }

        if (loginChild == null || !isCurrentInvite(loginChild)) {
            if (session != null) {
                session.invalidate();
            }
            persistentLoginService.revoke(
                    RememberCookies.read(httpRequest, RememberCookies.CHILD));
            RememberCookies.clear(httpRequest, httpResponse, RememberCookies.CHILD);
            httpResponse.sendRedirect(httpRequest.getContextPath() + "/child/login?expired=1");
            return;
        }
        chain.doFilter(request, response);
    }

    private boolean isCurrentInvite(ChildProfile loginChild) {
        ChildProfile current = childAccountService.findById(loginChild.getChildId());
        return current != null && current.getInviteCode().equals(loginChild.getInviteCode());
    }
}
