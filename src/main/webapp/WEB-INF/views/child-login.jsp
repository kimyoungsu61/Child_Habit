<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!doctype html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>아이 로그인</title>
</head>
<body>
<main>
    <section>
        <p>CHILD</p>
        <h1>초대코드 입장</h1>
        <p>부모님에게 받은 8자리 초대코드를 입력하세요.</p>

        <c:if test="${param.expired == '1'}">
            <p>초대코드가 변경되었거나 로그인이 만료되었습니다.</p>
        </c:if>
        <c:if test="${not empty error}">
            <p><c:out value="${error}"/></p>
        </c:if>

        <form method="post" action="${pageContext.request.contextPath}/child/login">
            <label for="inviteCode">초대코드</label>
            <input id="inviteCode" name="inviteCode" type="text"
                   minlength="8" maxlength="8"
                   value="<c:out value='${inviteCode}'/>"
                   autocomplete="one-time-code"
                   style="text-transform: uppercase; letter-spacing: .18em;" required>

            <label>
                <input name="rememberMe" type="checkbox" checked>
                30일 동안 로그인 유지
            </label>

            <button type="submit">아이 화면 시작</button>
        </form>
        <a href="${pageContext.request.contextPath}/login">처음으로</a>
    </section>
</main>
</body>
</html>
