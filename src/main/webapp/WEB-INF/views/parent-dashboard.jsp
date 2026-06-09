<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<!doctype html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>보호자 대시보드</title>
</head>
<body>
<header>
    <h1><c:out value="${sessionScope.loginParent.name}"/> 보호자 대시보드</h1>
    <form method="post" action="${pageContext.request.contextPath}/logout">
        <button type="submit">로그아웃</button>
    </form>
</header>

<nav>
    <a href="${pageContext.request.contextPath}/parent/reviews">인증 검토</a>
    <a href="${pageContext.request.contextPath}/parent/progress">오늘 진행 현황</a>
    <a href="${pageContext.request.contextPath}/parent/notifications">부모 알림</a>
    <a href="${pageContext.request.contextPath}/parent/children/new">초대코드 생성</a>
</nav>

<c:if test="${param.created == '1'}"><p>아이 초대코드가 생성되었습니다.</p></c:if>
<c:if test="${param.regenerated == '1'}"><p>초대코드가 재발급되었습니다.</p></c:if>
<c:if test="${param.created == 'mission'}"><p>미션이 등록되었습니다.</p></c:if>
<c:if test="${param.updated == 'mission'}"><p>미션이 수정되었습니다.</p></c:if>
<c:if test="${param.deactivated == 'mission'}"><p>미션이 비활성화되었습니다.</p></c:if>
<c:if test="${not empty param.error}"><p>요청 처리 중 오류가 발생했습니다.</p></c:if>

<section>
    <h2>요약</h2>
    <p>연결된 아이: ${fn:length(children)}명</p>
</section>

<section>
    <h2>미션 등록</h2>
    <c:choose>
        <c:when test="${empty children}">
            <p>먼저 아이 초대코드를 생성해 주세요.</p>
        </c:when>
        <c:otherwise>
            <form method="post" action="${pageContext.request.contextPath}/parent/missions/create">
                <label>
                    배정 아이
                    <select name="childId" required>
                        <c:forEach var="child" items="${children}">
                            <option value="${child.childId}"><c:out value="${child.nickname}"/></option>
                        </c:forEach>
                    </select>
                </label>
                <label>
                    제목
                    <input name="missionTitle" maxlength="100" required>
                </label>
                <label>
                    설명
                    <input name="missionDescription" maxlength="1000">
                </label>
                <label>
                    등급
                    <select name="missionGrade" required>
                        <option value="low">하급 상자</option>
                        <option value="middle">중급 상자</option>
                        <option value="high">상급 상자</option>
                    </select>
                </label>
                <label>
                    인증 방식
                    <select name="mediaType" required>
                        <option value="photo">사진</option>
                        <option value="video">영상</option>
                    </select>
                </label>
                <button type="submit">미션 등록</button>
            </form>
        </c:otherwise>
    </c:choose>
</section>

<section>
    <h2>미션 목록</h2>
    <c:choose>
        <c:when test="${empty missions}">
            <p>등록된 미션이 없습니다.</p>
        </c:when>
        <c:otherwise>
            <c:forEach var="mission" items="${missions}">
                <article>
                    <h3><c:out value="${mission.missionTitle}"/></h3>
                    <p>
                        <c:out value="${mission.childNickname}"/> ·
                        <c:out value="${mission.missionGrade}"/> ·
                        <c:out value="${mission.mediaType}"/>
                    </p>
                    <p><c:out value="${mission.missionDescription}"/></p>
                    <details>
                        <summary>수정 또는 비활성화</summary>
                        <form method="post" action="${pageContext.request.contextPath}/parent/missions/update">
                            <input type="hidden" name="missionId" value="${mission.missionId}">
                            <label>
                                배정 아이
                                <select name="childId" required>
                                    <c:forEach var="child" items="${children}">
                                        <option value="${child.childId}" ${child.childId == mission.childId ? 'selected' : ''}>
                                            <c:out value="${child.nickname}"/>
                                        </option>
                                    </c:forEach>
                                </select>
                            </label>
                            <label>
                                제목
                                <input name="missionTitle" value="<c:out value='${mission.missionTitle}'/>" maxlength="100" required>
                            </label>
                            <label>
                                설명
                                <input name="missionDescription" value="<c:out value='${mission.missionDescription}'/>" maxlength="1000">
                            </label>
                            <label>
                                등급
                                <select name="missionGrade" required>
                                    <option value="low" ${mission.missionGrade == 'low' ? 'selected' : ''}>하급</option>
                                    <option value="middle" ${mission.missionGrade == 'middle' ? 'selected' : ''}>중급</option>
                                    <option value="high" ${mission.missionGrade == 'high' ? 'selected' : ''}>상급</option>
                                </select>
                            </label>
                            <label>
                                인증 방식
                                <select name="mediaType" required>
                                    <option value="photo" ${mission.mediaType == 'photo' ? 'selected' : ''}>사진</option>
                                    <option value="video" ${mission.mediaType == 'video' ? 'selected' : ''}>영상</option>
                                </select>
                            </label>
                            <button type="submit">수정 저장</button>
                        </form>
                        <form method="post" action="${pageContext.request.contextPath}/parent/missions/deactivate">
                            <input type="hidden" name="missionId" value="${mission.missionId}">
                            <button type="submit">미션 비활성화</button>
                        </form>
                    </details>
                </article>
            </c:forEach>
        </c:otherwise>
    </c:choose>
</section>

<section>
    <h2>연결된 아이</h2>
    <c:forEach var="child" items="${children}">
        <article>
            <strong><c:out value="${child.nickname}"/></strong>
            <p>초대코드: <c:out value="${child.inviteCode}"/></p>
            <form method="post" action="${pageContext.request.contextPath}/parent/invite/regenerate">
                <input type="hidden" name="childId" value="${child.childId}">
                <button type="submit">초대코드 재발급</button>
            </form>
        </article>
    </c:forEach>
</section>
</body>
</html>
