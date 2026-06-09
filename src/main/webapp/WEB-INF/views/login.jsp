<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<!doctype html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>AI 리워드 MVP</title>
</head>
<body>
<main class="app">
    <section class="entry-screen">
        <article class="entry-card entry-panel active card">
            <div class="entry-hero">
                <span class="entry-kicker">서비스 시작</span>
                <h1>좋은 습관을 몽글이와 함께 만들어요</h1>
                <p>부모는 미션을 확인하고, 아이는 초대코드로 접속해 인증과 보상을 이어갑니다.</p>
                <div class="entry-choice-row">
                    <a class="btn mint" href="${pageContext.request.contextPath}/parent/login">부모로 시작하기</a>
                    <a class="btn primary" href="${pageContext.request.contextPath}/child/login">아이로 시작하기</a>
                </div>
            </div>
        </article>
    </section>
</main>
</body>
</html>
