package com.genai.session;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public final class RememberCookies {
    public static final String PARENT = "parent_remember";
    public static final String CHILD = "child_remember";

    private RememberCookies() {
    }

    public static String read(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        for (Cookie cookie : cookies) {
            if (name.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }

    public static void add(HttpServletRequest request, HttpServletResponse response,
            String name, String value, int maxAgeSeconds) {
        response.addHeader("Set-Cookie", cookieHeader(
                request, name, value, maxAgeSeconds));
    }

    public static void clear(HttpServletRequest request, HttpServletResponse response,
            String name) {
        response.addHeader("Set-Cookie", cookieHeader(request, name, "", 0));
    }

    private static String cookieHeader(HttpServletRequest request, String name,
            String value, int maxAgeSeconds) {
        String contextPath = request.getContextPath();
        String path = contextPath == null || contextPath.isBlank() ? "/" : contextPath + "/";
        StringBuilder header = new StringBuilder()
                .append(name).append('=').append(value)
                .append("; Max-Age=").append(maxAgeSeconds)
                .append("; Path=").append(path)
                .append("; HttpOnly; SameSite=Lax");
        if (request.isSecure()) {
            header.append("; Secure");
        }
        return header.toString();
    }
}

