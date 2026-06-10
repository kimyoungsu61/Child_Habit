# 최종 보상 상자 이미지 수정

## 핵심 수정

- 상자 개봉 화면의 HIGH/MID/LOW 텍스트를 실제 이미지로 교체
- index.html, app.jsp, target/back/app.jsp 모두 반영
- JS/CSS 캐시 방지를 위해 app.jsp의 v 파라미터를 변경
- 기존 JS가 textContent로 HIGH를 다시 넣는 문제를 방지

## 적용 후 권장

```text
1. Tomcat Stop
2. Project > Clean
3. Maven > Update Project
4. mvn clean package
5. Tomcat 재시작
6. 브라우저 Ctrl + F5
```
