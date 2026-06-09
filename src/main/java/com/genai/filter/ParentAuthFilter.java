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

import com.genai.model.Parent;
import com.genai.service.PersistentLoginService;
import com.genai.session.RememberCookies;
import com.genai.session.SessionKeys;

@WebFilter("/parent/*")
public class ParentAuthFilter implements Filter {
    private PersistentLoginService persistentLoginService;

    @Override
    public void init(javax.servlet.FilterConfig filterConfig) {
        persistentLoginService = new PersistentLoginService();
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        String path = httpRequest.getRequestURI().substring(httpRequest.getContextPath().length());

        if ("/parent/login".equals(path) || "/parent/join".equals(path)) {
            chain.doFilter(request, response);
            return;
        }

        HttpSession session = httpRequest.getSession(false);
        Parent parent = session == null
                ? null
                : (Parent) session.getAttribute(SessionKeys.PARENT);
        if (parent == null) {
            parent = persistentLoginService.restoreParent(
                    RememberCookies.read(httpRequest, RememberCookies.PARENT));
            if (parent != null) {
                session = httpRequest.getSession(true);
                session.setAttribute(SessionKeys.PARENT, parent);
                session.setMaxInactiveInterval(30 * 60);
            } else {
                RememberCookies.clear(httpRequest, httpResponse, RememberCookies.PARENT);
            }
        }

        if (parent == null) {
            httpResponse.sendRedirect(httpRequest.getContextPath() + "/parent/login");
            return;
        }
        chain.doFilter(request, response);
    }
}
