// 부모/아이의 실제 업무 흐름에 가까운 렌더링 함수들을 모아둔 파일입니다.
// 초대코드, 미션 제출, 부모 승인/거절, 보상, 기록처럼 Servlet 연결 지점이 많은 영역입니다.
// 지금은 appState를 직접 바꾸지만, 추후 각 함수 안에서 Servlet 응답을 받아 갱신하면 됩니다.

function renderRewardCounts() {
  Object.entries(appState.rewardBoxCounts).forEach(([box, count]) => {
    const element = document.getElementById(`${box}BoxCount`);
    if (element) element.textContent = `[${count}]`;
  });
}

// 부모가 아이를 초대할 때 보여줄 6자리 임시 코드를 만듭니다.
// 실제 서비스에서는 ChildInviteCreateServlet 또는 InviteRegenerateServlet 결과를 사용합니다.
function createInviteCode() {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += characters[Math.floor(Math.random() * characters.length)];
  }
  return code;
}

// 부모 초대 화면의 초대코드와 보호자 이름을 최신 상태로 맞춥니다.
function renderInvite() {
  if (inviteCodeText) inviteCodeText.textContent = appState.inviteCode;
  if (parentNameText) parentNameText.textContent = appState.parent.name;
}


// 기록 카드에 표시할 현재 시간을 짧은 문자열로 만듭니다.
function nowText() {
  const date = new Date();
  return `${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

// 아이/부모 기록 화면에 공통으로 쓸 히스토리 데이터를 쌓습니다.
function addHistory(type, title, description) {
  appState.histories.unshift({ type, title, description, time: nowText() });
  renderHistories();
}

// 시작 화면 안에서 로그인/가입/초대코드 패널만 바꿔 보여줍니다.
const entryPanelHistory = [];

function getActiveEntryPanelId() {
  return document.querySelector(".entry-panel.active")?.id || "";
}

function updateEntryBackButtons() {
  document.querySelectorAll(".entry-back-btn").forEach(button => {
    const canGoBack = getActiveEntryPanelId() !== "entryStartCard" && entryPanelHistory.length > 0;
    button.hidden = !canGoBack;
    button.disabled = !canGoBack;
  });
}

function goBackEntryPanel() {
  const previousPanelId = entryPanelHistory.pop();
  if (!previousPanelId) return;
  showEntryPanel(previousPanelId, { skipHistory: true });
}

function showEntryPanel(panelId, options = {}) {
  const currentPanelId = getActiveEntryPanelId();
  if (!options.skipHistory && currentPanelId && currentPanelId !== panelId) {
    const lastPanelId = entryPanelHistory[entryPanelHistory.length - 1];
    if (panelId === "entryStartCard") {
      entryPanelHistory.length = 0;
    } else if (lastPanelId === panelId) {
      entryPanelHistory.pop();
    } else {
      entryPanelHistory.push(currentPanelId);
    }
  }
  document.querySelectorAll(".entry-panel").forEach(panel => {
    const isActive = panel.id === panelId;
    panel.classList.toggle("active", isActive);
    if (isActive) panel.hidden = false;
  });
  updateEntryBackButtons();
  requestAnimationFrame(() => {
    const firstInput = document.querySelector(`#${panelId} input`);
    firstInput?.focus();
  });
}

// photo/video 값을 사용자에게 보여줄 한글 인증 유형으로 바꿉니다.
function mediaTypeLabel(mediaType) {
  return mediaType === "photo" ? "사진 인증" : "영상 인증";
}

// 아이가 인증을 제출했을 때 부모 검토 목록에 들어갈 임시 제출물을 만듭니다.
// 실제 서비스에서는 MissionSubmitServlet의 submissionId/status 응답으로 대체됩니다.
function createSubmission(mediaType) {
  const missionTitles = {
    "mission-low": "양치하기",
    "mission-middle": "책 읽기 10분",
    "mission-high": "방 정리하기"
  };
  const missionGrades = {
    "mission-low": "하급",
    "mission-middle": "중급",
    "mission-high": "상급"
  };
  const submission = {
    missionId: appState.currentMissionId,
    missionType: getMissionType(appState.currentMissionId),
    childName: appState.child.nickname,
    missionTitle: missionTitles[appState.currentMissionId] || "오늘의 미션",
    grade: missionGrades[appState.currentMissionId] || "하급",
    mediaType,
    status: "pending",
    submittedAt: nowText()
  };
  appState.currentSubmission = submission;
  appState.submissions.unshift(submission);
  return submission;
}

// 아이가 제출 후 기다리는 화면의 문구를 제출 유형에 맞게 바꿉니다.
function renderSubmissionWaiting() {
  if (!submissionWaitingMessage) return;
  const mediaType = appState.currentSubmission?.mediaType || appState.captureMode || appState.missionMode;
  submissionWaitingMessage.textContent = mediaType === "photo"
    ? "사진 인증이 제출되었습니다. 보호자 승인 대기 중입니다."
    : "영상 인증이 제출되었습니다. 보호자 승인 대기 중입니다.";
}

// 부모의 제출물 목록 화면을 pending 상태 제출물 기준으로 다시 그립니다.
function renderParentSubmissions() {
  if (!parentSubmissionList) return;
  const pendingSubmissions = appState.submissions
    .map((item, index) => ({ ...item, sourceIndex: index }))
    .filter(item => item.status === "pending");
  parentSubmissionList.innerHTML = pendingSubmissions.length
    ? pendingSubmissions.map(item => `
      <button class="submission-card" type="button" data-submission-index="${item.sourceIndex}" data-quick-tab="parentSubmissionDetailScreen">
        <strong>${item.childName} · ${item.missionTitle}</strong>
        <span>${mediaTypeLabel(item.mediaType)} · ${item.status} · ${item.submittedAt}</span>
      </button>
    `).join("")
    : '<div class="empty-dex">승인 대기 제출물이 없어요.</div>';
}

// 부모가 제출물 하나를 눌렀을 때 상세 영역에 아이/유형/등급을 표시합니다.
function renderParentSubmissionDetail() {
  const submission = appState.currentSubmission || appState.submissions[0];
  if (!submission) return;
  if (parentSubmissionPreview) {
    parentSubmissionPreview.textContent = submission.mediaType === "photo"
      ? "사진 인증 preview placeholder"
      : "영상 인증 preview placeholder";
  }
  if (parentSubmissionChild) parentSubmissionChild.textContent = submission.childName;
  if (parentSubmissionMediaType) parentSubmissionMediaType.textContent = mediaTypeLabel(submission.mediaType);
  if (parentSubmissionGrade) parentSubmissionGrade.textContent = submission.grade;
}

// missionId를 화면/CSS에서 쓰기 쉬운 low/middle/high 값으로 바꿉니다.
function getMissionType(missionId = appState.currentMissionId) {
  const missionTypes = {
    "mission-low": "low",
    "mission-middle": "middle",
    "mission-high": "high"
  };
  return missionTypes[missionId] || "low";
}

// 촬영 화면에서 제출 버튼을 켜도 되는지 판단하는 데 필요한 상태를 모읍니다.
function getCaptureState() {
  return {
    missionType: getMissionType(appState.currentMissionId),
    mediaType: appState.captureMode,
    isRecording: isVideoRecording,
    hasVideo: videoRecordingReady,
    hasPhoto: Boolean(capturedPhotoDataUrl),
    status: appState.missionStatus === "submitted" ? "pending" : appState.missionStatus
  };
}

// 사진은 촬영 완료 후, 영상은 녹화 종료 후에만 제출 버튼을 활성화합니다.
function updateCaptureSubmitState() {
  const captureState = getCaptureState();
  const isPhotoMode = captureState.mediaType === "photo";
  const canSubmit = isPhotoMode
    ? captureState.hasPhoto
    : captureState.hasVideo && !captureState.isRecording;

  if (submitCaptureBtn) {
    submitCaptureBtn.disabled = !canSubmit;
    submitCaptureBtn.textContent = "인증 제출";
  }
  if (startMockVideoBtn) {
    startMockVideoBtn.textContent = isVideoRecording
      ? "녹화 종료"
      : (videoRecordingReady ? "다시 녹화" : "녹화 시작");
    startMockVideoBtn.classList.toggle("mint", isVideoRecording);
    startMockVideoBtn.classList.toggle("primary", !isVideoRecording);
  }
}

// 촬영 방식을 사진/영상 중 하나로 바꾸고 관련 UI를 초기화합니다.
function setCaptureMode(mode) {
  appState.captureMode = mode === "video" ? "video" : "photo";
  capturedPhotoDataUrl = "";
  videoRecordingReady = false;
  isVideoRecording = false;
  document.querySelectorAll("[data-capture-mode]").forEach(button => {
    button.classList.toggle("active", button.dataset.captureMode === appState.captureMode);
  });
  if (photoCaptureActions) photoCaptureActions.hidden = appState.captureMode !== "photo";
  if (videoCaptureActions) videoCaptureActions.hidden = appState.captureMode !== "video";
  if (stopMockVideoBtn) stopMockVideoBtn.hidden = true;
  if (capturePlaceholder) {
    capturePlaceholder.textContent = appState.captureMode === "photo"
      ? "📷\n아직 촬영 전이에요\n사진 찍기 버튼을 눌러요"
      : "🎥\n아직 녹화 전이에요\n녹화 시작 버튼을 눌러요";
  }
  hidePhotoCapturePreview();
  if (childCaptureStage) {
    childCaptureStage.classList.toggle("photo-mode", appState.captureMode === "photo");
    childCaptureStage.classList.remove("has-media");
  }
  if (cameraPermissionMessage) cameraPermissionMessage.textContent = "";
  if (appState.captureMode === "photo") {
    startPhotoCamera();
  } else {
    stopPhotoCamera();
  }
  updateCaptureSubmitState();
}

async function startPhotoCamera() {
  if (!photoCameraPreview) return;
  if (!navigator.mediaDevices?.getUserMedia) {
    if (cameraPermissionMessage) cameraPermissionMessage.textContent = "카메라 권한을 허용해 주세요.";
    if (capturePlaceholder) capturePlaceholder.textContent = "📷\n사진 촬영을 지원하지 않는 환경입니다.";
    return;
  }
  try {
    if (!photoStream) {
      photoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    }
    photoCameraPreview.srcObject = photoStream;
    photoCameraPreview.hidden = false;
    if (cameraPermissionMessage) cameraPermissionMessage.textContent = "";
    childCaptureStage?.classList.add("has-media");
  } catch (error) {
    if (cameraPermissionMessage) cameraPermissionMessage.textContent = "카메라 권한을 허용해 주세요.";
    if (capturePlaceholder) capturePlaceholder.textContent = "📷\n카메라 권한을 허용해 주세요.";
    childCaptureStage?.classList.remove("has-media");
  }
}

function stopPhotoCamera() {
  if (photoStream) {
    photoStream.getTracks().forEach(track => track.stop());
    photoStream = null;
  }
  if (photoCameraPreview) {
    photoCameraPreview.pause();
    photoCameraPreview.srcObject = null;
    photoCameraPreview.hidden = appState.captureMode !== "photo";
  }
}

function takePhoto() {
  if (!photoCameraPreview || !photoCaptureCanvas || !photoCapturePreview) return;
  const width = photoCameraPreview.videoWidth || 640;
  const height = photoCameraPreview.videoHeight || 480;
  photoCaptureCanvas.width = width;
  photoCaptureCanvas.height = height;
  const context = photoCaptureCanvas.getContext("2d");
  try {
    if (photoCameraPreview.readyState >= 2 && photoCameraPreview.videoWidth) {
      context.drawImage(photoCameraPreview, 0, 0, width, height);
    } else {
      context.fillStyle = "#172233";
      context.fillRect(0, 0, width, height);
      context.fillStyle = "#ffffff";
      context.font = "bold 28px system-ui, sans-serif";
      context.textAlign = "center";
      context.fillText("사진 인증 placeholder", width / 2, height / 2);
      if (cameraPermissionMessage) cameraPermissionMessage.textContent = "카메라 권한을 허용해 주세요.";
    }
  } catch (error) {
    context.fillStyle = "#172233";
    context.fillRect(0, 0, width, height);
    context.fillStyle = "#ffffff";
    context.font = "bold 28px system-ui, sans-serif";
    context.textAlign = "center";
    context.fillText("사진 인증 placeholder", width / 2, height / 2);
    if (cameraPermissionMessage) cameraPermissionMessage.textContent = "카메라 권한을 허용해 주세요.";
  }
  capturedPhotoDataUrl = photoCaptureCanvas.toDataURL("image/png");
  showPhotoCapturePreview(capturedPhotoDataUrl);
  photoCameraPreview.hidden = true;
  childCaptureStage?.classList.add("has-media");
  if (capturePlaceholder) capturePlaceholder.textContent = "";
  updateCaptureSubmitState();
}

function retakePhoto() {
  capturedPhotoDataUrl = "";
  hidePhotoCapturePreview();
  if (photoCameraPreview) photoCameraPreview.hidden = false;
  childCaptureStage?.classList.remove("has-media");
  updateCaptureSubmitState();
  startPhotoCamera();
}

function submitCapture() {
  const mediaType = appState.captureMode;
  if (mediaType === "photo" && !capturedPhotoDataUrl) {
    if (cameraPermissionMessage) cameraPermissionMessage.textContent = "사진을 먼저 찍어 주세요.";
    updateCaptureSubmitState();
    return;
  }
  if (mediaType === "video" && isVideoRecording) {
    if (cameraPermissionMessage) cameraPermissionMessage.textContent = "녹화 종료 후 제출할 수 있어요.";
    updateCaptureSubmitState();
    return;
  }
  if (mediaType === "video" && !videoRecordingReady) {
    if (cameraPermissionMessage) cameraPermissionMessage.textContent = "영상을 먼저 녹화해 주세요.";
    updateCaptureSubmitState();
    return;
  }
  createSubmission(mediaType);
  appState.missionStatus = "submitted";
  appState.rewardMessage = "보호자 확인을 기다리고 있어요.";
  addHistory("submitted", "미션 인증 제출", `${mediaTypeLabel(mediaType)}을 보호자에게 보냈어요.`);
  renderMission();
  renderParentSubmissions();
  renderSubmissionWaiting();
  stopPhotoCamera();
  updateCaptureSubmitState();
  switchTab("childSubmissionWaitingScreen");
}

function renderHistories() {
  const empty = '<div class="empty-dex">아직 기록이 없어요.</div>';
  const html = appState.histories.length
    ? appState.histories.map(item => `
      <article class="history-card ${item.type}">
        <div>
          <strong>${item.title}</strong>
          <p>${item.description}</p>
        </div>
        <span>${item.time}</span>
      </article>
    `).join("")
    : empty;
  if (childHistoryList) childHistoryList.innerHTML = html;
  if (parentHistoryList) parentHistoryList.innerHTML = html;
}

function renderParentChildList() {
  if (!parentChildList) return;
  parentChildList.innerHTML = `
    <article class="child-manage-card">
      <span class="profile-avatar profile-photo large"></span>
      <div>
        <strong>${appState.child.nickname}</strong>
        <p>대표 펫: ${appState.pet.name} · Lv.${appState.pet.level} · ${getCurrentProfileFrame().label}</p>
        <p>인증 상태: ${missionLabel(appState.missionStatus)}</p>
      </div>
    </article>
  `;
}

function renderMyPage() {
  if (myNickname) myNickname.textContent = appState.child.nickname;
  if (myPetSummary) myPetSummary.textContent = `${appState.pet.name} · Lv.${appState.pet.level} · ${getCurrentProfileFrame().label}`;
  if (myExpText) myExpText.textContent = `EXP ${appState.pet.exp} / ${appState.pet.maxExp}`;
  if (myMissionStatus) myMissionStatus.textContent = missionLabel(appState.missionStatus);
  if (myBadgeText) myBadgeText.textContent = petDex[0]?.badgeAcquired ? petDex[0].badgeName : "첫 습관 뱃지 준비 중";
  renderParentChildList();
  syncProfileFrames();
  scheduleApplySavedProfileCropStyle();
  renderHistories();
}
