package com.genai.controller;

import java.io.IOException;
import java.util.regex.Pattern;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.genai.service.JoinResult;
import com.genai.service.ParentService;

@WebServlet({"/join", "/parent/join"})
public class ParentJoinServlet extends HttpServlet {
    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$", Pattern.CASE_INSENSITIVE);

    private ParentService parentService;

    @Override
    public void init() {
        parentService = new ParentService();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        request.getRequestDispatcher("/WEB-INF/views/join.jsp").forward(request, response);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        request.setCharacterEncoding("UTF-8");

        String email = value(request.getParameter("email"));
        String name = value(request.getParameter("name"));
        String password = value(request.getParameter("password"));
        String passwordConfirm = value(request.getParameter("passwordConfirm"));

        String error = validate(email, name, password, passwordConfirm);
        if (error != null) {
            showFormWithError(request, response, email, name, error);
            return;
        }

        try {
            JoinResult result = parentService.join(email, password, name);
            if (result == JoinResult.DUPLICATE_EMAIL) {
                showFormWithError(request, response, email, name, "이미 가입된 이메일입니다.");
                return;
            }
            response.sendRedirect(request.getContextPath() + "/parent/login?joined=1");
        } catch (RuntimeException exception) {
            getServletContext().log("Parent registration failed.", exception);
            showFormWithError(request, response, email, name,
                    "회원가입 처리 중 오류가 발생했습니다. DB 연결 상태를 확인해 주세요.");
        }
    }

    private String validate(String email, String name, String password, String passwordConfirm) {
        if (email.isBlank() || name.isBlank() || password.isBlank()) {
            return "모든 필수 항목을 입력해 주세요.";
        }
        if (email.length() > 100 || !EMAIL_PATTERN.matcher(email).matches()) {
            return "올바른 이메일 주소를 입력해 주세요.";
        }
        if (name.length() > 50) {
            return "이름은 50자 이하로 입력해 주세요.";
        }
        if (password.length() < 8 || password.length() > 72) {
            return "비밀번호는 8자 이상 72자 이하로 입력해 주세요.";
        }
        if (!password.equals(passwordConfirm)) {
            return "비밀번호 확인이 일치하지 않습니다.";
        }
        return null;
    }

    private void showFormWithError(HttpServletRequest request, HttpServletResponse response,
            String email, String name, String error) throws ServletException, IOException {
        request.setAttribute("email", email);
        request.setAttribute("name", name);
        request.setAttribute("error", error);
        request.getRequestDispatcher("/WEB-INF/views/join.jsp").forward(request, response);
    }

    private String value(String input) {
        return input == null ? "" : input.trim();
    }
}
