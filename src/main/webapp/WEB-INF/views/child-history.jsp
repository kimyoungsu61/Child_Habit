<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!doctype html>
<html lang="ko">
<head><meta charset="UTF-8"><title>성장 기록</title></head>
<body>
<h1>성장 기록</h1>
<a href="${pageContext.request.contextPath}/child/home">아이 홈</a>
<c:choose>
    <c:when test="${empty history}">
        <p>아직 기록이 없습니다.</p>
    </c:when>
    <c:otherwise>
        <c:forEach var="record" items="${history}">
            <article>
                <strong><c:out value="${record.title}"/></strong>
                <p><c:out value="${record.description}"/></p>
                <span><c:out value="${record.status}"/> · <c:out value="${record.eventAt}"/></span>
            </article>
        </c:forEach>
    </c:otherwise>
</c:choose>
</body>
</html>
