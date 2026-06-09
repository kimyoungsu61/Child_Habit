<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!doctype html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>아이 프로필 만들기</title>
</head>
<body class="child-mode">
<main class="app is-entered">
    <header class="topbar">
        <div class="topbar-copy">
            <h1>아이 프로필 만들기</h1>
            <p>닉네임과 함께 시작할 친구를 선택하세요.</p>
        </div>
        <form method="post" action="${pageContext.request.contextPath}/logout">
            <button class="exit-btn" type="submit">나가기</button>
        </form>
    </header>

    <section class="screen active">
        <article class="card panel profile-setup-card">
            <h2>처음 설정</h2>
            <p>초대코드는 확인되었습니다. 이제 아이가 사용할 이름과 기본 펫을 고르면 됩니다.</p>
            <c:if test="${not empty error}">
                <p class="entry-message"><c:out value="${error}"/></p>
            </c:if>
            <form method="post" action="${pageContext.request.contextPath}/child/setup">
                <label class="entry-field" for="nickname">
                    <span>아이 닉네임</span>
                    <input id="nickname" name="nickname" type="text" value="<c:out value='${nickname}'/>" maxlength="50" required>
                </label>
                <input type="hidden" name="characterPreset" value="forest">

                <div class="mission-grade-list">
                    <c:choose>
                        <c:when test="${empty starterPets}">
                            <div class="empty-dex">시작할 펫 데이터가 없습니다. DB seed를 먼저 확인해 주세요.</div>
                        </c:when>
                        <c:otherwise>
                            <c:forEach var="pet" items="${starterPets}" varStatus="status">
                                <label class="pet-select-card" for="pet-${pet.petId}">
                                    <span class="dex-token">${status.index + 1}</span>
                                    <div>
                                        <strong><c:out value="${pet.displayName}"/></strong>
                                        <p><c:out value="${pet.description}"/></p>
                                        <input id="pet-${pet.petId}" name="petId" type="radio" value="${pet.petId}" ${status.first ? 'checked' : ''}>
                                    </div>
                                </label>
                            </c:forEach>
                        </c:otherwise>
                    </c:choose>
                </div>
                <button class="btn primary full" type="submit">아이 홈 시작하기</button>
            </form>
        </article>
    </section>
</main>
</body>
</html>
