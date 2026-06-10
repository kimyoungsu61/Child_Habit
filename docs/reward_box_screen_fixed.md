# 리워드 상자 이미지 적용 수정본

## 수정 목적

상자 획득 화면에서 `LOW / MID / HIGH` 텍스트가 보이던 문제를 실제 상자 이미지로 교체했습니다.

## 수정된 화면

```text
src/main/webapp/WEB-INF/views/app.jsp
<section id="childRewardBoxScreen">
```

## 수정된 파일

```text
src/main/webapp/WEB-INF/views/app.jsp
src/main/webapp/js/07-backend-integration.js
src/main/webapp/css/07-parent-child-flows.css
src/main/webapp/WEB-INF/views/child-inventory.jsp
```

## 추가된 이미지

```text
src/main/webapp/assets/images/reward-boxes/reward_box_low_wood.png
src/main/webapp/assets/images/reward-boxes/reward_box_middle_silver.png
src/main/webapp/assets/images/reward-boxes/reward_box_high_gold.png
```

## 적용 후 확인

Eclipse/Tomcat에서 반영이 안 보이면 아래 순서로 확인합니다.

```text
1. Project > Clean
2. Maven > Update Project
3. Tomcat 서버 Stop
4. target 폴더 삭제 또는 mvn clean package
5. Tomcat 재시작
6. 브라우저 Ctrl + F5
```
