package com.genai.controller;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@WebServlet("/app")
public class AppViewServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        // 1. JSP 화면으로 이동하기 (index.html 없이 메인 모바일 UI를 보여주는 단계)
        request.getRequestDispatcher("/WEB-INF/views/app.jsp").forward(request, response);
    }
}
