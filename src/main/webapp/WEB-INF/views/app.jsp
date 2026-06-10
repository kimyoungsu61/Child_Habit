<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
  <!DOCTYPE html>
  <html lang="ko">

  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AI 펫 리워드 MVP</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/style.css?v=reward-chest-20260610" />
  </head>

  <body>
    <main class="app" id="appRoot">
      <section class="entry-screen" id="entryScreen">
        <article class="entry-card entry-panel active card" id="entryStartCard">
          <div class="entry-hero">
            <span class="entry-kicker">서비스 시작</span>
            <h1>좋은 습관을 몽글이와 함께 만들어요</h1>
            <p>부모는 미션을 주고 승인하며, 아이는 인증하고 보상을 받아요.</p>
            <div class="entry-choice-row">
              <button class="btn mint" type="button" data-entry-target="parentLoginCard">부모로 시작하기</button>
              <button class="btn primary" type="button" data-entry-target="childEntryCard">아이로 시작하기</button>
            </div>
          </div>
        </article>

        <article class="entry-card entry-panel card" id="childEntryCard">
          <h2>아이 초대코드 입장</h2>
          <label class="entry-field" for="childInviteInput">
            <span>초대코드 입력</span>
            <input id="childInviteInput" type="text" placeholder="ABC123" autocomplete="off" />
          </label>
          <button class="btn primary full" id="childStartBtn">아이 화면 시작</button>
          <p class="entry-message" id="inviteMessage"></p>
          <button class="btn ghost full" type="button" data-entry-target="entryStartCard">처음으로</button>
        </article>

        <article class="entry-card entry-panel card" id="parentLoginCard">
          <h2>보호자 로그인</h2>
          <label class="entry-field" for="parentEmail">
            <span>이메일</span>
            <input id="parentEmail" type="email" placeholder="parent@test.com" autocomplete="username" />
          </label>
          <label class="entry-field" for="parentPassword">
            <span>비밀번호</span>
            <input id="parentPassword" type="password" autocomplete="current-password" />
          </label>
          <button class="btn mint full" id="parentLoginBtn">보호자 로그인</button>
          <button class="btn ghost full" id="showParentJoinBtn" type="button" data-entry-target="parentJoinCard">보호자
            회원가입</button>
          <button class="btn ghost full" type="button" data-entry-target="entryStartCard">처음으로</button>
        </article>

        <article class="entry-card entry-panel card join-card" id="parentJoinCard">
          <h2>보호자 회원가입</h2>
          <label class="entry-field" for="joinParentName">
            <span>보호자 이름</span>
            <input id="joinParentName" type="text" placeholder="김보호자" autocomplete="off" />
          </label>
          <label class="entry-field" for="joinParentEmail">
            <span>이메일</span>
            <input id="joinParentEmail" type="email" placeholder="parent@test.com" autocomplete="off" />
          </label>
          <label class="entry-field" for="joinParentPassword">
            <span>비밀번호</span>
            <input id="joinParentPassword" type="password" placeholder="비밀번호 입력" autocomplete="new-password" />
          </label>
          <label class="entry-field" for="joinParentPasswordCheck">
            <span>비밀번호 확인</span>
            <input id="joinParentPasswordCheck" type="password" placeholder="비밀번호 재입력" autocomplete="new-password" />
          </label>
          <button class="btn primary full" id="parentJoinBtn" type="button">가입 완료</button>
          <p class="entry-message" id="joinMessage"></p>
          <button class="btn ghost full" type="button" data-entry-target="parentLoginCard">로그인으로</button>
        </article>
      </section>

      <header class="topbar">
        <button class="profile-open" id="profileOpenBtn" type="button" aria-label="아이 프로필 보기">
          <span class="profile-avatar profile-photo"></span>
        </button>
        <div class="topbar-copy">
          <h1 id="pageTitle">오늘도 몽글이와 함께해요</h1>
          <p id="pageSubtitle">좋은 습관을 만들면 함께 성장해요</p>
        </div>
        <button class="exit-btn" id="backToEntryBtn" type="button">나가기</button>
      </header>

      <section class="screen" id="childProfileScreen" data-title="닉네임 설정" data-subtitle="친구들이 볼 이름을 정해주세요.">
        <article class="card panel profile-setup-card">
          <h2>닉네임 설정</h2>
          <p>친구들이 볼 이름을 정해주세요.</p>
          <label class="entry-field" for="childNicknameInput">
            <span>닉네임 입력</span>
            <input id="childNicknameInput" type="text" placeholder="닉네임 입력" maxlength="10" autocomplete="off" />
          </label>
          <div class="pet-select-card">
            <div class="dex-thumb"><img class="dex-image"
                src="${pageContext.request.contextPath}/assets/pets/mongle/idle/frame_0001.webp" alt="몽글이" /></div>
            <div>
              <strong>몽글이</strong>
              <p>좋은 습관을 함께 키우는 기본 펫</p>
            </div>
          </div>
          <button class="btn primary full" id="completeChildProfileBtn" type="button">완료</button>
        </article>
      </section>

      <section class="screen active" id="homeScreen" data-title="오늘도 몽글이와 함께해요" data-subtitle="좋은 습관을 만들면 함께 성장해요">
        <article class="card pet-room state-normal" id="petCard">
          <div class="effect-layer" id="effectLayer"></div>
          <div class="pet-summary">
            <div>
              <h2>오늘의 대표 펫</h2>
              <p id="petMeta">몽글이 · Lv.1</p>
            </div>
            <span class="state-chip" id="stateChip">기본</span>
          </div>

          <div class="pet-stage">
            <span class="twinkle one"></span>
            <span class="twinkle two"></span>
            <span class="twinkle three"></span>
            <div class="pet-frame-wrap">
              <img class="pet-frame" id="petFrame"
                src="${pageContext.request.contextPath}/assets/pets/mongle/idle/frame_0001.webp" alt="몽글이" />
            </div>
          </div>

          <div class="exp-row">
            <span id="expText">EXP 240 / 300</span>
            <span id="expPercent">80%</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" id="expFill"></div>
          </div>
          <div class="speech" id="petSpeech">"오늘은 어떤 좋은 습관을 만들어볼까?"</div>

          <div class="pet-actions">
            <button class="btn" data-action="touch">🤍 쓰담쓰담</button>
            <button class="btn" data-action="praise">⭐ 잘했어!</button>
            <button class="btn" data-action="play">🎈 같이 놀자</button>
            <button class="btn" data-action="magic">🌟 마법 뿅!</button>
          </div>
        </article>
      </section>

      <section class="screen" id="certifyScreen" data-title="습관 인증 미션" data-subtitle="영상이나 사진으로 오늘의 좋은 습관을 남겨요">
        <article class="card panel">
          <h2>습관 인증 미션</h2>
          <p>오늘 실천한 좋은 습관을 영상이나 사진으로 남기고 확인을 기다려요.</p>
          <div class="verify-mode-tabs" aria-label="인증 방식 선택">
            <button class="mode-btn active" type="button" data-verify-mode="video"><span
                class="mode-icon">🎥</span><span>영상</span></button>
            <button class="mode-btn" type="button" data-verify-mode="photo"><span
                class="mode-icon">📷</span><span>사진</span></button>
          </div>
          <div class="camera-box" id="cameraBox">
            <span class="rec-pill"><span class="rec-dot"></span><span id="recText">REC 00:00</span></span>
            <span id="previewText">카메라 미리보기</span>
          </div>
          <div class="action-row">
            <button class="btn" id="recordBtn">녹화 시작</button>
            <button class="btn mint" id="submitBtn">인증 제출</button>
          </div>
        </article>
      </section>

      <section class="screen" id="rewardScreen" data-title="보상 상자" data-subtitle="확인 완료 후 몽글이의 성장을 도와요">
        <article class="card panel reward-card">
          <h2>보상 상자</h2>
          <p id="rewardMessage">인증이 확인되면 상자를 고를 수 있어요.</p>
          <div class="info-row"><span>확인 상태</span><span class="status-badge" id="rewardBadge">대기</span></div>
          <div class="reward-grid">
            <button class="box-option" data-box="beginner"><b>기본 상자 <em id="beginnerBoxCount">[0]</em></b><span>10~30
                EXP</span></button>
            <button class="box-option" data-box="middle"><b>중간 상자 <em id="middleBoxCount">[0]</em></b><span>30~70
                EXP</span></button>
            <button class="box-option" data-box="premium"><b>특별 상자 <em id="premiumBoxCount">[0]</em></b><span>70~150
                EXP</span></button>
            <button class="box-option" data-box="surprise"><b>깜짝 상자 <em id="surpriseBoxCount">[0]</em></b><span>랜덤
                응원</span></button>
          </div>
        </article>
      </section>

      <section class="screen" id="petScreen" data-title="펫 도감" data-subtitle="보유한 펫과 뱃지 상태를 확인해요">
        <article class="card panel dex-panel">
          <h2>펫 도감</h2>
          <p>현재 보유 중인 펫과 대표 펫 상태를 확인해요.</p>
          <div class="dex-filters">
            <button class="filter-btn active" data-filter="all">전체</button>
            <button class="filter-btn" data-filter="owned">보유</button>
            <button class="filter-btn" data-filter="badge">뱃지</button>
          </div>
          <div class="dex-list" id="petDexList"></div>
        </article>
      </section>

      <section class="screen" id="recordScreen" data-title="성장 기록" data-subtitle="인증과 보상 내역을 한눈에 확인해요">
        <article class="card panel">
          <h2>성장 기록</h2>
          <p>아이의 인증 제출, 보호자 확인, 보상 획득 내역을 시간순으로 보여줘요.</p>
          <div class="history-list" id="childHistoryList"></div>
        </article>
      </section>

      <section class="screen" id="myScreen" data-title="아이 프로필" data-subtitle="닉네임, 대표 펫, 레벨과 뱃지를 확인해요">
        <article class="card panel profile-full-card">
          <div class="profile-full-head">
            <span class="profile-avatar profile-photo large"></span>
            <div>
              <h2 id="myNickname">토리</h2>
              <p id="myPetSummary">몽글이 · Lv.4</p>
            </div>
          </div>
          <div class="profile-detail">
            <div><span>대표 펫</span><strong>몽글이</strong></div>
            <div><span>경험치</span><strong id="myExpText">EXP 240 / 300</strong></div>
            <div><span>오늘 인증 상태</span><strong id="myMissionStatus">대기 전</strong></div>
            <div><span>획득 뱃지</span><strong id="myBadgeText">첫 습관 뱃지 준비 중</strong></div>
          </div>
        </article>
      </section>

      <section class="screen parent-screen" id="parentScreen" data-title="보호자 홈"
        data-subtitle="아이 연결, 인증 대기, 보상 상태를 요약해요">
        <article class="card panel parent-summary-card">
          <h2>보호자 대시보드</h2>
          <p>연결된 아이와 오늘 인증 상태를 빠르게 확인해요.</p>
          <div class="summary-grid">
            <div><span>연결 아이</span><strong id="parentChildCount">0명</strong></div>
            <div><span>인증 상태</span><strong id="parentMissionSummary">바보</strong></div>
            <div><span>보유 상자</span><strong id="parentBoxSummary">0개</strong></div>
          </div>
        </article>
        <article class="card panel parent-quick-card">
          <h2>빠른 이동</h2>
          <div class="quick-grid">
            <button class="btn primary" type="button" data-quick-tab="parentInviteScreen">초대코드 생성</button>
            <button class="btn mint has-count-badge" type="button" data-quick-tab="parentSubmissionsScreen">
              인증 검토
              <span class="count-badge" data-count-badge hidden>0</span>
            </button>
            <button class="btn" type="button" data-quick-tab="parentChildScreen">아이 관리</button>
            <button class="btn" type="button" data-quick-tab="parentMissionsScreen">미션 목록</button>
            <button class="btn" type="button" data-quick-tab="parentChildProgressScreen">진행 현황</button>
            <button class="btn" type="button" data-quick-tab="parentNotificationsScreen">부모 알림</button>
          </div>
        </article>
      </section>

      <section class="screen parent-screen" id="parentInviteScreen" data-title="아이 초대"
        data-subtitle="초대코드로 아이를 연결해요">
        <article class="card panel invite-card">
          <h2>아이 초대코드</h2>
          <p>아이 화면에서 초대코드를 입력하면 보호자와 연결돼요.</p>
          <div class="invite-code-box">
            <span>현재 초대코드</span>
            <strong id="inviteCodeText">ABC123</strong>
          </div>
          <button class="btn primary full" id="generateInviteBtn" type="button">초대코드 생성</button>
        </article>
      </section>

      <section class="screen parent-screen" id="parentChildScreen" data-title="아이 관리"
        data-subtitle="연결된 아이와 현재 성장 상태를 확인해요">
        <article class="card panel">
          <h2>연결된 아이</h2>
          <div class="child-card-list" id="parentChildList"></div>
        </article>
      </section>

      <section class="screen parent-screen" id="parentHistoryScreen" data-title="인증/보상 기록"
        data-subtitle="승인, 거절, 보상 지급 내역을 확인해요">
        <article class="card panel">
          <h2>최근 처리 내역</h2>
          <div class="history-list" id="parentHistoryList"></div>
        </article>
      </section>

      <section class="screen parent-screen" id="parentMissionsScreen" data-title="미션 목록"
        data-subtitle="하급, 중급, 상급 미션을 관리해요">
        <article class="card panel flow-panel">
          <div class="panel-head">
            <h2>미션 목록</h2>
            <button class="btn compact primary" type="button" data-quick-tab="parentMissionNewScreen">등록</button>
          </div>
          <div class="mission-grade-list">
            <button class="mission-grade-card low" type="button" data-quick-tab="parentMissionEditScreen">
              <strong>하급 · 양치하기</strong>
              <span>영상 인증 · 하급 상자</span>
            </button>
            <button class="mission-grade-card middle" type="button" data-quick-tab="parentMissionEditScreen">
              <strong>중급 · 책 읽기 10분</strong>
              <span>사진 인증 · 중급 상자</span>
            </button>
            <button class="mission-grade-card high" type="button" data-quick-tab="parentMissionEditScreen">
              <strong>상급 · 방 정리하기</strong>
              <span>영상 인증 · 상급 상자</span>
            </button>
          </div>
        </article>
      </section>

      <section class="screen parent-screen" id="parentMissionNewScreen" data-title="미션 등록"
        data-subtitle="새 미션을 만들고 아이에게 배정해요">
        <article class="card panel form-panel">
          <h2>미션 등록</h2>
          <label class="entry-field"><span>제목</span><input id="newMissionTitle" type="text" value="양치하기" /></label>
          <label class="entry-field"><span>설명</span><input id="newMissionDescription" type="text"
              value="양치한 모습을 짧은 영상으로 제출하기" /></label>
          <label class="entry-field"><span>인증 방식</span><select id="newMissionMediaType">
              <option value="video">영상</option>
              <option value="photo">사진</option>
            </select></label>
          <label class="entry-field"><span>등급</span><select id="newMissionGrade">
              <option value="low">하급</option>
              <option value="middle">중급</option>
              <option value="high">상급</option>
            </select></label>
          <label class="entry-field"><span>배정 아이</span><select id="newMissionChild"></select></label>
          <button class="btn primary full" id="saveMissionBtn" type="button">저장</button>
          <p class="entry-message" id="missionCreateMessage"></p>
        </article>
      </section>

      <section class="screen parent-screen" id="parentMissionEditScreen" data-title="미션 수정"
        data-subtitle="미션 내용과 보상을 수정해요">
        <article class="card panel form-panel">
          <h2>미션 수정</h2>
          <label class="entry-field"><span>제목</span><input type="text" value="책 읽기 10분" /></label>
          <label class="entry-field"><span>인증 방식</span><select>
              <option>사진</option>
              <option>영상</option>
            </select></label>
          <label class="entry-field"><span>보상</span><select>
              <option>중급 상자</option>
              <option>하급 상자</option>
              <option>상급 상자</option>
            </select></label>
          <button class="btn primary full" type="button" data-quick-tab="parentMissionsScreen">수정 완료</button>
        </article>
      </section>

      <section class="screen parent-screen" id="parentMissionGradesScreen" data-title="미션 등급 설정"
        data-subtitle="등급별 보상 상자를 연결해요">
        <article class="card panel flow-panel">
          <h2>등급 설정</h2>
          <div class="reward-rule low"><strong>하급</strong><span>하급 상자 · 10~30 EXP</span></div>
          <div class="reward-rule middle"><strong>중급</strong><span>중급 상자 · 30~70 EXP</span></div>
          <div class="reward-rule high"><strong>상급</strong><span>상급 상자 · 70~150 EXP</span></div>
        </article>
      </section>

      <section class="screen parent-screen" id="parentMissionAssignScreen" data-title="아이별 미션 배정"
        data-subtitle="아이와 미션을 선택해 배정해요">
        <article class="card panel form-panel">
          <h2>미션 배정</h2>
          <label class="entry-field"><span>아이</span><select>
              <option>유리</option>
              <option>민준</option>
            </select></label>
          <label class="entry-field"><span>미션</span><select>
              <option>양치하기</option>
              <option>책 읽기 10분</option>
              <option>방 정리하기</option>
            </select></label>
          <button class="btn primary full" type="button" data-quick-tab="parentChildProgressScreen">배정 완료</button>
        </article>
      </section>

      <section class="screen parent-screen" id="parentChildProgressScreen" data-title="아이 미션 진행 현황"
        data-subtitle="오늘의 미션 상태를 확인해요">
        <article class="card panel flow-panel">
          <h2>오늘 진행 현황</h2>
          <div class="progress-list">
            <div><strong>유리</strong><span class="status-badge waiting">하급 완료 · 중급 진행 가능</span></div>
            <div><strong>민준</strong><span class="status-badge">하급 진행 중</span></div>
            <div><strong>서아</strong><span class="status-badge approved">오늘 3개 완료</span></div>
          </div>
        </article>
      </section>

      <section class="screen parent-screen" id="parentSubmissionsScreen" data-title="제출 인증 목록 / 승인 대기"
        data-subtitle="사진/영상 pending 제출물을 검토해요">
        <article class="card panel flow-panel">
          <h2>승인 대기 제출물</h2>
          <div class="mission-grade-list" id="parentSubmissionList"></div>
        </article>
      </section>

      <section class="screen parent-screen" id="parentSubmissionDetailScreen" data-title="제출 인증 상세"
        data-subtitle="사진/영상 제출물을 승인하거나 거절해요">
        <article class="card panel review-card">
          <h2>제출 상세</h2>
          <div class="review-preview" id="parentSubmissionPreview">영상/이미지 placeholder</div>
          <div class="info-row"><span>아이</span><span id="parentSubmissionChild">유리</span></div>
          <div class="info-row"><span>인증 유형</span><span id="parentSubmissionMediaType">영상 인증</span></div>
          <div class="info-row"><span>미션 등급</span><span id="parentSubmissionGrade">하급</span></div>
          <div class="action-row">
            <button class="btn mint" type="button" data-mock-approve>승인</button>
            <button class="btn" type="button" data-mock-reject>거절</button>
          </div>
          <p class="entry-message" id="parentSubmissionMessage"></p>
        </article>
      </section>

      <section class="screen parent-screen" id="parentNotificationsScreen" data-title="부모 알림"
        data-subtitle="미션 제출과 보상 지급 알림을 확인해요">
        <article class="card panel flow-panel">
          <div class="notice-panel-head">
            <h2>부모 알림</h2>
            <button class="notice-read-all-btn" type="button" data-mark-all-notifications="parent" disabled>전체 읽음</button>
          </div>
          <div class="notice-card">유리가 양치하기 영상을 제출했어요.</div>
          <div class="notice-card">민준에게 중급 미션이 배정됐어요.</div>
          <div class="notice-card">유리에게 하급 상자 지급이 완료됐어요.</div>
        </article>
      </section>

      <section class="screen" id="childTodayMissionsScreen" data-title="오늘의 미션" data-subtitle="단계별 미션을 차례로 완료해요">
        <article class="card panel flow-panel">
          <h2>오늘의 미션 진행</h2>
          <div class="mission-grade-list">
            <button class="mission-grade-card low" type="button" data-quick-tab="childMissionLowScreen">
              <strong>하급 미션</strong><span>양치하기 · 진행 가능</span>
            </button>
            <button class="mission-grade-card middle" type="button" data-quick-tab="childMissionMiddleScreen">
              <strong>중급 미션</strong><span>책 읽기 10분 · 하급 완료 후 잠금 해제</span>
            </button>
            <button class="mission-grade-card high" type="button" data-quick-tab="childMissionHighScreen">
              <strong>상급 미션</strong><span>방 정리하기 · 하루 최대 3개</span>
            </button>
          </div>
          <p class="flow-note">하루 최대 완료 미션은 총 5개입니다.</p>
        </article>
      </section>

      <section class="screen" id="childMissionLowScreen" data-title="하급 미션 상세" data-subtitle="하급 상자를 받을 수 있어요">
        <article class="card panel flow-panel">
          <h2>양치하기</h2>
          <p>양치한 모습을 짧은 영상으로 촬영해서 제출해요.</p>
          <div class="reward-rule low"><strong>보상</strong><span>하급 상자</span></div>
          <button class="btn primary full" type="button" data-quick-tab="childCameraScreen">촬영하기</button>
        </article>
      </section>

      <section class="screen" id="childMissionMiddleScreen" data-title="중급 미션 상세" data-subtitle="중급 상자를 받을 수 있어요">
        <article class="card panel flow-panel">
          <h2>책 읽기 10분</h2>
          <p>읽은 책 표지나 독서하는 모습을 사진으로 제출해요.</p>
          <div class="reward-rule middle"><strong>보상</strong><span>중급 상자</span></div>
          <button class="btn primary full" type="button" data-quick-tab="childCameraScreen">촬영하기</button>
        </article>
      </section>

      <section class="screen" id="childMissionHighScreen" data-title="상급 미션 상세" data-subtitle="상급 상자를 받을 수 있어요">
        <article class="card panel flow-panel">
          <h2>방 정리하기</h2>
          <p>정리 전후가 보이도록 영상을 촬영해서 제출해요.</p>
          <div class="reward-rule high"><strong>보상</strong><span>상급 상자</span></div>
          <button class="btn primary full" type="button" data-quick-tab="childCameraScreen">촬영하기</button>
        </article>
      </section>

      <section class="screen" id="childCameraScreen" data-title="습관 인증 미션" data-subtitle="영상이나 사진으로 오늘의 좋은 습관을 남겨요">
        <article class="card panel capture-panel">
          <div class="capture-head">
            <span class="capture-kicker">오늘의 인증</span>
            <h2>습관 인증 미션</h2>
            <p>오늘의 좋은 습관을 찍어서 몽글이에게 보여줘요.</p>
          </div>

          <div class="mission-mini-card">
            <div>
              <span>오늘의 미션</span>
              <strong>좋은 습관 인증</strong>
            </div>
            <em>보호자 확인 후 보상</em>
          </div>

          <div class="verify-mode-tabs capture-tabs" aria-label="촬영 방식 선택">
            <button class="mode-btn active" type="button" data-capture-mode="video"><span
                class="mode-icon">🎥</span><span>영상</span></button>
            <button class="mode-btn" type="button" data-capture-mode="photo"><span
                class="mode-icon">📷</span><span>사진</span></button>
          </div>

          <div class="capture-stage" id="childCaptureStage">
            <video id="photoCameraPreview" autoplay playsinline muted hidden></video>
            <video id="videoCameraPreview" autoplay playsinline muted hidden></video>
            <canvas id="photoCaptureCanvas" hidden></canvas>
            <img id="photoCapturePreview" class="capture-preview-media" alt="" src="" hidden
              style="display: none !important;" />
            <div class="capture-placeholder" id="capturePlaceholder">🎥
              아직 녹화 전이에요
              아래 버튼을 눌러 시작해요</div>
          </div>

          <p class="entry-message capture-message" id="cameraPermissionMessage"></p>

          <div class="capture-action-stack">
            <div class="capture-action-row photo-actions" id="photoCaptureActions" hidden>
              <button class="btn primary" type="button" id="takePhotoBtn">사진 찍기</button>
              <button class="btn" type="button" id="retakePhotoBtn">다시 찍기</button>
            </div>
            <div class="capture-action-row video-actions" id="videoCaptureActions">
              <button class="btn primary" type="button" id="startMockVideoBtn">녹화 시작</button>
              <button class="btn" type="button" id="stopMockVideoBtn" hidden>녹화 종료</button>
            </div>
            <button class="btn mint full capture-submit" type="button" id="submitCaptureBtn" disabled>인증 제출</button>
          </div>
        </article>
      </section>

      <section class="screen" id="childSubmissionWaitingScreen" data-title="제출 완료 / 승인 대기"
        data-subtitle="부모 승인 대기 상태입니다">
        <article class="card panel flow-panel">
          <h2>제출 완료</h2>
          <div class="status-badge waiting">승인 대기</div>
          <p id="submissionWaitingMessage">사진 인증이 제출되었습니다. 보호자 승인 대기 중입니다.</p>
          <button class="btn primary full" type="button" id="checkSubmissionResultBtn">승인 결과 보기</button>
        </article>
      </section>

      <section class="screen" id="childMissionResultScreen" data-title="미션 승인 결과" data-subtitle="보호자의 확인 결과를 보여줘요">
        <article class="card panel flow-panel">
          <h2 id="missionResultTitle">확인 결과</h2>
          <div class="status-badge waiting" id="missionResultBadge">확인 중</div>
          <p id="missionResultMessage">보호자의 확인 결과를 불러오고 있어요.</p>
          <button class="btn primary full" type="button" id="missionResultActionBtn">확인</button>
        </article>
      </section>

      <section class="screen" id="childRewardBoxScreen" data-title="상자 획득" data-subtitle="미션 등급에 맞는 상자를 획득해요">
        <article class="card panel reward-card">
          <h2 id="rewardBoxTitle">보상 상자 획득</h2>
          <div class="reward-box-visual" id="rewardBoxVisual">BOX</div>
          <p id="rewardBoxMessage">승인된 미션의 보상 상자입니다.</p>
          <button class="btn primary full" type="button" id="claimRewardBoxBtn">상자 개봉</button>
        </article>
      </section>

      <section class="screen" id="childRewardOpenScreen" data-title="상자 개봉" data-subtitle="보상 내용을 확인해요">
        <article class="card panel reward-card box-open-panel">
          <div class="panel-head compact-head">
            <div>
              <h2 id="boxOpenTitle">하급 상자 개봉</h2>
              <p id="boxOpenGuide">상자를 눌러 개봉 연출을 확인해요.</p>
            </div>
            <span class="state-chip" id="boxOpenGradeChip">하급</span>
          </div>
          <div class="box-video-stage" id="boxVideoStage">
            <video id="boxOpeningVideo" class="box-opening-video" muted playsinline preload="metadata" hidden></video>
            <div class="box-video-placeholder" id="boxVideoPlaceholder">
              <span class="box-video-icon" id="boxVideoIcon">BOX</span>
              <strong>보상 상자</strong>
              <em>상자를 열어 경험치를 확인하세요</em>
            </div>
          </div>
          <div class="reward-rule low" id="boxOpenResult" hidden>
            <strong>획득 결과</strong>
            <span id="boxOpenResultText">EXP를 획득했어요.</span>
          </div>
          <button class="btn primary full" type="button" id="playBoxOpenBtn">상자 열기</button>
          <button class="btn mint full" type="button" id="goExpResultBtn" data-quick-tab="childExpResultScreen"
            hidden>경험치 결과 보기</button>
        </article>
      </section>

      <section class="screen" id="childExpResultScreen" data-title="경험치 획득 결과" data-subtitle="펫 성장 결과를 보여줘요">
        <article class="card panel flow-panel">
          <h2 id="expResultTitle">EXP 획득</h2>
          <div class="progress-track">
            <div class="progress-fill" id="expResultProgress" style="width: 0%"></div>
          </div>
          <p id="expResultMessage">펫이 성장했어요.</p>
          <button class="btn primary full" type="button" data-quick-tab="petScreen">펫 상태 보기</button>
        </article>
      </section>

      <section class="screen" id="childInventoryScreen" data-title="보상함 / 인벤토리" data-subtitle="보유 상자와 프레임을 확인해요">
        <article class="card panel flow-panel inventory-panel">
          <h2>보상함</h2>
          <div class="inventory-tabs" role="tablist" aria-label="보상함 카테고리">
            <button class="inventory-tab active" type="button" data-inventory-tab="boxes">리워드 상자</button>
            <button class="inventory-tab" type="button" data-inventory-tab="badges">뱃지</button>
            <button class="inventory-tab" type="button" data-inventory-tab="frames">액자</button>
          </div>

          <div class="inventory-tab-panel active" id="inventoryBoxesPanel" data-inventory-panel="boxes">
            <div class="inventory-section-head">
              <strong>보유 상자</strong>
              <span>상자를 누르면 개봉 화면으로 이동합니다</span>
            </div>
            <div class="reward-box-list">
              <button class="reward-box-card low" type="button" data-open-box="beginner">
                <span class="reward-box-emoji">LOW</span>
                <strong>하급 상자</strong>
                <em><b data-inventory-count="beginner">0</b>개 보유</em>
              </button>
              <button class="reward-box-card middle" type="button" data-open-box="middle">
                <span class="reward-box-emoji">MID</span>
                <strong>중급 상자</strong>
                <em><b data-inventory-count="middle">0</b>개 보유</em>
              </button>
              <button class="reward-box-card high" type="button" data-open-box="premium">
                <span class="reward-box-emoji">HIGH</span>
                <strong>상급 상자</strong>
                <em><b data-inventory-count="premium">0</b>개 보유</em>
              </button>
            </div>
          </div>

          <div class="inventory-tab-panel" id="inventoryBadgesPanel" data-inventory-panel="badges">
            <div class="inventory-section-head">
              <strong>뱃지</strong>
              <span>펫 만렙 달성 시 뱃지가 지급됩니다</span>
            </div>
            <div class="badge-dex-grid">
              <article class="badge-card locked">
                <div class="badge-visual">?</div>
                <strong>몽글이 뱃지</strong>
                <span>몽글이 만렙 달성 필요</span>
              </article>
              <article class="badge-card locked">
                <div class="badge-visual">?</div>
                <strong>포근이 뱃지</strong>
                <span>추후 펫 추가 후 해금</span>
              </article>
            </div>
          </div>

          <div class="inventory-tab-panel" id="inventoryFramesPanel" data-inventory-panel="frames">
            <div class="inventory-section-head">
              <strong>액자 도감</strong>
              <span>획득 조건을 달성하면 잠금이 풀립니다</span>
            </div>
            <div class="frame-dex-grid"></div>
          </div>
        </article>
      </section>

      <section class="screen" id="childFrameScreen" data-title="프레임 선택 / 꾸미기" data-subtitle="획득한 프레임을 선택해요">
        <article class="card panel flow-panel">
          <h2>프레임 선택</h2>
          <div class="frame-preview"><span class="profile-avatar profile-photo xl"></span></div>
          <div class="inventory-grid">
            <button type="button">기본 선택됨</button>
            <button type="button">무지개 unlocked</button>
            <button type="button">별빛 locked</button>
          </div>
        </article>
      </section>

      <section class="screen" id="childNotificationsScreen" data-title="아이 알림" data-subtitle="미션과 보상 알림을 확인해요">
        <article class="card panel flow-panel">
          <div class="notice-panel-head">
            <h2>아이 알림</h2>
            <button class="notice-read-all-btn" type="button" data-mark-all-notifications="child" disabled>전체 읽음</button>
          </div>
          <div class="notice-card">하급 미션이 배정됐어요.</div>
          <div class="notice-card">양치하기 미션이 승인됐어요.</div>
          <div class="notice-card">하급 상자가 보상함에 도착했어요.</div>
        </article>
      </section>

      <section class="screen" id="childCharacterCreateScreen" data-title="AI 캐릭터 생성"
        data-subtitle="원하는 조건을 선택하면 나만의 캐릭터가 생성돼요">
        <article class="card panel form-panel character-create-panel">
          <h2>AI 캐릭터 생성</h2>
          <p>원하는 조건을 선택하면 나만의 캐릭터가 생성돼요.</p>
          <div class="character-option-group" data-character-group="expression">
            <strong>표정 선택</strong>
            <div class="character-option-row">
              <button class="character-option" type="button" data-character-option="expression"
                data-value="smile">웃음</button>
              <button class="character-option" type="button" data-character-option="expression"
                data-value="focus">집중</button>
              <button class="character-option" type="button" data-character-option="expression"
                data-value="curious">호기심</button>
            </div>
          </div>
          <div class="character-option-group" data-character-group="background">
            <strong>배경 선택</strong>
            <div class="character-option-row">
              <button class="character-option" type="button" data-character-option="background"
                data-value="city">도심</button>
              <button class="character-option" type="button" data-character-option="background"
                data-value="countryside">시골</button>
              <button class="character-option" type="button" data-character-option="background"
                data-value="futureCity">미래도시</button>
            </div>
          </div>
          <div class="character-option-group" data-character-group="glasses">
            <strong>안경 선택</strong>
            <div class="character-option-row">
              <button class="character-option" type="button" data-character-option="glasses"
                data-value="wear">착용</button>
              <button class="character-option" type="button" data-character-option="glasses"
                data-value="none">미착용</button>
            </div>
          </div>
          <button class="btn primary full" id="generateCharacterBtn" type="button">캐릭터 생성하기</button>
          <p class="entry-message" id="characterCreateMessage"></p>
          <div class="character-preview" id="characterPreview" hidden>
            <img id="characterPreviewImage" alt="생성된 AI 캐릭터" />
          </div>
          <div class="character-summary" id="characterSummary" hidden></div>
          <button class="btn mint full" id="startWithCharacterBtn" type="button" hidden>이 캐릭터로 시작하기</button>
        </article>
      </section>

      <nav class="bottom-nav" aria-label="하단 메뉴">
        <button class="nav-btn active" data-tab="homeScreen">홈</button>
        <button class="nav-btn" data-tab="childTodayMissionsScreen">미션</button>
        <button class="nav-btn pet-nav-btn" data-tab="petScreen" aria-label="펫" title="펫">
          <span class="pet-nav-heart" aria-hidden="true">♥</span>
        </button>
        <button class="nav-btn" data-tab="childInventoryScreen">보상함</button>
        <button class="nav-btn" data-tab="childNotificationsScreen">알림</button>
      </nav>
    </main>

    <div class="modal" id="profileModal" aria-hidden="true">
      <div class="modal-backdrop" data-close-modal></div>
      <article class="modal-card profile-crop-card card" role="dialog" aria-modal="true" aria-label="아이 프로필 사진 설정">
        <button class="modal-close" type="button" data-close-modal aria-label="닫기">×</button>
        <div class="profile-crop-view" id="profileCropView">
          <img id="profilePhotoImage" src="${pageContext.request.contextPath}/assets/images/profile.webp"
            alt="아이 프로필 사진" />
          <div class="profile-crop-selector" id="profileCropSelector" aria-hidden="true"></div>
        </div>
        <p class="profile-crop-guide">원을 움직여 위치를 잡고, 마우스 휠로 원 크기를 조절해요.</p>
        <div class="profile-size-controls" aria-label="프로필 원 크기 조절">
          <button class="profile-size-btn" id="profileSizeDownBtn" type="button">작게</button>
          <label class="profile-size-range" for="profileSizeRange">
            <span>원 크기</span>
            <input id="profileSizeRange" type="range" min="34" max="92" step="1" value="68" />
          </label>
          <button class="profile-size-btn" id="profileSizeUpBtn" type="button">크게</button>
        </div>
      </article>
    </div>

    <div class="toast" id="toast"></div>
    <!--
    PDF의 Servlet 흐름에 맞춰 프론트 JS를 기능별로 나눴습니다.
    아래 순서가 중요합니다. 뒤 파일은 앞 파일에서 만든 상수와 함수를 사용합니다.
  -->
    <script src="${pageContext.request.contextPath}/js/00-servlet-map.js?v=reward-chest-20260610"></script>
    <script src="${pageContext.request.contextPath}/js/01-state.js?v=reward-chest-20260610"></script>
    <script src="${pageContext.request.contextPath}/js/02-pet-mission.js?v=reward-chest-20260610"></script>
    <script src="${pageContext.request.contextPath}/js/03-profile-character.js?v=reward-chest-20260610"></script>
    <script src="${pageContext.request.contextPath}/js/04-servlet-workflows.js?v=reward-chest-20260610"></script>
    <script src="${pageContext.request.contextPath}/js/05-router-auth.js?v=reward-chest-20260610"></script>
    <script src="${pageContext.request.contextPath}/js/06-events-init.js?v=reward-chest-20260610"></script>
    <script src="${pageContext.request.contextPath}/js/07-backend-integration.js?v=reward-chest-20260610"></script>
  </body>

  </html>
