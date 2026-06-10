# 리워드 상자 이미지 적용 내역

## 추가된 이미지 경로

```text
src/main/webapp/assets/images/reward-boxes/reward_box_low_wood.png
src/main/webapp/assets/images/reward-boxes/reward_box_middle_silver.png
src/main/webapp/assets/images/reward-boxes/reward_box_high_gold.png
```

배포 산출물 확인용으로 `target/back/assets/images/reward-boxes/`에도 같은 파일을 넣었습니다.

## 수정된 파일

```text
src/main/webapp/WEB-INF/views/child-inventory.jsp
src/main/webapp/css/07-parent-child-flows.css
target/back/WEB-INF/views/child-inventory.jsp
target/back/css/07-parent-child-flows.css
```

## 핵심

기존 `LOW / MID / HIGH` 텍스트 표시를 실제 상자 이미지로 교체했습니다.
