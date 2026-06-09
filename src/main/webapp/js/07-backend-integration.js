// Same-origin integration layer for the Java Servlet backend.
// It runs after the original prototype scripts and replaces mock workflows
// without changing the existing visual components.
const API_ROOT = new URL("api", document.baseURI).pathname.replace(/\/$/, "");
let serverDashboard = null;
let serverChildHome = null;
let videoStream = null;
let videoRecorder = null;
let videoChunks = [];
let capturedVideoBlob = null;

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_ROOT}${path}`, {
    credentials: "include",
    ...options
  });
  const body = await response.json().catch(() => ({
    success: false,
    message: "서버 응답을 읽지 못했습니다."
  }));
  if (!response.ok || !body.success) {
    throw new Error(body.message || "요청 처리에 실패했습니다.");
  }
  return body.data;
}

function formData(values) {
  const data = new FormData();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null) data.append(key, value);
  });
  return data;
}

function interceptClick(selector, handler) {
  const element = typeof selector === "string" ? document.querySelector(selector) : selector;
  element?.addEventListener("click", event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    Promise.resolve(handler(event)).catch(error => showToast(error.message));
  }, true);
}

function gradeLabel(grade) {
  return ({ low: "하급", middle: "중급", high: "상급" })[grade] || grade;
}

function setEntryMessage(element, message) {
  if (element) element.textContent = message || "";
}

async function loadParentDashboard() {
  serverDashboard = await apiRequest("/parent/dashboard");
  appState.parent.name = serverDashboard.parent.name;
  appState.parent.email = serverDashboard.parent.email;
  if (serverDashboard.children[0]) {
    appState.child.nickname = serverDashboard.children[0].nickname;
  }
  appState.submissions = serverDashboard.submissions.map(item => ({
    ...item,
    childName: item.childNickname,
    missionTitle: serverDashboard.missions.find(
      mission => mission.missionId === item.missionId)?.title || "오늘의 미션",
    grade: gradeLabel(item.boxGrade || "low")
  }));
  appState.currentSubmission = appState.submissions[0] || null;
  renderParentDashboardData();
  renderInvite();
  renderParentSubmissions();
  renderMyPage();
}

function renderParentDashboardData() {
  if (!serverDashboard) return;
  if (parentNameText) parentNameText.textContent = serverDashboard.parent.name;
  if (parentChildCount) parentChildCount.textContent = `${serverDashboard.children.length}명`;
  const childList = document.getElementById("parentChildList");
  if (childList) {
    childList.innerHTML = serverDashboard.children.length
      ? serverDashboard.children.map(child => `
        <article class="child-manage-card">
          <span class="profile-avatar profile-photo large"></span>
          <div>
            <strong>${child.nickname}</strong>
            <p>초대코드: ${child.inviteCode}</p>
            <p>프로필 프레임: ${child.frameType}</p>
          </div>
        </article>
      `).join("")
      : '<div class="empty-dex">연결된 아이가 없습니다.</div>';
  }

  const missionList = document.querySelector(
    "#parentMissionsScreen .mission-grade-list");
  if (missionList) {
    missionList.innerHTML = serverDashboard.missions.length
      ? serverDashboard.missions.map(mission => `
        <button class="mission-grade-card ${mission.grade}" type="button">
          <strong>${gradeLabel(mission.grade)} · ${mission.title}</strong>
          <span>${mission.mediaType === "photo" ? "사진" : "영상"} 인증 · ${mission.childNickname}</span>
        </button>
      `).join("")
      : '<div class="empty-dex">등록된 미션이 없습니다.</div>';
  }

  const childSelect = document.getElementById("newMissionChild");
  if (childSelect) {
    childSelect.innerHTML = serverDashboard.children.map(child =>
      `<option value="${child.childId}">${child.nickname}</option>`).join("");
  }

  const progressList = document.querySelector(
    "#parentChildProgressScreen .progress-list");
  if (progressList) {
    progressList.innerHTML = serverDashboard.progress.length
      ? serverDashboard.progress.map(item => `
        <div>
          <strong>${item.childNickname}</strong>
          <span class="status-badge ${item.pendingCount ? "waiting" : "approved"}">
            완료 ${item.approvedCount} · 대기 ${item.pendingCount} · 남음 ${Math.max(0, item.assignedCount - item.approvedCount)}
          </span>
        </div>
      `).join("")
      : '<div class="empty-dex">진행 정보가 없습니다.</div>';
  }

  const notifications = document.querySelector("#parentNotificationsScreen .flow-panel");
  if (notifications) {
    notifications.innerHTML = `<h2>부모 알림</h2>${
      serverDashboard.notifications.length
        ? serverDashboard.notifications.map(item =>
          `<div class="notice-card"><strong>${item.title}</strong><p>${item.content || ""}</p></div>`
        ).join("")
        : '<div class="empty-dex">새 알림이 없습니다.</div>'
    }`;
  }
}

renderParentSubmissions = function renderServerParentSubmissions() {
  if (!parentSubmissionList) return;
  const pending = appState.submissions.filter(item => item.status === "pending");
  parentSubmissionList.innerHTML = pending.length
    ? pending.map((item, index) => `
      <button class="submission-card" type="button" data-server-submission="${item.submissionId}" data-server-index="${index}">
        <strong>${item.childName} · ${item.missionTitle}</strong>
        <span>${mediaTypeLabel(item.mediaType)} · pending · ${item.submittedAt || ""}</span>
      </button>
    `).join("")
    : '<div class="empty-dex">승인 대기 제출물이 없어요.</div>';
};

async function loadChildHome() {
  serverChildHome = await apiRequest("/child/home");
  const child = serverChildHome.child;
  appState.child.nickname = child.nickname;
  if (serverChildHome.activePet) {
    const activePet = serverChildHome.activePet;
    appState.pet.name = activePet.pet?.name || appState.pet.name;
    appState.pet.level = activePet.currentLevel;
    appState.pet.exp = activePet.currentExp % 300;
    appState.pet.maxExp = 300;
  }
  appState.submissions = serverChildHome.submissions;
  renderChildMissionData();
  renderInventoryData();
  renderPet();
  renderMyPage();
}

function renderChildMissionData() {
  if (!serverChildHome) return;
  const list = document.querySelector("#childTodayMissionsScreen .mission-grade-list");
  if (list) {
    list.innerHTML = serverChildHome.missions.length
      ? serverChildHome.missions.map(mission => `
        <button class="mission-grade-card ${mission.grade}" type="button"
                data-server-mission="${mission.missionId}"
                data-server-media="${mission.mediaType}">
          <strong>${gradeLabel(mission.grade)} · ${mission.title}</strong>
          <span>${mission.mediaType === "photo" ? "사진" : "영상"} 인증</span>
        </button>
      `).join("")
      : '<div class="empty-dex">오늘 배정된 미션이 없습니다.</div>';
  }

  const notifications = document.querySelector("#childNotificationsScreen .flow-panel");
  if (notifications) {
    notifications.innerHTML = `<h2>아이 알림</h2>${
      serverChildHome.notifications.length
        ? serverChildHome.notifications.map(item =>
          `<div class="notice-card"><strong>${item.title}</strong><p>${item.content || ""}</p></div>`
        ).join("")
        : '<div class="empty-dex">새 알림이 없습니다.</div>'
    }`;
  }
}

function renderInventoryData() {
  if (!serverChildHome) return;
  serverChildHome.inventory.forEach(item => {
    const key = ({ low: "beginner", middle: "middle", high: "premium" })[item.boxGrade];
    if (key) appState.rewardBoxCounts[key] = item.quantity;
  });
  renderRewardCounts();
}

async function restoreSession() {
  const session = await apiRequest("/session");
  if (session.role === "parent") {
    await loadParentDashboard();
    enterParent();
  } else if (session.role === "child") {
    await loadChildHome();
    enterChild(session.setupComplete ? "homeScreen" : "childCharacterCreateScreen");
  }
}

interceptClick("#parentLoginBtn", async () => {
  const email = document.getElementById("parentEmail").value.trim();
  const password = document.getElementById("parentPassword").value;
  await apiRequest("/parent/login", {
    method: "POST",
    body: formData({ email, password, rememberMe: "on" })
  });
  await loadParentDashboard();
  enterParent();
});

interceptClick("#parentJoinBtn", async () => {
  const password = joinParentPassword.value;
  if (password !== joinParentPasswordCheck.value) {
    setEntryMessage(joinMessage, "비밀번호 확인이 일치하지 않아요.");
    return;
  }
  await apiRequest("/parent/join", {
    method: "POST",
    body: formData({
      name: joinParentName.value.trim(),
      email: joinParentEmail.value.trim(),
      password
    })
  });
  document.getElementById("parentEmail").value = joinParentEmail.value.trim();
  setEntryMessage(joinMessage, "가입되었습니다. 로그인해 주세요.");
  showEntryPanel("parentLoginCard");
});

interceptClick("#childStartBtn", async () => {
  const data = await apiRequest("/child/login", {
    method: "POST",
    body: formData({ inviteCode: childInviteInput.value.trim(), rememberMe: "on" })
  });
  appState.child.nickname = data.child.nickname;
  await loadChildHome();
  enterChild(data.setupComplete ? "homeScreen" : "childCharacterCreateScreen");
});

interceptClick("#backToEntryBtn", async () => {
  await apiRequest("/logout", { method: "POST" });
  backToEntry();
  showEntryPanel("entryStartCard");
});

interceptClick("#generateInviteBtn", async () => {
  const data = await apiRequest("/parent/invites", { method: "POST" });
  appState.inviteCode = data.child.inviteCode;
  renderInvite();
  await loadParentDashboard();
  showToast("새 초대코드가 생성됐어요.");
});

interceptClick("#saveMissionBtn", async () => {
  const message = document.getElementById("missionCreateMessage");
  await apiRequest("/parent/missions", {
    method: "POST",
    body: formData({
      childId: document.getElementById("newMissionChild").value,
      missionTitle: document.getElementById("newMissionTitle").value,
      missionDescription: document.getElementById("newMissionDescription").value,
      missionGrade: document.getElementById("newMissionGrade").value,
      mediaType: document.getElementById("newMissionMediaType").value
    })
  });
  setEntryMessage(message, "미션이 저장되었습니다.");
  await loadParentDashboard();
  switchTab("parentMissionsScreen");
});

document.addEventListener("click", event => {
  const missionButton = event.target.closest("[data-server-mission]");
  if (missionButton) {
    event.preventDefault();
    event.stopImmediatePropagation();
    appState.currentMissionId = Number(missionButton.dataset.serverMission);
    appState.captureMode = missionButton.dataset.serverMedia;
    document.querySelectorAll("[data-capture-mode]").forEach(button => {
      button.disabled = button.dataset.captureMode !== appState.captureMode;
      button.title = button.disabled ? "이 미션에서 선택할 수 없는 인증 방식입니다." : "";
    });
    switchTab("childCameraScreen");
    setCaptureMode(appState.captureMode);
    return;
  }
  const submissionButton = event.target.closest("[data-server-submission]");
  if (submissionButton) {
    event.preventDefault();
    event.stopImmediatePropagation();
    appState.currentSubmission = appState.submissions.find(
      item => item.submissionId === Number(submissionButton.dataset.serverSubmission));
    renderParentSubmissionDetail();
    if (parentSubmissionPreview && appState.currentSubmission) {
      const media = appState.currentSubmission;
      const mediaUrl = new URL(
        media.mediaUrl.replace(/^\//, ""), document.baseURI).pathname;
      parentSubmissionPreview.innerHTML = media.mediaType === "photo"
        ? `<img class="capture-preview-media is-visible" src="${mediaUrl}" alt="제출 사진">`
        : `<video class="capture-preview-media is-visible" src="${mediaUrl}" controls playsinline></video>`;
    }
    switchTab("parentSubmissionDetailScreen");
  }
}, true);

async function stopVideoCamera() {
  if (videoRecorder && videoRecorder.state !== "inactive") {
    videoRecorder.stop();
  }
  if (videoStream) {
    videoStream.getTracks().forEach(track => track.stop());
    videoStream = null;
  }
  const preview = document.getElementById("videoCameraPreview");
  if (preview) {
    preview.srcObject = null;
    preview.hidden = true;
  }
}

async function startVideoRecording() {
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
    throw new Error("이 브라우저에서는 영상 녹화를 지원하지 않습니다.");
  }
  await stopVideoCamera();
  capturedVideoBlob = null;
  videoChunks = [];
  videoStream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: "environment" } },
    audio: true
  });
  const preview = document.getElementById("videoCameraPreview");
  preview.srcObject = videoStream;
  preview.hidden = false;
  if (photoCameraPreview) photoCameraPreview.hidden = true;
  const candidates = ["video/webm;codecs=vp8,opus", "video/webm", "video/mp4"];
  const mimeType = candidates.find(type => MediaRecorder.isTypeSupported(type)) || "";
  videoRecorder = mimeType
    ? new MediaRecorder(videoStream, { mimeType })
    : new MediaRecorder(videoStream);
  videoRecorder.ondataavailable = event => {
    if (event.data.size) videoChunks.push(event.data);
  };
  videoRecorder.onstop = () => {
    capturedVideoBlob = new Blob(videoChunks, {
      type: videoRecorder.mimeType || "video/webm"
    });
    videoRecordingReady = capturedVideoBlob.size > 0;
    isVideoRecording = false;
    stopVideoCamera();
    if (capturePlaceholder) capturePlaceholder.textContent = "✅\n영상 촬영 완료\n이제 인증 제출을 눌러요";
    updateCaptureSubmitState();
  };
  videoRecorder.start();
  isVideoRecording = true;
  videoRecordingReady = false;
  if (capturePlaceholder) capturePlaceholder.textContent = "🔴\n녹화 중이에요\n최대 30초까지 촬영해요";
  updateCaptureSubmitState();
  window.setTimeout(() => {
    if (videoRecorder?.state === "recording") videoRecorder.stop();
  }, 30000);
}

interceptClick("#startMockVideoBtn", startVideoRecording);
interceptClick("#stopMockVideoBtn", () => {
  if (videoRecorder?.state === "recording") videoRecorder.stop();
});

interceptClick("#submitCaptureBtn", async () => {
  const mediaType = appState.captureMode;
  let blob;
  let fileName;
  if (mediaType === "photo") {
    if (!capturedPhotoDataUrl) throw new Error("사진을 먼저 촬영해 주세요.");
    blob = await fetch(capturedPhotoDataUrl).then(response => response.blob());
    fileName = "mission-photo.png";
  } else {
    if (!capturedVideoBlob) throw new Error("영상을 먼저 녹화해 주세요.");
    blob = capturedVideoBlob;
    fileName = blob.type.includes("mp4") ? "mission-video.mp4" : "mission-video.webm";
  }
  const data = new FormData();
  data.append("missionId", appState.currentMissionId);
  data.append("mediaType", mediaType);
  data.append("mediaFile", blob, fileName);
  await apiRequest("/child/submissions", {
    method: "POST",
    headers: { "X-Camera-Capture": "true" },
    body: data
  });
  await loadChildHome();
  appState.missionStatus = "submitted";
  renderSubmissionWaiting();
  switchTab("childSubmissionWaitingScreen");
  showToast("인증이 제출됐어요.");
});

document.querySelectorAll("[data-mock-approve]").forEach(button => {
  interceptClick(button, async () => {
    if (!appState.currentSubmission) throw new Error("제출물을 선택해 주세요.");
    await apiRequest(`/parent/submissions/${appState.currentSubmission.submissionId}/approve`, {
      method: "POST",
      body: formData({ boxGrade: appState.currentSubmission.boxGrade || "low" })
    });
    await loadParentDashboard();
    switchTab("parentSubmissionsScreen");
    showToast("미션을 승인했습니다.");
  });
});

document.querySelectorAll("[data-mock-reject]").forEach(button => {
  interceptClick(button, async () => {
    if (!appState.currentSubmission) throw new Error("제출물을 선택해 주세요.");
    await apiRequest(`/parent/submissions/${appState.currentSubmission.submissionId}/reject`, {
      method: "POST"
    });
    await loadParentDashboard();
    switchTab("parentSubmissionsScreen");
    showToast("다시 요청 상태로 변경했습니다.");
  });
});

document.querySelectorAll("[data-box]").forEach(button => {
  interceptClick(button, async () => {
    if (!serverChildHome) await loadChildHome();
    const grade = ({ beginner: "low", middle: "middle", premium: "high" })[button.dataset.box];
    const submission = serverChildHome.submissions.find(
      item => item.status === "approved"
        && item.rewardGiven === "N"
        && item.boxGrade === grade);
    if (!submission) throw new Error("열 수 있는 상자가 없습니다.");
    const result = await apiRequest(`/child/boxes/${submission.submissionId}/open`, {
      method: "POST"
    });
    await loadChildHome();
    showToast(`${result.expAmount} EXP를 획득했어요!`);
  });
});

completeChildProfileBtn?.addEventListener("click", async () => {
  try {
    await apiRequest("/child/setup", {
      method: "POST",
      body: formData({
        nickname: childNicknameInput?.value.trim() || "아이",
        characterPreset: "forest"
      })
    });
    await loadChildHome();
  } catch (error) {
    showToast(error.message);
  }
});

startWithCharacterBtn?.addEventListener("click", async () => {
  const characterData = pendingGeneratedCharacter || getGeneratedCharacter();
  if (!characterData) return;
  try {
    await apiRequest("/child/setup", {
      method: "POST",
      body: formData({
        nickname: appState.child.nickname === "미설정 아이" ? "아이" : appState.child.nickname,
        characterPreset: "forest"
      })
    });
    await loadChildHome();
  } catch (error) {
    showToast(error.message);
  }
});

window.addEventListener("pagehide", stopVideoCamera);
restoreSession().catch(() => {});
