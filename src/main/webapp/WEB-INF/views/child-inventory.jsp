<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!doctype html>
<html lang="ko">
<head><meta charset="UTF-8"><title>보상함</title></head>
<body>
<h1>보상함</h1>
<a href="${pageContext.request.contextPath}/child/home">아이 홈</a>
<p>승인 후 아직 열지 않은 상자입니다.</p>
<c:forEach var="item" items="${inventory}">
    <section>
        <strong><c:out value="${item.boxName}"/></strong>
        <span>${item.quantity}개</span>
    </section>
</c:forEach>
<p>상자 개봉은 미션 제출 기록에서 할 수 있습니다.</p>
<a href="${pageContext.request.contextPath}/child/mission">미션 제출 기록</a>
</body>
</html>
