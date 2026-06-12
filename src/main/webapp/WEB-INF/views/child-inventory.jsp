<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<!doctype html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>보상함 / 인벤토리</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/style.css?v=inventory-tabs">
</head>
<body class="child-mode">
<c:set var="lowCount" value="0" />
<c:set var="middleCount" value="0" />
<c:set var="highCount" value="0" />
<c:forEach var="item" items="${inventory}">
    <c:if test="${item.boxGrade == 'low'}"><c:set var="lowCount" value="${item.quantity}" /></c:if>
    <c:if test="${item.boxGrade == 'middle'}"><c:set var="middleCount" value="${item.quantity}" /></c:if>
    <c:if test="${item.boxGrade == 'high'}"><c:set var="highCount" value="${item.quantity}" /></c:if>
</c:forEach>

<main class="app is-entered">
    <header class="topbar">
        <a class="page-back-btn" href="${pageContext.request.contextPath}/child/home" aria-label="아이 홈으로 돌아가기">&lt;</a>
        <span class="profile-avatar profile-photo">
            <c:out value="${fn:substring(sessionScope.loginChild.nickname, 0, 1)}" />
        </span>
        <div class="topbar-copy">
            <h1>보상함 / 인벤토리</h1>
            <p>보유 상자와 프레임을 확인해요</p>
        </div>
        <form method="post" action="${pageContext.request.contextPath}/logout">
            <button class="exit-btn" type="submit">나가기</button>
        </form>
    </header>

    <section class="screen active" id="childInventoryScreen">
        <article class="card panel flow-panel inventory-panel">
            <h2>보상함</h2>
            <div class="inventory-tabs" role="tablist" aria-label="보상함 카테고리">
                <button class="inventory-tab active" type="button" data-inventory-tab="boxes">리워드 상자</button>
                <button class="inventory-tab" type="button" data-inventory-tab="badges">뱃지</button>
                <button class="inventory-tab" type="button" data-inventory-tab="frames">액자</button>
            </div>

            <div class="inventory-tab-panel active" data-inventory-panel="boxes">
                <div class="inventory-section-head">
                    <strong>보유 상자</strong>
                    <span>상자를 누르면 개봉 흐름을 연결할 수 있습니다</span>
                </div>
                <div class="reward-box-list">
                    <button class="reward-box-card low" type="button" ${lowCount <= 0 ? 'disabled' : ''}>
                        <span class="reward-box-emoji reward-box-thumb">
                            <img src="${pageContext.request.contextPath}/assets/rewards/reward_box_low_wood.png" alt="하급 상자">
                        </span>
                        <strong>하급 상자</strong>
                        <em><b>${lowCount}</b>개 보유</em>
                    </button>
                    <button class="reward-box-card middle" type="button" ${middleCount <= 0 ? 'disabled' : ''}>
                        <span class="reward-box-emoji reward-box-thumb">
                            <img src="${pageContext.request.contextPath}/assets/rewards/reward_box_middle_silver.png" alt="중급 상자">
                        </span>
                        <strong>중급 상자</strong>
                        <em><b>${middleCount}</b>개 보유</em>
                    </button>
                    <button class="reward-box-card high" type="button" ${highCount <= 0 ? 'disabled' : ''}>
                        <span class="reward-box-emoji reward-box-thumb">
                            <img src="${pageContext.request.contextPath}/assets/rewards/reward_box_high_gold.png" alt="상급 상자">
                        </span>
                        <strong>상급 상자</strong>
                        <em><b>${highCount}</b>개 보유</em>
                    </button>
                </div>
                <p class="flow-note">실제 상자 개봉은 아직 submissionId 기준으로 처리되므로, 다음 단계에서 상자 카드와 미개봉 제출 건을 연결하면 됩니다.</p>
            </div>

            <div class="inventory-tab-panel" data-inventory-panel="badges">
                <div class="inventory-section-head">
                    <strong>뱃지</strong>
                    <span>펫 만렙 달성 시 지급 예정</span>
                </div>
                <div class="badge-dex-grid">
                    <article class="badge-card locked">
                        <div class="badge-visual"><img src="${pageContext.request.contextPath}/assets/images/badges/badge_mongle.webp" alt="몽글 별빛 뱃지"></div>
                        <strong>몽글 별빛 뱃지</strong>
                        <span>몽글 만렙 달성 필요</span>
                    </article>
                    <article class="badge-card locked">
                        <div class="badge-visual"><img src="${pageContext.request.contextPath}/assets/images/badges/badge_roa.webp" alt="로아 용기 뱃지"></div>
                        <strong>로아 용기 뱃지</strong>
                        <span>로아 만렙 달성 필요</span>
                    </article>
                    <article class="badge-card locked">
                        <div class="badge-visual"><img src="${pageContext.request.contextPath}/assets/images/badges/badge_haeon.webp" alt="해온 햇살 뱃지"></div>
                        <strong>해온 햇살 뱃지</strong>
                        <span>해온 만렙 달성 필요</span>
                    </article>
                    <article class="badge-card locked">
                        <div class="badge-visual"><img src="${pageContext.request.contextPath}/assets/images/badges/badge_nuri.webp" alt="누리 잎새 뱃지"></div>
                        <strong>누리 잎새 뱃지</strong>
                        <span>누리 만렙 달성 필요</span>
                    </article>
                    <article class="badge-card locked">
                        <div class="badge-visual"><img src="${pageContext.request.contextPath}/assets/images/badges/badge_aro.webp" alt="아로 물결 뱃지"></div>
                        <strong>아로 물결 뱃지</strong>
                        <span>아로 만렙 달성 필요</span>
                    </article>
                    <article class="badge-card locked">
                        <div class="badge-visual"><img src="${pageContext.request.contextPath}/assets/images/badges/badge_pogeun.webp" alt="포근 하트 뱃지"></div>
                        <strong>포근 하트 뱃지</strong>
                        <span>포근 만렙 달성 필요</span>
                    </article>
                </div>
            </div>

            <div class="inventory-tab-panel" data-inventory-panel="frames">
                <div class="inventory-section-head">
                    <strong>액자 도감</strong>
                    <span>획득 조건을 달성하면 잠금 해제</span>
                </div>
                <div class="frame-dex-grid">
                    <c:forEach var="frame" items="${frames}">
                        <c:set var="unlocked" value="${badgeCount >= frame.requiredBadgeCount}" />
                        <c:set var="selected" value="${currentFrameId == frame.frameId}" />
                        <article class="frame-dex-card ${unlocked ? 'owned' : 'locked'} ${selected ? 'selected' : ''}">
                            <div class="frame-dex-preview ${unlocked ? '' : 'silhouette'}">
                                <img src="${pageContext.request.contextPath}${frame.frameImageUrl}" alt="${frame.frameName}">
                                <c:if test="${!unlocked}"><b>?</b></c:if>
                            </div>
                            <strong>${frame.frameName}</strong>
                            <span>
                                <c:choose>
                                    <c:when test="${selected}">현재 사용 중</c:when>
                                    <c:when test="${unlocked && frame.requiredBadgeCount == 0}">기본 보유</c:when>
                                    <c:when test="${unlocked}">뱃지 ${frame.requiredBadgeCount}개 해금 완료</c:when>
                                    <c:otherwise>뱃지 ${frame.requiredBadgeCount}개 필요</c:otherwise>
                                </c:choose>
                            </span>
                        </article>
                    </c:forEach>
                </div>
            </div>
        </article>
    </section>
</main>

<script>
document.querySelectorAll('[data-inventory-tab]').forEach(function(button) {
    button.addEventListener('click', function() {
        var selectedTab = button.dataset.inventoryTab;
        document.querySelectorAll('[data-inventory-tab]').forEach(function(tabButton) {
            tabButton.classList.toggle('active', tabButton.dataset.inventoryTab === selectedTab);
        });
        document.querySelectorAll('[data-inventory-panel]').forEach(function(panel) {
            panel.classList.toggle('active', panel.dataset.inventoryPanel === selectedTab);
        });
    });
});
</script>
</body>
</html>
