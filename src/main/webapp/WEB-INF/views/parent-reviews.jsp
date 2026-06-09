<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!doctype html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>인증 검토</title>
</head>
<body class="parent-mode">
<main class="app is-entered">
    <header class="topbar">
        <div class="topbar-copy">
            <h1>제출 인증 검토</h1>
            <p>아이의 사진/영상 인증을 승인하거나 다시 요청하세요.</p>
        </div>
        <a class="exit-btn" href="${pageContext.request.contextPath}/parent/dashboard">홈</a>
    </header>

    <section class="screen active">
        <c:if test="${param.reviewed == '1'}">
            <p class="speech">검토 결과가 저장되었고 임시 파일을 삭제했습니다.</p>
        </c:if>
        <c:if test="${not empty param.error}">
            <p class="speech">검토 처리 중 오류가 발생했습니다.</p>
        </c:if>

        <article class="card panel flow-panel">
            <h2>승인 대기 제출물</h2>
            <div class="mission-grade-list">
                <c:choose>
                    <c:when test="${empty submissions}">
                        <div class="empty-dex">현재 승인 대기 중인 제출물이 없습니다.</div>
                    </c:when>
                    <c:otherwise>
                        <c:forEach var="submission" items="${submissions}">
                            <article class="submission-card">
                                <strong><c:out value="${submission.childNickname}"/> · <c:out value="${submission.mediaType}"/> 인증</strong>
                                <span>제출 상태: <c:out value="${submission.status}"/></span>
                                <div class="review-preview">
                                    <c:choose>
                                        <c:when test="${submission.mediaType == 'photo'}">
                                            <img src="${pageContext.request.contextPath}${submission.mediaUrl}" alt="제출 사진" style="width:100%;max-height:180px;object-fit:contain;">
                                        </c:when>
                                        <c:otherwise>
                                            <video src="${pageContext.request.contextPath}${submission.mediaUrl}" controls style="width:100%;max-height:180px;"></video>
                                        </c:otherwise>
                                    </c:choose>
                                </div>
                                <form method="post" action="${pageContext.request.contextPath}/parent/reviews" class="form-panel">
                                    <input type="hidden" name="submissionId" value="${submission.submissionId}">
                                    <label class="entry-field">
                                        <span>검토 결과</span>
                                        <select name="decision" required>
                                            <option value="approved">승인</option>
                                            <option value="rejected">거절</option>
                                        </select>
                                    </label>
                                    <label class="entry-field">
                                        <span>지급 상자</span>
                                        <select name="boxGrade">
                                            <option value="">거절 또는 미지급</option>
                                            <c:forEach var="box" items="${rewardBoxes}">
                                                <option value="${box.boxGrade}">
                                                    <c:out value="${box.boxName}"/> (${box.minExp}~${box.maxExp} EXP)
                                                </option>
                                            </c:forEach>
                                        </select>
                                    </label>
                                    <button class="btn mint full" type="submit">검토 저장</button>
                                </form>
                            </article>
                        </c:forEach>
                    </c:otherwise>
                </c:choose>
            </div>
        </article>
    </section>
</main>
</body>
</html>
