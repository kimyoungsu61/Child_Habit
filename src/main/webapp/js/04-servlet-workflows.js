// 부모/아이의 실제 업무 흐름에 가까운 렌더링 함수들을 모아둔 파일입니다.
// 초대코드, 미션 제출, 부모 승인/거절, 보상, 기록처럼 Servlet 연결 지점이 많은 영역입니다.
// 지금은 appState를 직접 바꾸지만, 추후 각 함수 안에서 Servlet 응답을 받아 갱신하면 됩니다.

function renderRewardCounts() {
  Object.entries(appState.rewardBoxCounts).forEach(([box, count]) => {
    const element = document.getElementById(`${box}BoxCount`);
    if (element) element.textContent = `[${count}]`;
    document.querySelectorAll(`[data-inventory-count="${box}"]`).forEach(countElement => {
      countElement.textContent = count;
    });
    const card = document.querySelector(`[data-open-box="${box}"]`);
    if (card) {
      card.disabled = count <= 0;
      card.classList.toggle("empty", count <= 0);
    }
  });
}

function getBoxMeta(boxType = appState.selectedBoxType || "beginner") {
  const boxMeta = {
    beginner: { label: "하급 상자", grade: "하급", gradeClass: "low", icon: "LOW", resultLabel: "하급 상자", image: "reward_box_low_wood.png" },
    middle: { label: "중급 상자", grade: "중급", gradeClass: "middle", icon: "MID", resultLabel: "중급 상자", image: "reward_box_middle_silver.png" },
    premium: { label: "상급 상자", grade: "상급", gradeClass: "high", icon: "HIGH", resultLabel: "상급 상자", image: "reward_box_high_gold.png" }
  };
  return boxMeta[boxType] || boxMeta.beginner;
}

function rewardAssetSrc(fileName) {
  const root = document.getElementById("appRoot");
  const contextPath = root?.dataset?.contextPath || "";
  return `${contextPath}/assets/rewards/${fileName}`;
}

function renderBoxIconImage(icon, meta) {
  if (!icon || !meta?.image) return;
  icon.classList.add("has-image");
  icon.innerHTML = `<img src="${rewardAssetSrc(meta.image)}" alt="${meta.label}">`;
}

const REWARD_CHEST_MOTION_FILES = {
  beginner: "wood_box.mp4",
  middle: "silver_box.mp4",
  premium: "gold_box_open.mp4"
};

function rewardChestMotionSrc(boxType = appState.selectedBoxType || "beginner") {
  const fileName = REWARD_CHEST_MOTION_FILES[boxType] || REWARD_CHEST_MOTION_FILES.beginner;
  return new URL(`assets/reward-chest/${fileName}`, document.baseURI).pathname;
}

function getRewardChestMotionElements() {
  return {
    stage: document.getElementById("boxVideoStage"),
    video: document.getElementById("boxOpeningVideo"),
    placeholder: document.getElementById("boxVideoPlaceholder")
  };
}

function resetRewardChestMotion(boxType = appState.selectedBoxType || "beginner") {
  const { stage, video, placeholder } = getRewardChestMotionElements();
  const src = rewardChestMotionSrc(boxType);
  const meta = getBoxMeta(boxType);
  const icon = document.getElementById("boxVideoIcon");
  renderBoxIconImage(icon, meta);
  if (stage) stage.classList.remove("is-opening", "has-motion");
  if (placeholder) placeholder.hidden = false;
  if (video) {
    video.pause();
    video.hidden = true;
    if (video.dataset.motionSrc !== src) {
      video.src = src;
      video.dataset.motionSrc = src;
      video.load();
    }
    try {
      video.currentTime = 0;
    } catch (error) {
      // Metadata may not be ready yet; the video will still start from the beginning on play.
    }
  }
}

function playRewardChestMotion(boxType = appState.selectedBoxType || "beginner") {
  const { stage, video, placeholder } = getRewardChestMotionElements();
  if (!video) {
    if (stage) stage.classList.add("is-opening");
    return new Promise(resolve => window.setTimeout(resolve, 900));
  }

  const src = rewardChestMotionSrc(boxType);
  if (video.dataset.motionSrc !== src) {
    video.src = src;
    video.dataset.motionSrc = src;
    video.load();
  }
  if (stage) stage.classList.add("is-opening", "has-motion");
  if (placeholder) placeholder.hidden = true;
  video.hidden = false;
  video.muted = true;
  try {
    video.currentTime = 0;
  } catch (error) {
    // Ignore seek timing issues before metadata is loaded.
  }

  return new Promise(resolve => {
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      window.clearTimeout(fallbackTimer);
      video.removeEventListener("ended", finish);
      video.removeEventListener("error", finish);
      resolve();
    };
    const fallbackTimer = window.setTimeout(finish, 3400);
    video.addEventListener("ended", finish, { once: true });
    video.addEventListener("error", finish, { once: true });
    const playResult = video.play();
    if (playResult?.catch) {
      playResult.catch(() => {
        if (placeholder) placeholder.hidden = false;
        video.hidden = true;
        finish();
      });
    }
  });
}


function renderFrameDex() {
  // 1. 현재 펫 레벨 확인하기 (현재는 몽글이 기준, 추후 모든 펫은 대표 펫 레벨로 연결하는 단계)
  const currentLevel = getPetFrameLevel();
  const frameGrid = document.querySelector(".frame-dex-grid");
  if (!frameGrid) return;

  // 2. 액자 목록 만들기 (레벨 조건에 따라 보유/잠김 상태를 나누는 단계)
  frameGrid.innerHTML = Object.entries(PROFILE_FRAMES).map(([key, frame]) => {
    const unlocked = isProfileFrameUnlocked(key, currentLevel);
    const selected = appState.selectedProfileFrameKey === key;
    const statusText = selected
      ? "현재 사용 중"
      : (unlocked
        ? (frame.unlockLevel === 1 ? "기본 보유" : `Lv.${frame.unlockLevel} 해금 완료`)
        : `Lv.${frame.unlockLevel} 해금`);
    const cardClass = unlocked ? "owned" : "locked";
    const questionMark = unlocked ? "" : "<b>?</b>";

    return `
      <article class="frame-dex-card ${cardClass} ${selected ? "selected" : ""}"
               data-frame-key="${key}" data-frame-unlocked="${unlocked}"
               role="button" tabindex="${unlocked ? "0" : "-1"}">
        <div class="frame-dex-preview ${unlocked ? "" : "silhouette"}">
          <img src="${frame.image}" alt="${frame.label}" />
          ${questionMark}
        </div>
        <strong>${frame.label}</strong>
        <span>${statusText}</span>
      </article>
    `;
  }).join("");
}

function renderInventoryTab() {
  const selectedTab = appState.selectedInventoryTab || "boxes";
  document.querySelectorAll("[data-inventory-tab]").forEach(button => {
    button.classList.toggle("active", button.dataset.inventoryTab === selectedTab);
  });
  document.querySelectorAll("[data-inventory-panel]").forEach(panel => {
    panel.classList.toggle("active", panel.dataset.inventoryPanel === selectedTab);
  });
  renderRewardCounts();
  renderFrameDex();
}

function selectedBoxAvailableCount(boxType = appState.selectedBoxType || "beginner") {
  return Math.max(0, Number(appState.rewardBoxCounts[boxType]) || 0);
}

function updateBoxOpenQuantityControls(boxType = appState.selectedBoxType || "beginner") {
  const quantityInput = document.getElementById("boxOpenQuantity");
  const maxCount = document.getElementById("boxOpenMaxCount");
  const batchButton = document.getElementById("openBoxBatchBtn");
  const openButton = document.getElementById("playBoxOpenBtn");
  const available = selectedBoxAvailableCount(boxType);
  const max = Math.max(1, available);

  if (quantityInput) {
    quantityInput.max = String(max);
    quantityInput.disabled = available <= 0;
    const value = Math.min(max, Math.max(1, Number(quantityInput.value) || 1));
    quantityInput.value = String(value);
  }
  if (maxCount) maxCount.textContent = `보유 ${available}개`;
  if (batchButton) {
    batchButton.disabled = available <= 0;
    batchButton.hidden = available <= 1;
  }
  if (openButton) openButton.disabled = available <= 0;
}

function getBoxOpenQuantity() {
  const quantityInput = document.getElementById("boxOpenQuantity");
  const available = selectedBoxAvailableCount();
  if (available <= 0) return 0;
  const requested = Math.max(1, Number(quantityInput?.value) || 1);
  return Math.min(available, requested);
}

function prepareBoxOpenScreen(boxType) {
  appState.selectedBoxType = boxType || "beginner";
  const meta = getBoxMeta(appState.selectedBoxType);
  const title = document.getElementById("boxOpenTitle");
  const guide = document.getElementById("boxOpenGuide");
  const chip = document.getElementById("boxOpenGradeChip");
  const icon = document.getElementById("boxVideoIcon");
  const result = document.getElementById("boxOpenResult");
  const resultText = document.getElementById("boxOpenResultText");
  const openButton = document.getElementById("playBoxOpenBtn");
  const expButton = document.getElementById("goExpResultBtn");
  const openMoreButton = document.getElementById("openSameBoxBtn");

  if (title) title.textContent = `${meta.label} 개봉`;
  if (guide) guide.textContent = "상자를 누르면 개봉 연출 후 경험치가 지급돼요.";
  if (chip) chip.textContent = meta.grade;
  renderBoxIconImage(icon, meta);
  if (result) {
    result.hidden = true;
    result.className = `reward-rule ${meta.gradeClass}`;
  }
  if (resultText) resultText.textContent = "EXP를 획득했어요.";
  if (openButton) {
    openButton.hidden = false;
    openButton.disabled = false;
    openButton.textContent = "상자 열기";
  }
  if (openMoreButton) openMoreButton.hidden = true;
  if (expButton) expButton.hidden = true;
  updateBoxOpenQuantityControls(appState.selectedBoxType);
  resetRewardChestMotion(appState.selectedBoxType);
}

function openSelectedRewardBox() {
  const boxType = appState.selectedBoxType || "beginner";
  const count = appState.rewardBoxCounts[boxType] || 0;
  if (count <= 0) {
    showToast("보유한 상자가 없어요.");
    switchTab("childInventoryScreen");
    return;
  }

  const meta = getBoxMeta(boxType);
  const [min, max] = rewardBoxes[boxType] || rewardBoxes.beginner;
  const exp = Math.floor(min + Math.random() * (max - min + 1));
  const openButton = document.getElementById("playBoxOpenBtn");
  const expButton = document.getElementById("goExpResultBtn");
  const result = document.getElementById("boxOpenResult");
  const resultText = document.getElementById("boxOpenResultText");
  const guide = document.getElementById("boxOpenGuide");

  appState.rewardBoxCounts[boxType] -= 1;
  appState.lastRewardExp = exp;
  appState.rewardMessage = `${meta.resultLabel}에서 EXP ${exp}를 얻었어요.`;
  if (openButton) {
    openButton.disabled = true;
    openButton.textContent = "개봉 중...";
  }

  if (typeof window.playSound === "function") {
    const soundMap = {
      beginner: "rewardOpenLow",
      middle: "rewardOpenMiddle",
      premium: "rewardOpenHigh"
    };
    const soundName = soundMap[boxType];
    if (soundName) window.playSound(soundName);
  }

  const motionPromise = playRewardChestMotion(boxType);

  motionPromise.then(() => {
    addExp(exp);
    petDex[0].badgeAcquired = appState.pet.level >= 5;
    addHistory("reward", `${meta.resultLabel} 개봉`, `EXP ${exp}를 획득했어요.`);
    renderRewardCounts();
    renderInventoryTab();
    renderMission();
    if (guide) guide.textContent = "개봉 완료! 경험치 결과를 확인하세요.";
    if (result) result.hidden = false;
    if (resultText) resultText.textContent = `EXP ${exp} 획득 · 몽글이 성장 반영`;
    if (openButton) openButton.hidden = true;
    if (expButton) expButton.hidden = false;
    getRewardChestMotionElements().stage?.classList.remove("is-opening");
    restartReactClass();
    playFrameSequence("magic", { loop: false, onComplete: resetPet });
    showToast(`EXP ${exp} 획득!`);

    if (typeof window.playSound === "function") {
      window.playSound("rewardSuccess");
    }
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

function normalizeCameraError(error) {
  const name = error?.name || "";
  const message = String(error?.message || "");
  if (name === "NotAllowedError" || name === "SecurityError") {
    return CAMERA_MESSAGES.permission;
  }
  if (name === "NotFoundError" || /requested device not found|device not found|not found/i.test(message)) {
    return CAMERA_MESSAGES.notFound;
  }
  if (name === "NotReadableError" || name === "AbortError") {
    return CAMERA_MESSAGES.unavailable;
  }
  return CAMERA_MESSAGES.unavailable;
}

function setCaptureNotice(message = "") {
  if (cameraPermissionMessage) cameraPermissionMessage.textContent = message;
}

function setCapturePlaceholder(text) {
  if (capturePlaceholder) capturePlaceholder.textContent = text;
}

function stopCaptureStream(stream) {
  stream?.getTracks?.().forEach(track => track.stop());
}

function clearCaptureStreams() {
  if (typeof videoRecorder !== "undefined" && videoRecorder?.state === "recording") {
    discardVideoRecording = true;
    videoRecorder.stop();
  }
  stopCaptureStream(captureState.stream);
  captureState.stream = null;
  if (photoStream) {
    stopCaptureStream(photoStream);
    photoStream = null;
  }
  if (typeof videoStream !== "undefined" && videoStream) {
    stopCaptureStream(videoStream);
    videoStream = null;
  }
  if (photoCameraPreview) {
    photoCameraPreview.pause();
    photoCameraPreview.srcObject = null;
    photoCameraPreview.hidden = true;
  }
  const videoPreview = document.getElementById("videoCameraPreview");
  if (videoPreview) {
    videoPreview.pause();
    videoPreview.srcObject = null;
    videoPreview.hidden = true;
  }
}

function syncCaptureState() {
  captureState.mediaType = appState.captureMode;
  captureState.isRecording = isVideoRecording;
  captureState.hasVideo = videoRecordingReady;
  captureState.hasPhoto = Boolean(capturedPhotoDataUrl);
  captureState.recorder = typeof videoRecorder === "undefined" ? captureState.recorder : videoRecorder;
}

// 촬영 화면에서 제출 버튼을 켜도 되는지 판단하는 데 필요한 상태를 모읍니다.
function getCaptureState() {
  syncCaptureState();
  return {
    missionType: getMissionType(appState.currentMissionId),
    mediaType: captureState.mediaType,
    isRecording: captureState.isRecording,
    hasVideo: captureState.hasVideo,
    hasPhoto: captureState.hasPhoto,
    stream: captureState.stream,
    recorder: captureState.recorder,
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
  clearCaptureStreams();
  appState.captureMode = mode === "video" ? "video" : "photo";
  captureState.mediaType = appState.captureMode;
  capturedPhotoDataUrl = "";
  videoRecordingReady = false;
  isVideoRecording = false;
  captureState.hasPhoto = false;
  captureState.hasVideo = false;
  captureState.isRecording = false;
  captureState.recorder = null;
  document.querySelectorAll("[data-capture-mode]").forEach(button => {
    button.disabled = false;
    button.classList.toggle("active", button.dataset.captureMode === appState.captureMode);
  });
  if (photoCaptureActions) photoCaptureActions.hidden = appState.captureMode !== "photo";
  if (videoCaptureActions) videoCaptureActions.hidden = appState.captureMode !== "video";
  if (stopMockVideoBtn) stopMockVideoBtn.hidden = true;
  setCapturePlaceholder(appState.captureMode === "photo"
    ? "📷\n아직 사진 촬영 전이에요\n사진 찍기 버튼을 눌러요"
    : "🎥\n아직 녹화 전이에요\n녹화 시작 버튼을 눌러요");
  hidePhotoCapturePreview();
  if (childCaptureStage) {
    childCaptureStage.classList.toggle("photo-mode", appState.captureMode === "photo");
    childCaptureStage.classList.remove("has-media");
  }
  setCaptureNotice("");
  updateCaptureSubmitState();
}

async function startPhotoCamera() {
  if (!photoCameraPreview) return false;
  if (!navigator.mediaDevices?.getUserMedia) {
    setCaptureNotice(CAMERA_MESSAGES.notSupported);
    setCapturePlaceholder("📷\n카메라를 사용할 수 없습니다\n잠시 후 다시 시도해 주세요");
    return false;
  }
  try {
    if (!photoStream) {
      photoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    }
    captureState.stream = photoStream;
    photoCameraPreview.srcObject = photoStream;
    photoCameraPreview.hidden = false;
    const playResult = photoCameraPreview.play?.();
    if (playResult?.catch) await playResult.catch(() => {});
    setCaptureNotice("");
    childCaptureStage?.classList.add("has-media");
    return true;
  } catch (error) {
    const message = normalizeCameraError(error);
    setCaptureNotice(message);
    setCapturePlaceholder(`📷\n${message === CAMERA_MESSAGES.notFound ? "카메라 장치를 찾을 수 없습니다" : message}`);
    childCaptureStage?.classList.remove("has-media");
    return false;
  }
}

function isPhotoFrameReady() {
  return Boolean(photoCameraPreview?.srcObject
    && photoCameraPreview.readyState >= 2
    && photoCameraPreview.videoWidth
    && photoCameraPreview.videoHeight);
}

function waitForPhotoFrame(timeoutMs = 2500) {
  if (isPhotoFrameReady()) return Promise.resolve(true);
  return new Promise(resolve => {
    let settled = false;
    const events = ["loadedmetadata", "loadeddata", "canplay", "playing"];
    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      events.forEach(event => photoCameraPreview?.removeEventListener(event, finish));
      resolve(isPhotoFrameReady());
    };
    const timer = window.setTimeout(finish, timeoutMs);
    events.forEach(event => photoCameraPreview?.addEventListener(event, finish, { once: true }));
  });
}

function stopPhotoCamera() {
  if (photoStream) {
    stopCaptureStream(photoStream);
    photoStream = null;
  }
  if (captureState.stream && appState.captureMode === "photo") captureState.stream = null;
  if (photoCameraPreview) {
    photoCameraPreview.pause();
    photoCameraPreview.srcObject = null;
    photoCameraPreview.hidden = true;
  }
}

async function takePhoto() {
  appState.captureMode = "photo";
  captureState.mediaType = "photo";
  if (!photoCameraPreview || !photoCaptureCanvas || !photoCapturePreview) return;
  const hasCamera = await startPhotoCamera();
  const ready = hasCamera && await waitForPhotoFrame();
  if (!ready) {
    setCaptureNotice(hasCamera
      ? "카메라 화면이 준비되지 않았어요. 잠시 후 다시 시도해 주세요."
      : CAMERA_MESSAGES.notFound);
    updateCaptureSubmitState();
    return;
  }
  const width = photoCameraPreview.videoWidth;
  const height = photoCameraPreview.videoHeight;
  photoCaptureCanvas.width = width;
  photoCaptureCanvas.height = height;
  const context = photoCaptureCanvas.getContext("2d");
  if (!context) return;
  try {
    context.drawImage(photoCameraPreview, 0, 0, width, height);
  } catch (error) {
    setCaptureNotice(normalizeCameraError(error));
    updateCaptureSubmitState();
    return;
  }
  capturedPhotoDataUrl = photoCaptureCanvas.toDataURL("image/png");
  captureState.hasPhoto = true;
  showPhotoCapturePreview(capturedPhotoDataUrl);
  photoCameraPreview.hidden = true;
  childCaptureStage?.classList.add("has-media");
  setCapturePlaceholder("✅\n사진 촬영이 완료되었어요");
  updateCaptureSubmitState();
}

function retakePhoto() {
  capturedPhotoDataUrl = "";
  captureState.hasPhoto = false;
  hidePhotoCapturePreview();
  if (photoCameraPreview) photoCameraPreview.hidden = true;
  childCaptureStage?.classList.remove("has-media");
  setCapturePlaceholder("📷\n아직 사진 촬영 전이에요\n사진 찍기 버튼을 눌러요");
  updateCaptureSubmitState();
  setCaptureNotice("");
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
  clearCaptureStreams();
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

function renderExpResult() {
  const expTitle = document.querySelector("#childExpResultScreen h2");
  const expText = document.querySelector("#childExpResultScreen p");
  const fill = document.querySelector("#childExpResultScreen .progress-fill");
  const exp = appState.lastRewardExp || 0;
  const percent = Math.min(100, Math.round((appState.pet.exp / appState.pet.maxExp) * 100));

  if (expTitle) expTitle.textContent = `EXP +${exp}`;
  if (expText) expText.textContent = `${appState.pet.name}가 조금 더 성장했어요. 현재 Lv.${appState.pet.level}입니다.`;
  if (fill) fill.style.width = `${percent}%`;
}
