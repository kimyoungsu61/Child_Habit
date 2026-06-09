<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!doctype html>
<html lang="ko">
<head><meta charset="UTF-8"><title>부모 알림</title></head>
<body>
<h1>부모 알림</h1>
<a href="${pageContext.request.contextPath}/parent/dashboard">대시보드</a>
<c:forEach var="notification" items="${notifications}">
    <article>
        <strong><c:out value="${notification.title}"/></strong>
        <p><c:out value="${notification.content}"/></p>
        <span>${notification.isRead == 'Y' ? '읽음' : '새 알림'}</span>
        <c:if test="${notification.isRead == 'N'}">
            <form method="post" action="${pageContext.request.contextPath}/parent/notifications/read">
                <input type="hidden" name="notificationId" value="${notification.notificationId}">
                <button type="submit">읽음 처리</button>
            </form>
        </c:if>
    </article>
</c:forEach>
</body>
</html>
