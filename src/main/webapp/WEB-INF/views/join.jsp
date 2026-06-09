<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!doctype html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>부모 회원가입</title>
</head>
<body>
<main class="app">
    <section class="entry-screen">
        <article class="entry-card entry-panel active card join-card">
            <div class="entry-hero">
                <span class="entry-kicker">JOIN</span>
                <h1>부모 계정 만들기</h1>
                <p>가입 후 아이 초대 슬롯을 만들 수 있습니다.</p>
            </div>
            <c:if test="${not empty error}">
                <p class="entry-message"><c:out value="${error}"/></p>
            </c:if>
            <form method="post" action="${pageContext.request.contextPath}/join">
                <label class="entry-field" for="email">
                    <span>이메일</span>
                    <input id="email" name="email" type="email" value="<c:out value='${email}'/>" autocomplete="username" required>
                </label>
                <label class="entry-field" for="password">
                    <span>비밀번호</span>
                    <input id="password" name="password" type="password" autocomplete="new-password" minlength="8" required>
                </label>
                <label class="entry-field" for="passwordConfirm">
                    <span>비밀번호 확인</span>
                    <input id="passwordConfirm" name="passwordConfirm" type="password" autocomplete="new-password" minlength="8" required>
                </label>
                <label class="entry-field" for="name">
                    <span>이름</span>
                    <input id="name" name="name" type="text" value="<c:out value='${name}'/>" autocomplete="name" required>
                </label>
                <button class="btn primary full" type="submit">가입 완료</button>
            </form>
            <a class="btn ghost full" href="${pageContext.request.contextPath}/parent/login">로그인으로</a>
        </article>
    </section>
</main>
</body>
</html>
