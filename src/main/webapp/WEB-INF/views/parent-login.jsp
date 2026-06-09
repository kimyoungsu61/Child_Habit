<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!doctype html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>부모 로그인</title>
</head>
<body>
<main>
    <section>
        <p>PARENT</p>
        <h1>부모 로그인</h1>
        <p>아이 초대코드와 미션 인증을 관리합니다.</p>

        <c:if test="${param.joined == '1'}">
            <p>회원가입이 완료되었습니다. 로그인해 주세요.</p>
        </c:if>
        <c:if test="${not empty error}">
            <p><c:out value="${error}"/></p>
        </c:if>

        <form method="post" action="${pageContext.request.contextPath}/parent/login">
            <label for="email">이메일</label>
            <input id="email" name="email" type="email"
                   value="<c:out value='${email}'/>"
                   autocomplete="username" required>

            <label for="password">비밀번호</label>
            <input id="password" name="password" type="password"
                   autocomplete="current-password" required>

            <label>
                <input name="rememberMe" type="checkbox" checked>
                7일 동안 로그인 유지
            </label>

            <button type="submit">로그인</button>
        </form>
        <a href="${pageContext.request.contextPath}/join">부모 회원가입</a>
        <a href="${pageContext.request.contextPath}/login">처음으로</a>
    </section>
</main>
</body>
</html>
