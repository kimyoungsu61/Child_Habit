# 보상 상자 에셋 정리 적용본

## 정리 기준

상자 이미지는 아래 기존 에셋 폴더만 사용합니다.

```text
src/main/webapp/assets/rewards/
```

`src/main/webapp/assets/images/reward-boxes/` 중복 폴더는 사용하지 않습니다.

## 적용 이미지

```text
src/main/webapp/assets/rewards/reward_box_low_wood.png
src/main/webapp/assets/rewards/reward_box_middle_silver.png
src/main/webapp/assets/rewards/reward_box_high_gold.png
```

## 수정된 파일

```text
src/main/webapp/WEB-INF/views/app.jsp
src/main/webapp/WEB-INF/views/child-inventory.jsp
src/main/webapp/js/04-servlet-workflows.js
src/main/webapp/js/07-backend-integration.js
src/main/webapp/css/07-parent-child-flows.css
```

## 반영 내용

- 보상함 / 인벤토리 화면의 LOW, MID, HIGH 텍스트를 상자 이미지로 교체
- 상자 획득 화면의 LOW, MID, HIGH 텍스트를 상자 이미지로 교체
- 중복 에셋 경로 제거
- `assets/rewards` 기준으로 이미지 경로 통일
