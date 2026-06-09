$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$outputDirectory = Join-Path $projectRoot "docs"
$pdfPath = Join-Path $outputDirectory "Controller_Servlet_21개_설명서.pdf"

New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null

$servlets = @(
    [ordered]@{
        File = "BoxOpenServlet.java"
        Title = "보상 상자 개봉 처리"
        Url = "/child/boxes/open"
        Methods = "POST"
        Session = "자녀 세션(SessionKeys.CHILD)"
        Inputs = "submissionId: 승인된 미션 제출 ID"
        Services = "MissionService"
        Flow = @(
            "세션에서 현재 로그인한 자녀 정보를 가져온다.",
            "submissionId를 Long 타입으로 변환한다.",
            "MissionService.openBox()를 호출하여 보상 상자를 연다.",
            "상자 등급에 따른 랜덤 EXP를 지급하고 활성 펫의 경험치와 레벨을 갱신한다.",
            "개봉 결과와 자녀의 제출 내역을 request에 담아 child-mission.jsp로 forward한다."
        )
        Result = "성공: /WEB-INF/views/child-mission.jsp에서 획득 EXP와 현재 펫 상태 표시"
        Error = "실패 로그를 남긴 뒤 /child/mission?error=box로 redirect"
        Note = "이미 지급된 보상이나 해당 자녀의 제출이 아닌 경우 서비스 계층에서 거부된다."
    },
    [ordered]@{
        File = "ChildHomeServlet.java"
        Title = "자녀 홈 화면 조회"
        Url = "/child/home"
        Methods = "GET"
        Session = "자녀 세션(SessionKeys.CHILD)"
        Inputs = "없음"
        Services = "ChildAccountService, GameProfileService"
        Flow = @(
            "세션의 자녀 ID로 최신 자녀 프로필을 다시 조회한다.",
            "현재 활성화된 펫 정보를 조회한다.",
            "캐릭터 이미지 또는 활성 펫이 없으면 초기 설정 화면으로 보낸다.",
            "최신 자녀 정보를 세션에 다시 저장한다.",
            "활성 펫을 request 속성으로 전달한다."
        )
        Result = "설정 완료: /WEB-INF/views/child-home.jsp로 forward, 미완료: /child/setup으로 redirect"
        Error = "별도 try-catch는 없으며 조회 예외는 서블릿 컨테이너로 전달된다."
        Note = "자녀 홈 진입 시 초기 프로필 설정 완료 여부를 검사하는 관문 역할을 한다."
    },
    [ordered]@{
        File = "ChildInviteCreateServlet.java"
        Title = "자녀 초대 슬롯 및 초대코드 생성"
        Url = "/parent/children/new, /parent/invites/create"
        Methods = "GET, POST"
        Session = "부모 세션(SessionKeys.PARENT)"
        Inputs = "POST 입력값 없음. 로그인 부모 ID를 사용"
        Services = "ChildAccountService"
        Flow = @(
            "GET 요청은 자녀 초대 생성 화면을 보여준다.",
            "POST 요청은 부모 세션에서 parentId를 가져온다.",
            "ChildAccountService.createChildInviteSlot()으로 자녀 레코드와 고유 초대코드를 만든다.",
            "생성된 코드는 이후 자녀가 별도 비밀번호 없이 로그인할 때 사용한다."
        )
        Result = "GET: child-create.jsp, POST 성공: /parent/dashboard?created=1로 redirect"
        Error = "오류 메시지를 request에 담아 child-create.jsp로 다시 forward"
        Note = "두 URL이 같은 서블릿으로 연결되는 별칭 구조다."
    },
    [ordered]@{
        File = "ChildInviteLoginServlet.java"
        Title = "초대코드를 이용한 자녀 로그인"
        Url = "/child/login"
        Methods = "GET, POST"
        Session = "로그인 성공 시 자녀 세션 생성"
        Inputs = "inviteCode: 부모가 발급한 초대코드"
        Services = "ChildAccountService"
        Flow = @(
            "GET 요청은 자녀 로그인 화면을 보여준다.",
            "POST 요청에서 초대코드를 받아 공백 제거 및 대문자 정규화 후 자녀를 조회한다.",
            "유효하지 않은 코드라면 입력값과 오류 메시지를 유지한 채 로그인 화면을 다시 보여준다.",
            "성공하면 기존 세션을 무효화해 세션 고정 공격을 방지한다.",
            "새 세션에 자녀 객체를 저장하고 만료 시간을 30분으로 설정한다."
        )
        Result = "성공: /child/home으로 redirect, 실패: child-login.jsp로 forward"
        Error = "잘못된 초대코드는 화면에 유효하지 않은 코드 오류로 표시"
        Note = "초대코드 자체가 자녀 계정의 로그인 자격 증명으로 사용된다."
    },
    [ordered]@{
        File = "ChildSetupServlet.java"
        Title = "자녀 초기 프로필과 시작 펫 설정"
        Url = "/child/setup"
        Methods = "GET, POST"
        Session = "자녀 세션(SessionKeys.CHILD)"
        Inputs = "nickname, characterPreset, petId"
        Services = "GameProfileService, ChildAccountService"
        Flow = @(
            "GET 요청은 선택 가능한 기본 펫 목록을 조회해 설정 화면에 전달한다.",
            "POST 요청은 닉네임, 캐릭터 프리셋, 시작 펫 ID를 받는다.",
            "GameProfileService.completeInitialSetup()으로 닉네임과 캐릭터 이미지, 활성 펫을 저장한다.",
            "DB에서 최신 자녀 프로필을 다시 읽어 세션 정보를 갱신한다.",
            "설정 완료 표시와 함께 자녀 홈으로 이동한다."
        )
        Result = "성공: /child/home?setup=1로 redirect, GET/실패: child-setup.jsp"
        Error = "기본 펫 목록과 기존 닉네임, 서비스 오류 메시지를 다시 화면에 전달"
        Note = "petId 필수 여부와 허용된 캐릭터 프리셋 및 펫 여부를 검증한다."
    },
    [ordered]@{
        File = "InviteRegenerateServlet.java"
        Title = "자녀 초대코드 재발급"
        Url = "/parent/invite/regenerate"
        Methods = "POST"
        Session = "부모 세션(SessionKeys.PARENT)"
        Inputs = "childId: 초대코드를 재발급할 자녀 ID"
        Services = "ChildAccountService"
        Flow = @(
            "부모 세션에서 parentId를 가져온다.",
            "요청의 childId를 숫자로 변환한다.",
            "해당 자녀가 현재 부모에게 속하는지 확인하면서 새로운 고유 초대코드를 발급한다.",
            "기존 초대코드는 새 코드 저장 후 더 이상 사용할 수 없다."
        )
        Result = "성공: /parent/dashboard?regenerated=1로 redirect"
        Error = "실패: /parent/dashboard?error=invite로 redirect"
        Note = "부모 ID를 함께 조건으로 사용해 다른 부모의 자녀 코드를 바꾸지 못하게 한다."
    },
    [ordered]@{
        File = "LoginServlet.java"
        Title = "로그인 유형 선택 화면"
        Url = "/login"
        Methods = "GET"
        Session = "사용하지 않음"
        Inputs = "없음"
        Services = "없음"
        Flow = @(
            "공통 로그인 시작 화면을 보여준다.",
            "사용자가 부모 로그인 또는 자녀 로그인 경로를 선택할 수 있게 한다."
        )
        Result = "/WEB-INF/views/login.jsp로 forward"
        Error = "별도 오류 처리 없음"
        Note = "인증을 직접 수행하지 않고 로그인 진입점 역할만 한다."
    },
    [ordered]@{
        File = "MissionCreateServlet.java"
        Title = "부모의 자녀 미션 등록"
        Url = "/parent/missions/create"
        Methods = "GET, POST"
        Session = "부모 세션(SessionKeys.PARENT)"
        Inputs = "childId, missionTitle, missionDescription, missionGrade"
        Services = "ChildAccountService, MissionService"
        Flow = @(
            "GET 요청은 현재 부모의 자녀 목록을 조회해 부모 대시보드에 전달한다.",
            "POST 요청은 대상 자녀, 미션 제목과 설명, 보상 등급을 받는다.",
            "세션의 parentId와 입력값을 사용해 MissionService.createMission()을 호출한다.",
            "서비스 계층에서 제목 길이와 low/middle/high 등급을 검증한 뒤 DB에 저장한다."
        )
        Result = "성공: /parent/dashboard?created=mission으로 redirect"
        Error = "실패 로그를 남기고 /parent/dashboard?error=create-mission으로 redirect"
        Note = "현재 컨트롤러는 childId가 로그인 부모의 자녀인지 직접 확인하지 않고 서비스/DB 구조에 의존한다."
    },
    [ordered]@{
        File = "MissionDetailServlet.java"
        Title = "부모·자녀별 미션 상세 조회"
        Url = "/parent/missions/detail, /child/missions/detail"
        Methods = "GET"
        Session = "요청 경로에 따라 부모 또는 자녀 세션 사용"
        Inputs = "missionId"
        Services = "MissionService"
        Flow = @(
            "요청 URL이 /parent/로 시작하는지 확인해 사용자 유형을 구분한다.",
            "부모 요청은 parentId 소유 조건으로 미션을 조회한다.",
            "자녀 요청은 childId 배정 조건으로 미션을 조회한다.",
            "조건에 맞는 미션이 없으면 HTTP 404를 반환한다.",
            "조회한 미션을 request에 담아 미션 JSP로 전달한다."
        )
        Result = "성공: child-mission.jsp로 forward, 미존재 또는 권한 불일치: HTTP 404"
        Error = "missionId 형식 오류는 별도 처리하지 않아 컨테이너 오류가 될 수 있다."
        Note = "동일한 상세 조회 기능을 부모와 자녀 URL에 함께 제공한다."
    },
    [ordered]@{
        File = "MissionListServlet.java"
        Title = "부모·자녀별 미션 목록 조회"
        Url = "/parent/missions, /child/missions"
        Methods = "GET"
        Session = "요청 경로에 따라 부모 또는 자녀 세션 사용"
        Inputs = "없음"
        Services = "MissionService"
        Flow = @(
            "요청 경로를 검사해 부모 목록인지 자녀 목록인지 구분한다.",
            "부모는 자신이 등록한 활성 미션 목록을 조회한다.",
            "자녀는 자신에게 배정된 활성 미션 목록을 조회한다.",
            "각 목록을 알맞은 화면의 request 속성으로 전달한다."
        )
        Result = "부모: parent-dashboard.jsp, 자녀: child-mission.jsp로 forward"
        Error = "별도 try-catch 없이 조회 예외를 상위로 전달"
        Note = "하나의 서블릿이 사용자 유형에 따라 서로 다른 JSP를 렌더링한다."
    },
    [ordered]@{
        File = "MissionMediaServlet.java"
        Title = "업로드된 미션 인증 미디어 제공"
        Url = "/media/submissions/*"
        Methods = "GET"
        Session = "직접 사용하지 않음"
        Inputs = "URL path-info에 포함된 저장 파일명"
        Services = "MissionMediaStorage"
        Flow = @(
            "현재 요청 URI에서 애플리케이션 context path를 제거해 미디어 URL을 만든다.",
            "MissionMediaStorage.resolveUrl()로 임시 저장소의 실제 파일 경로를 찾는다.",
            "파일이 없거나 잘못된 경로이면 HTTP 404를 반환한다.",
            "파일의 MIME 타입을 탐지해 Content-Type을 설정한다.",
            "브라우저 캐시를 금지하고 파일 바이트를 응답 스트림으로 전송한다."
        )
        Result = "성공: 이미지 또는 영상 바이너리 응답, 실패: HTTP 404"
        Error = "파일 읽기 IOException은 서블릿 컨테이너로 전달"
        Note = "현재 서블릿 자체에는 사용자 소유권 검사가 없어 URL을 아는 사용자의 접근 가능성을 점검할 필요가 있다."
    },
    [ordered]@{
        File = "MissionSubmitServlet.java"
        Title = "자녀 미션 인증 조회 및 파일 제출"
        Url = "/child/mission, /child/missions/submit"
        Methods = "GET, POST"
        Session = "자녀 세션(SessionKeys.CHILD)"
        Inputs = "missionId(선택), mediaType(photo/video), mediaFile"
        Services = "MissionService, MissionMediaStorage"
        Flow = @(
            "GET 요청은 자녀의 미션 목록과 과거 제출 내역을 조회한다.",
            "POST 요청은 multipart/form-data로 사진 또는 영상을 받는다.",
            "파일 종류와 크기를 검사한 뒤 임시 저장소에 UUID 파일명으로 저장한다.",
            "MissionService.submit()으로 제출 레코드와 부모 알림을 DB에 생성한다.",
            "DB 저장이 실패하면 먼저 저장한 실제 파일을 삭제해 불일치를 줄인다."
        )
        Result = "성공: /child/mission?submitted=1로 redirect, 조회/실패: child-mission.jsp"
        Error = "오류 메시지와 목록을 다시 담아 화면으로 forward"
        Note = "파일당 최대 100MB, 요청 전체 최대 120MB이며 JPG/PNG/WEBP와 MP4/WEBM/MOV를 허용한다."
    },
    [ordered]@{
        File = "NotificationListServlet.java"
        Title = "부모·자녀 알림 목록 조회"
        Url = "/parent/notifications, /child/notifications"
        Methods = "GET"
        Session = "요청 경로에 따라 부모 또는 자녀 세션 사용"
        Inputs = "없음"
        Services = "MissionService"
        Flow = @(
            "요청 URL의 /parent/ 또는 /child/ 접두어로 사용자 유형을 판별한다.",
            "부모는 자신의 reward_request 알림 등을 조회한다.",
            "자녀는 보상 지급 알림 등을 조회한다.",
            "조회 결과를 notifications request 속성으로 화면에 전달한다."
        )
        Result = "부모: parent-dashboard.jsp, 자녀: child-home.jsp로 forward"
        Error = "별도 오류 처리 없음"
        Note = "현재는 목록 조회만 구현되어 있으며 읽음 상태 변경 기능은 없다."
    },
    [ordered]@{
        File = "ParentDashboardServlet.java"
        Title = "부모 대시보드 조회"
        Url = "/parent/dashboard"
        Methods = "GET"
        Session = "부모 세션(SessionKeys.PARENT)"
        Inputs = "없음"
        Services = "ChildAccountService, MissionService"
        Flow = @(
            "세션에서 로그인 부모 정보를 가져온다.",
            "부모에게 연결된 자녀 목록과 초대코드를 조회한다.",
            "부모가 등록한 활성 미션 목록을 조회한다.",
            "두 목록을 request에 담아 대시보드 화면을 구성한다."
        )
        Result = "/WEB-INF/views/parent-dashboard.jsp로 forward"
        Error = "별도 try-catch 없이 조회 예외를 상위로 전달"
        Note = "자녀 관리와 미션 등록·조회 기능의 중심 화면을 준비한다."
    },
    [ordered]@{
        File = "ParentJoinServlet.java"
        Title = "부모 회원가입"
        Url = "/join, /parent/join"
        Methods = "GET, POST"
        Session = "사용하지 않음"
        Inputs = "email, name, password, passwordConfirm"
        Services = "ParentService"
        Flow = @(
            "GET 요청은 부모 회원가입 양식을 보여준다.",
            "POST 입력값의 공백을 정리하고 필수값, 이메일 형식, 이름 길이, 비밀번호 길이와 일치 여부를 검사한다.",
            "ParentService.join()에서 비밀번호를 해시해 부모 계정을 저장한다.",
            "이메일 중복 결과를 구분해 사용자에게 안내한다.",
            "성공 시 가입 완료 표시가 포함된 부모 로그인 화면으로 이동한다."
        )
        Result = "성공: /parent/login?joined=1로 redirect, 검증 실패: join.jsp로 forward"
        Error = "입력값과 오류 메시지를 유지하며 DB 예외도 사용자 안내로 변환"
        Note = "비밀번호는 8~72자이며 컨트롤러에서 평문을 받지만 DB에는 해시값이 저장된다."
    },
    [ordered]@{
        File = "ParentLoginServlet.java"
        Title = "부모 이메일·비밀번호 로그인"
        Url = "/parent/login"
        Methods = "GET, POST"
        Session = "로그인 성공 시 부모 세션 생성"
        Inputs = "email, password"
        Services = "ParentService"
        Flow = @(
            "GET 요청에서 이미 부모 로그인 상태면 대시보드로 바로 이동한다.",
            "POST 요청은 이메일과 비밀번호의 필수 입력 여부를 검사한다.",
            "ParentService.login()으로 이메일 조회와 비밀번호 해시 검증을 수행한다.",
            "인증 성공 시 기존 세션을 무효화하고 새 세션을 만든다.",
            "부모 객체를 세션에 저장하고 만료 시간을 30분으로 설정한다."
        )
        Result = "성공: /parent/dashboard로 redirect, 실패: parent-login.jsp로 forward"
        Error = "이메일 입력값을 유지하고 인증 오류 메시지를 표시"
        Note = "기존 세션을 교체해 로그인 전후의 세션 ID가 동일하게 유지되지 않도록 한다."
    },
    [ordered]@{
        File = "ParentLogoutServlet.java"
        Title = "공통 로그아웃"
        Url = "/logout, /parent/logout"
        Methods = "GET, POST"
        Session = "현재 세션 전체"
        Inputs = "없음"
        Services = "없음"
        Flow = @(
            "GET과 POST 모두 동일한 logout() 내부 메서드를 호출한다.",
            "현재 세션이 있으면 invalidate()로 부모 또는 자녀 로그인 정보를 모두 제거한다.",
            "공통 로그인 선택 화면으로 이동한다."
        )
        Result = "/login으로 redirect"
        Error = "별도 오류 처리 없음"
        Note = "클래스명은 ParentLogoutServlet이지만 /logout을 통해 자녀 로그아웃에도 사용된다."
    },
    [ordered]@{
        File = "PetStatusServlet.java"
        Title = "자녀의 활성 펫 상태 조회"
        Url = "/child/pet/status"
        Methods = "GET"
        Session = "자녀 세션(SessionKeys.CHILD)"
        Inputs = "없음"
        Services = "GameProfileService"
        Flow = @(
            "세션에서 로그인 자녀 정보를 가져온다.",
            "자녀 ID로 현재 활성 펫을 조회한다.",
            "펫 이름, 레벨, 경험치 등의 정보를 activePet request 속성으로 전달한다."
        )
        Result = "/WEB-INF/views/child-home.jsp로 forward"
        Error = "별도 오류 처리 없음"
        Note = "ChildHomeServlet과 화면 및 일부 조회 역할이 겹치는 보조 엔드포인트다."
    },
    [ordered]@{
        File = "SubmissionApproveServlet.java"
        Title = "부모의 미션 인증 승인"
        Url = "/parent/submissions/approve"
        Methods = "POST"
        Session = "부모 세션(SessionKeys.PARENT)"
        Inputs = "submissionId, boxGrade"
        Services = "MissionService"
        Flow = @(
            "부모 세션과 submissionId를 사용해 검토 대상의 소유 관계와 pending 상태를 확인한다.",
            "승인 시 선택한 low/middle/high 보상 상자 등급을 제출 내역에 저장한다.",
            "검토가 끝난 인증 미디어 파일을 임시 저장소에서 삭제한다.",
            "자녀가 이후 보상 상자를 한 번 열 수 있도록 approved 상태로 변경한다."
        )
        Result = "성공: /parent/submissions?reviewed=1, 대상 없음: error=not-found"
        Error = "예외 발생 시 /parent/submissions?error=approve로 redirect"
        Note = "SubmissionListServlet의 통합 POST 처리와 기능이 겹치는 개별 승인 엔드포인트다."
    },
    [ordered]@{
        File = "SubmissionListServlet.java"
        Title = "부모의 대기 인증 목록 및 통합 검토"
        Url = "/parent/reviews, /parent/submissions"
        Methods = "GET, POST"
        Session = "부모 세션(SessionKeys.PARENT)"
        Inputs = "POST: submissionId, decision(approved/rejected), boxGrade"
        Services = "MissionService"
        Flow = @(
            "GET 요청은 현재 부모 자녀들의 pending 인증 제출 목록을 조회한다.",
            "승인 화면에서 사용할 보상 상자 등급과 EXP 범위도 함께 조회한다.",
            "POST 요청은 승인 또는 거절 결정과 선택 상자 등급을 받는다.",
            "MissionService.review()에서 부모 소유권, pending 상태, 결정값과 상자 등급을 검증한다.",
            "검토 완료 후 결과 쿼리 파라미터와 함께 목록 화면으로 돌아간다."
        )
        Result = "GET: parent-reviews.jsp, POST 성공: /parent/reviews?reviewed=1"
        Error = "대상 없음은 error=not-found, 잘못된 입력 또는 처리 실패는 error=invalid"
        Note = "현재 화면이 실제로 사용하는 대표 검토 엔드포인트이며 승인과 거절을 모두 처리한다."
    },
    [ordered]@{
        File = "SubmissionRejectServlet.java"
        Title = "부모의 미션 인증 거절"
        Url = "/parent/submissions/reject"
        Methods = "POST"
        Session = "부모 세션(SessionKeys.PARENT)"
        Inputs = "submissionId"
        Services = "MissionService"
        Flow = @(
            "부모 세션과 submissionId로 검토 대상 제출을 찾는다.",
            "해당 부모 자녀의 pending 제출인지 확인한다.",
            "상태를 rejected로 변경하고 보상 상자 등급은 비운다.",
            "검토 완료된 인증 미디어 파일을 임시 저장소에서 삭제한다."
        )
        Result = "성공: /parent/submissions?reviewed=1, 대상 없음: error=not-found"
        Error = "예외 발생 시 /parent/submissions?error=reject로 redirect"
        Note = "SubmissionListServlet의 통합 POST 처리와 기능이 겹치는 개별 거절 엔드포인트다."
    }
)

function Encode-Html {
    param([AllowEmptyString()] [string] $Text)
    return [System.Net.WebUtility]::HtmlEncode($Text)
}

$htmlPath = Join-Path $outputDirectory "Controller_Servlet_21개_설명서.html"
$html = New-Object System.Text.StringBuilder

[void] $html.AppendLine('<!doctype html>')
[void] $html.AppendLine('<html lang="ko"><head><meta charset="utf-8">')
[void] $html.AppendLine('<style>')
[void] $html.AppendLine('@page { size: A4; margin: 17mm 18mm; }')
[void] $html.AppendLine('body { font-family: "Malgun Gothic", sans-serif; color: #253247; font-size: 10pt; line-height: 1.55; }')
[void] $html.AppendLine('h1 { color: #315b8a; font-size: 25pt; text-align: center; margin: 70mm 0 4mm; }')
[void] $html.AppendLine('.subtitle { text-align: center; color: #55718f; font-size: 13pt; font-weight: bold; }')
[void] $html.AppendLine('.date { text-align: center; color: #777; margin-top: 3mm; }')
[void] $html.AppendLine('h2 { color: #315b8a; font-size: 17pt; border-bottom: 2px solid #8fb5d8; padding-bottom: 2mm; }')
[void] $html.AppendLine('h3 { color: #55718f; font-size: 12pt; margin: 1mm 0 4mm; }')
[void] $html.AppendLine('h4 { color: #315b8a; font-size: 10.5pt; margin: 4mm 0 1mm; }')
[void] $html.AppendLine('.page { page-break-before: always; }')
[void] $html.AppendLine('.meta { width: 100%; border-collapse: collapse; margin: 4mm 0 5mm; }')
[void] $html.AppendLine('.meta th, .meta td { border: 1px solid #c9d6e2; padding: 2.2mm; vertical-align: top; }')
[void] $html.AppendLine('.meta th { width: 27mm; background: #edf4fa; color: #315b8a; text-align: left; }')
[void] $html.AppendLine('.summary { width: 100%; border-collapse: collapse; font-size: 8.5pt; }')
[void] $html.AppendLine('.summary th, .summary td { border: 1px solid #bfcbd7; padding: 1.5mm; }')
[void] $html.AppendLine('.summary th { background: #d9e8f5; color: #274d73; }')
[void] $html.AppendLine('ul { margin-top: 1mm; padding-left: 6mm; } li { margin-bottom: 1.5mm; }')
[void] $html.AppendLine('.note { background: #f4f8fb; border-left: 4px solid #6f9ec7; padding: 3mm; }')
[void] $html.AppendLine('code { font-family: Consolas, monospace; font-size: 9pt; color: #1f4e79; }')
[void] $html.AppendLine('</style></head><body>')

[void] $html.AppendLine('<h1>Controller Servlet 21개 설명서</h1>')
[void] $html.AppendLine('<div class="subtitle">Back 프로젝트 · com.genai.controller</div>')
[void] $html.AppendLine('<div class="date">작성 기준: 2026년 6월 9일 현재 소스 코드</div>')

[void] $html.AppendLine('<section class="page"><h2>문서 개요</h2>')
[void] $html.AppendLine('<p>이 문서는 <code>src/main/java/com/genai/controller</code> 폴더의 Servlet 21개를 실제 코드 기준으로 설명한다. 각 Servlet의 URL 매핑, HTTP 메서드, 세션, 입력값, 서비스 호출, 처리 흐름, 결과 화면과 오류 처리를 빠르게 확인할 수 있도록 구성했다.</p>')
[void] $html.AppendLine('<h3>전체 구성 요약</h3><ul>')
foreach ($line in @(
    "인증 및 계정: LoginServlet, ParentJoinServlet, ParentLoginServlet, ParentLogoutServlet, ChildInviteLoginServlet",
    "부모와 자녀 연결: ChildInviteCreateServlet, InviteRegenerateServlet",
    "자녀 프로필과 펫: ChildSetupServlet, ChildHomeServlet, PetStatusServlet",
    "미션: MissionCreateServlet, MissionListServlet, MissionDetailServlet, MissionSubmitServlet, MissionMediaServlet",
    "검토와 보상: SubmissionListServlet, SubmissionApproveServlet, SubmissionRejectServlet, BoxOpenServlet",
    "화면 집계: ParentDashboardServlet, NotificationListServlet"
)) {
    [void] $html.AppendLine("<li>$(Encode-Html $line)</li>")
}
[void] $html.AppendLine('</ul></section>')

[void] $html.AppendLine('<section class="page"><h2>Servlet URL 빠른 목록</h2>')
[void] $html.AppendLine('<table class="summary"><thead><tr><th>번호</th><th>파일명</th><th>HTTP</th><th>URL 매핑</th></tr></thead><tbody>')
for ($index = 0; $index -lt $servlets.Count; $index++) {
    $item = $servlets[$index]
    [void] $html.AppendLine("<tr><td>$($index + 1)</td><td>$(Encode-Html $item.File)</td><td>$(Encode-Html $item.Methods)</td><td>$(Encode-Html $item.Url)</td></tr>")
}
[void] $html.AppendLine('</tbody></table></section>')

for ($index = 0; $index -lt $servlets.Count; $index++) {
    $item = $servlets[$index]
    [void] $html.AppendLine("<section class=`"page`"><h2>$($index + 1). $(Encode-Html $item.File)</h2>")
    [void] $html.AppendLine("<h3>$(Encode-Html $item.Title)</h3>")
    [void] $html.AppendLine('<table class="meta">')
    foreach ($pair in @(
        @("URL 매핑", $item.Url),
        @("HTTP 메서드", $item.Methods),
        @("사용 세션", $item.Session),
        @("주요 입력값", $item.Inputs),
        @("호출 서비스", $item.Services)
    )) {
        [void] $html.AppendLine("<tr><th>$(Encode-Html $pair[0])</th><td>$(Encode-Html $pair[1])</td></tr>")
    }
    [void] $html.AppendLine('</table><h4>처리 흐름</h4><ul>')
    foreach ($flow in $item.Flow) {
        [void] $html.AppendLine("<li>$(Encode-Html $flow)</li>")
    }
    [void] $html.AppendLine('</ul>')
    [void] $html.AppendLine("<h4>처리 결과</h4><p>$(Encode-Html $item.Result)</p>")
    [void] $html.AppendLine("<h4>오류 처리</h4><p>$(Encode-Html $item.Error)</p>")
    [void] $html.AppendLine("<h4>코드 이해 포인트</h4><p class=`"note`">$(Encode-Html $item.Note)</p></section>")
}

[void] $html.AppendLine('<section class="page"><h2>전체 요청 흐름</h2><ul>')
foreach ($line in @(
    "부모: 회원가입 → 로그인 → 자녀 초대코드 생성 → 미션 등록 → 제출 인증 검토 및 승인/거절",
    "자녀: 초대코드 로그인 → 초기 프로필과 펫 설정 → 미션 확인 → 사진/영상 제출 → 승인된 상자 개봉",
    "시스템: 제출 시 부모 알림 생성 → 검토 후 파일 삭제 → 상자 개봉 시 EXP·보상 이력·자녀 알림 생성"
)) {
    [void] $html.AppendLine("<li>$(Encode-Html $line)</li>")
}
[void] $html.AppendLine('</ul><h2>구조상 확인할 점</h2><ul>')
foreach ($line in @(
    "SubmissionListServlet이 승인과 거절을 모두 처리하므로 개별 Approve/Reject Servlet과 역할이 중복된다.",
    "NotificationListServlet은 알림 조회만 지원하고 읽음 처리 기능은 아직 없다.",
    "MissionMediaServlet은 파일 제공 전 사용자 권한을 직접 검사하지 않는다.",
    "일부 JSP로 forward할 때 해당 JSP가 기대하는 다른 request 속성이 함께 준비되지 않을 수 있어 화면별 통합 점검이 필요하다.",
    "컨트롤러의 한글 오류 문자열 일부는 현재 소스 인코딩이 깨져 있어 별도 수정이 필요하다."
)) {
    [void] $html.AppendLine("<li>$(Encode-Html $line)</li>")
}
[void] $html.AppendLine('</ul></section></body></html>')

$utf8WithBom = New-Object System.Text.UTF8Encoding($true)
[System.IO.File]::WriteAllText($htmlPath, $html.ToString(), $utf8WithBom)

$edgeCandidates = @(
    "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
)
$edgePath = $edgeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if ($null -eq $edgePath) {
    throw "Microsoft Edge 실행 파일을 찾을 수 없습니다."
}

$profileDirectory = Join-Path $projectRoot "target\edge-pdf-profile"
New-Item -ItemType Directory -Path $profileDirectory -Force | Out-Null
$htmlUri = ([System.Uri] $htmlPath).AbsoluteUri

if (Test-Path $pdfPath) {
    Remove-Item -LiteralPath $pdfPath -Force
}

$edgeArguments = @(
    "--headless",
    "--disable-gpu",
    "--no-pdf-header-footer",
    "--run-all-compositor-stages-before-draw",
    "--user-data-dir=$profileDirectory",
    "--print-to-pdf=$pdfPath",
    $htmlUri
)
$edgeProcess = Start-Process -FilePath $edgePath -ArgumentList $edgeArguments -Wait -PassThru

if (-not (Test-Path $pdfPath) -or (Get-Item $pdfPath).Length -lt 10000) {
    throw "Edge PDF 생성에 실패했습니다."
}

Remove-Item -LiteralPath $htmlPath -Force
Write-Output $pdfPath
