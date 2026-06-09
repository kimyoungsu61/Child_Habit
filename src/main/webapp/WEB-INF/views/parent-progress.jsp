<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!doctype html>
<html lang="ko">
<head><meta charset="UTF-8"><title>오늘 진행 현황</title></head>
<body>
<h1>오늘 진행 현황</h1>
<a href="${pageContext.request.contextPath}/parent/dashboard">대시보드</a>
<c:choose>
    <c:when test="${empty progressList}">
        <p>연결된 아이가 없습니다.</p>
    </c:when>
    <c:otherwise>
        <table>
            <thead>
            <tr><th>아이</th><th>배정</th><th>승인 대기</th><th>완료</th><th>거절</th><th>남은 미션</th></tr>
            </thead>
            <tbody>
            <c:forEach var="progress" items="${progressList}">
                <tr>
                    <td><c:out value="${progress.childNickname}"/></td>
                    <td>${progress.assignedCount}</td>
                    <td>${progress.pendingCount}</td>
                    <td>${progress.completedCount}</td>
                    <td>${progress.rejectedCount}</td>
                    <td>${progress.remainingCount}</td>
                </tr>
            </c:forEach>
            </tbody>
        </table>
    </c:otherwise>
</c:choose>
</body>
</html>
