# Back

어린이 행동 습관 형성 웹앱입니다.
Java Servlet 백엔드와 `changsoo2609/Changsoo`의 HTML/CSS/JavaScript
프론트엔드를 같은 WAR로 통합했습니다.

## 환경

- Java 21
- Apache Tomcat 9
- Oracle XE 11g
- MyBatis 3.5
- Maven

## 현재 구현

```text
부모 회원가입 및 로그인
-> 아이 프로필과 초대코드 생성
-> 초대코드 아이 로그인
-> 캐릭터 프리셋 및 기본 펫 선택
-> 아이 홈
-> 사진/영상 인증 메타데이터 제출
-> 부모 알림 생성
-> 부모 승인/거절 및 상자 등급 선택
-> 직접 사진 촬영/영상 녹화 제출
-> 부모 7일, 아이 30일 로그인 유지
-> 프론트 SPA와 `/api/*` JSON Servlet 연동
```

AI 이미지 생성과 랜덤 펫 보상은 현재 화면용 임시 동작이며 다음 단계에서
서버 저장 구조와 연결합니다.

## DB 설정

```properties
# src/main/resources/db.properties
db.driver=oracle.jdbc.OracleDriver
db.url=jdbc:oracle:thin:@project-db-campus.smhrd.com:1524:xe
db.username=...
db.password=...
```

새 Oracle 계정으로 변경할 때 위 파일의 `db.username`, `db.password`를 수정합니다.
환경변수 `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`를 설정하면 파일 값보다 우선합니다.

새 계정에는 다음 SQL을 순서대로 실행합니다.

```text
database/01_parent_schema.sql
database/02_login_child_schema.sql
database/03_game_schema.sql
database/04_frontend_gap_schema.sql
database/05_persistent_login_schema.sql
```

## 실행

```powershell
mvn clean package
```

생성 파일:

```text
target/back.war
```

Tomcat 배포 후 접속:

```text
http://localhost:8090/back/
```

주요 주소:

```text
/back/
/back/api/session
/back/api/parent/login
/back/api/parent/dashboard
/back/api/child/login
/back/api/child/home
```

Oracle XE가 `8080`을 사용하므로 Tomcat은 `8090` 포트를 사용합니다.
