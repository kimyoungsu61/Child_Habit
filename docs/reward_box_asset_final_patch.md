# 보상 상자 이미지 최종 수정본

## 수정 이유

사용 중인 보상함 화면은 `child-inventory.jsp`가 아니라 `app.jsp` 안의 `childInventoryScreen`이었습니다.
따라서 기존 수정본에서 LOW / MID / HIGH가 그대로 보였습니다.

## 이번 수정에서 반영한 화면

```text
src/main/webapp/WEB-INF/views/app.jsp
- childInventoryScreen
- childRewardBoxScreen
```

## 사용 에셋 경로

```text
src/main/webapp/assets/rewards/reward_box_low_wood.png
src/main/webapp/assets/rewards/reward_box_middle_silver.png
src/main/webapp/assets/rewards/reward_box_high_gold.png
```

## 중복 제거

```text
src/main/webapp/assets/images/reward-boxes
```

위 경로는 사용하지 않도록 제거했습니다.
