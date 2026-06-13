<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<!doctype html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>아이 홈</title>
</head>
<body class="child-mode">
<main class="app is-entered">
    <header class="topbar">
        <span class="profile-avatar profile-photo">
            <c:out value="${fn:substring(sessionScope.loginChild.nickname, 0, 1)}"/>
        </span>
        <div class="topbar-copy">
            <h1>오늘도 좋은 습관 만들기</h1>
            <p><c:out value="${sessionScope.loginChild.nickname}"/>님, 미션을 인증하면 펫이 성장해요.</p>
        </div>
        <form method="post" action="${pageContext.request.contextPath}/logout">
            <button class="exit-btn" type="submit">나가기</button>
        </form>
    </header>

    <section class="screen active">
        <c:if test="${param.setup == '1'}">
            <p class="speech">프로필 설정이 완료되었습니다.</p>
        </c:if>
        <c:set var="petHomeBg" value="${pageContext.request.contextPath}/assets/backgrounds/pet_home_bg.png?v=pet-home-bg-20260613" />
        <c:if test="${activePet.petId == 2}">
            <c:set var="petHomeBg" value="${pageContext.request.contextPath}/assets/backgrounds/pet_home_bg_roa.png?v=pet-home-bg-20260613" />
        </c:if>
        <article class="card pet-room state-normal" style="--pet-home-bg: url('${petHomeBg}')">
            <div class="pet-summary">
                <div>
                    <h2><c:out value="${activePet.pet.displayName}"/></h2>
                    <p>기본 펫 · Lv.${activePet.currentLevel}</p>
                </div>
                <span class="state-chip">성장 중</span>
            </div>
            <div class="pet-stage">
                <span class="twinkle one"></span>
                <span class="twinkle two"></span>
                <span class="twinkle three"></span>
                <div class="pet-frame-wrap">
                    <div class="dex-token" style="width:128px;height:128px;font-size:42px;">
                        <c:out value="${fn:substring(activePet.pet.displayName, 0, 1)}"/>
                    </div>
                </div>
            </div>
            <div class="exp-row">
                <span>EXP ${activePet.currentExp}</span>
                <span>Lv.${activePet.currentLevel}</span>
            </div>
            <div class="progress-track"><div class="progress-fill" style="width:${activePet.currentExp % 100}%"></div></div>
            <div class="speech">"오늘의 미션을 인증하면 보상 상자를 받을 수 있어요."</div>
            <div class="pet-actions">
                <a class="btn primary" href="${pageContext.request.contextPath}/child/mission">미션 인증</a>
                <a class="btn mint" href="${pageContext.request.contextPath}/child/setup">프로필 설정</a>
            </div>
        </article>
    </section>
</main>
</body>
</html>
