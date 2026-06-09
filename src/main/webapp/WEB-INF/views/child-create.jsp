<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!doctype html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>아이 초대코드 생성</title>
</head>
<body class="parent-mode">
<main class="app is-entered">
    <header class="topbar">
        <div class="topbar-copy">
            <h1>아이 초대코드 만들기</h1>
            <p>부모는 슬롯과 초대코드만 생성합니다.</p>
        </div>
        <a class="exit-btn" href="${pageContext.request.contextPath}/parent/dashboard">뒤로</a>
    </header>

    <section class="screen active">
        <article class="card panel invite-card">
            <h2>새 아이 초대 슬롯</h2>
            <p>생성 후 부모 홈에서 초대코드를 확인하고 아이에게 전달하세요.</p>
            <c:if test="${not empty error}">
                <p class="entry-message"><c:out value="${error}"/></p>
            </c:if>
            <div class="qr-placeholder">INVITE</div>
            <form method="post" action="${pageContext.request.contextPath}/parent/children/new">
                <button class="btn primary full" type="submit">초대코드 생성</button>
            </form>
        </article>
    </section>
</main>
</body>
</html>
