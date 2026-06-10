// Same-origin integration layer for the Java Servlet backend.
// It runs after the original prototype scripts and replaces mock workflows
// without changing the existing visual components.
const API_ROOT = new URL("api", document.baseURI).pathname.replace(/\/$/, "");
let serverDashboard = null;
let serverChildHome = null;
let loadedServerDate = "";
let headsUpTimer = null;
let videoStream = null;
let videoRecorder = null;
let videoChunks = [];
let capturedVideoBlob = null;
const knownParentNotificationIds = new Set();
const knownChildNotificationIds = new Set();
const JOIN_DRAFT_STORAGE_KEYS = [
  "joinParentName",
  "joinParentEmail",
  "joinParentPassword",
  "joinParentPasswordCheck",
  "parentJoinDraft"
];
const LOCAL_CHILD_PROFILES_KEY = "childProfiles";

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

function boxTypeForGrade(grade) {
  return ({ low: "beginner", middle: "middle", high: "premium" })[grade] || "beginner";
}

function gradeForBoxType(boxType) {
  return ({ beginner: "low", middle: "middle", premium: "high" })[boxType] || "low";
}

function frameKeyForServerType(frameType) {
  return ({ wood: "bronze", iron: "silver", gold: "gold" })[frameType] || "bronze";
}

function serverFrameTypeForKey(frameKey) {
  return ({ bronze: "wood", silver: "iron", gold: "gold" })[frameKey] || "wood";
}

function formatRelativeNotificationTime(createdAt) {
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return "";

  const now = new Date();
  const elapsed = Math.max(0, now.getTime() - created.getTime());
  const minutes = Math.floor(elapsed / 60000);
  const hours = Math.floor(elapsed / 3600000);
  const dateKey = date => new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
  const yesterday = new Date(now.getTime() - 86400000);

  if (minutes < 1) return "지금";
  if (minutes < 60) return `${minutes}m`;
  if (dateKey(created) === dateKey(now)) return `${hours}h`;
  if (dateKey(created) === dateKey(yesterday)) return "어제";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "numeric",
    day: "numeric"
  }).format(created);
}

function notificationCard(item) {
  const unread = String(item.isRead || "").toUpperCase() === "N";
  return `<button class="notice-card notice-button ${unread ? "is-unread" : "is-read"}" type="button"
      data-notification-id="${escapeHtml(item.notificationId ?? "")}"
      data-notification-type="${escapeHtml(item.type || "")}"
      data-mission-id="${escapeHtml(item.missionId ?? "")}"
      data-submission-id="${escapeHtml(item.submissionId ?? "")}"
      data-reward-id="${escapeHtml(item.rewardId ?? "")}">
    <strong>${escapeHtml(item.title)}</strong>
    <p>${escapeHtml(item.content || "")}</p>
    <time class="notice-time" data-created-at="${escapeHtml(item.createdAt || "")}">
      ${formatRelativeNotificationTime(item.createdAt)}
    </time>
  </button>`;
}

function notificationPanelHeader(title, role, notifications = []) {
  const unreadCount = unreadNotificationCount(notifications);
  return `<div class="notice-panel-head">
    <h2>${escapeHtml(title)}</h2>
    <button class="notice-read-all-btn" type="button"
            data-mark-all-notifications="${role}"
            ${unreadCount ? "" : "disabled"}
            aria-label="${unreadCount ? `안 읽은 ${unreadCount}개 알림 전체 읽음` : "읽을 알림이 없습니다"}">
      전체 읽음
    </button>
  </div>`;
}

function updateRelativeNotificationTimes() {
  document.querySelectorAll(".notice-time[data-created-at]").forEach(element => {
    element.textContent = formatRelativeNotificationTime(element.dataset.createdAt);
  });
}

function unreadNotificationCount(notifications = []) {
  return notifications.filter(item => String(item.isRead || "").toUpperCase() === "N").length;
}

function pendingSubmissionCount(submissions = []) {
  return submissions.filter(item => item.status === "pending").length;
}

function countBadgeLabel(target, badge) {
  const navLabel = target.querySelector(".nav-label")?.textContent.trim();
  if (navLabel) return navLabel;
  const textLabel = Array.from(target.childNodes)
    .filter(node => node !== badge && node.nodeType === Node.TEXT_NODE)
    .map(node => node.textContent.trim())
    .filter(Boolean)
    .join(" ");
  return textLabel || target.textContent.replace(badge.textContent || "", "").trim();
}

function setCountBadge(targets, count) {
  const value = Number(count) || 0;
  targets.forEach(target => {
    if (!target) return;
    target.classList.add("has-count-badge");
    let badge = target.querySelector("[data-count-badge]");
    if (!badge) {
      badge = document.createElement("span");
      badge.className = "count-badge";
      badge.dataset.countBadge = "";
      target.append(badge);
    }
    const label = countBadgeLabel(target, badge);
    badge.textContent = value > 99 ? "99+" : String(value);
    badge.hidden = value <= 0;
    target.setAttribute("aria-label", value > 0
      ? `${label} ${value}개`
      : label);
  });
}

function updateAppBadges() {
  const parentUnread = appState.role === "parent"
    ? unreadNotificationCount(serverDashboard?.notifications)
    : 0;
  const childUnread = appState.role === "child"
    ? unreadNotificationCount(serverChildHome?.notifications)
    : 0;
  const parentPending = appState.role === "parent"
    ? pendingSubmissionCount(serverDashboard?.submissions || appState.submissions)
    : 0;

  setCountBadge(document.querySelectorAll("[data-tab='parentNotificationsScreen']"), parentUnread);
  setCountBadge(document.querySelectorAll("[data-tab='childNotificationsScreen']"), childUnread);
  setCountBadge(document.querySelectorAll("[data-quick-tab='parentSubmissionsScreen']"), parentPending);
}

function notificationSetForRole(role) {
  return role === "parent" ? knownParentNotificationIds : knownChildNotificationIds;
}

function notificationsForRole(role) {
  return role === "parent"
    ? (serverDashboard?.notifications || [])
    : (serverChildHome?.notifications || []);
}

function rememberKnownNotifications(role, notifications = [], showHeadsUp = false) {
  const known = notificationSetForRole(role);
  const freshUnread = [];
  notifications.forEach(item => {
    const id = Number(item.notificationId);
    if (!id) return;
    const unread = String(item.isRead || "").toUpperCase() === "N";
    if (showHeadsUp && unread && !known.has(id)) freshUnread.push(item);
    known.add(id);
  });
  if (freshUnread.length) showHeadsUpNotification(freshUnread[0]);
}

function notificationFromElement(element) {
  const id = Number(element.dataset.notificationId);
  const fromState = notificationsForRole(appState.role)
    .find(item => Number(item.notificationId) === id);
  return fromState || {
    notificationId: id,
    type: element.dataset.notificationType,
    missionId: Number(element.dataset.missionId) || null,
    submissionId: Number(element.dataset.submissionId) || null,
    rewardId: Number(element.dataset.rewardId) || null,
    title: element.querySelector("strong")?.textContent || "",
    content: element.querySelector("p")?.textContent || "",
    isRead: "Y"
  };
}

function markLocalNotificationRead(notification) {
  const id = Number(notification.notificationId);
  notificationsForRole(appState.role).forEach(item => {
    if (Number(item.notificationId) === id) item.isRead = "Y";
  });
  document
    .querySelectorAll(`[data-notification-id="${id}"]`)
    .forEach(card => {
      card.classList.remove("is-unread");
      card.classList.add("is-read");
    });
  updateAppBadges();
}

function markLocalAllNotificationsRead(role = appState.role) {
  notificationsForRole(role).forEach(item => {
    item.isRead = "Y";
  });
  const screenSelector = role === "parent"
    ? "#parentNotificationsScreen"
    : "#childNotificationsScreen";
  document.querySelectorAll(`${screenSelector} [data-notification-id]`).forEach(card => {
    card.classList.remove("is-unread");
    card.classList.add("is-read");
  });
  document
    .querySelectorAll(`[data-mark-all-notifications="${role}"]`)
    .forEach(button => {
      button.disabled = true;
      button.setAttribute("aria-label", "읽을 알림이 없습니다");
    });
  updateAppBadges();
}

async function markNotificationRead(notification) {
  const id = Number(notification.notificationId);
  if (!id || String(notification.isRead || "").toUpperCase() !== "N") return;
  await apiRequest(`/${appState.role}/notifications/read`, {
    method: "POST",
    body: formData({ notificationId: id })
  });
  markLocalNotificationRead(notification);
}

async function markAllNotificationsRead(role = appState.role) {
  const unreadCount = unreadNotificationCount(notificationsForRole(role));
  if (!unreadCount) return;
  await apiRequest(`/${role}/notifications/read`, { method: "POST" });
  markLocalAllNotificationsRead(role);
  showToast("모든 알림을 읽음 처리했어요.");
}

function getHeadsUpElement() {
  let element = document.getElementById("headsUpNotification");
  if (element) return element;
  element = document.createElement("button");
  element.id = "headsUpNotification";
  element.className = "heads-up-notification";
  element.type = "button";
  element.hidden = true;
  element.innerHTML = `
    <strong></strong>
    <span></span>
  `;
  element.addEventListener("click", () => {
    const notification = element.__notification;
    hideHeadsUpNotification();
    if (notification) {
      handleNotificationAction(notification).catch(error => showToast(error.message));
    }
  });
  document.body.append(element);
  return element;
}

function hideHeadsUpNotification() {
  const element = document.getElementById("headsUpNotification");
  if (!element) return;
  element.classList.remove("show");
  window.setTimeout(() => {
    if (!element.classList.contains("show")) element.hidden = true;
  }, 180);
}

function showHeadsUpNotification(notification) {
  const element = getHeadsUpElement();
  element.__notification = notification.notificationId || notification.type ? notification : null;
  element.querySelector("strong").textContent = notification.title || "새 알림";
  element.querySelector("span").textContent = notification.content || "";
  element.hidden = false;
  clearTimeout(headsUpTimer);
  requestAnimationFrame(() => element.classList.add("show"));
  headsUpTimer = setTimeout(hideHeadsUpNotification, 3600);
}

function renderParentSubmissionMedia() {
  if (!parentSubmissionPreview || !appState.currentSubmission?.mediaUrl) return;
  const media = appState.currentSubmission;
  const mediaUrl = new URL(media.mediaUrl.replace(/^\//, ""), document.baseURI).pathname;
  parentSubmissionPreview.innerHTML = media.mediaType === "photo"
    ? `<img class="capture-preview-media is-visible" src="${mediaUrl}" alt="제출 사진">`
    : `<video class="capture-preview-media is-visible" src="${mediaUrl}" controls playsinline></video>`;
}

function openParentSubmissionDetail(submission) {
  if (!submission) {
    switchTab("parentSubmissionsScreen");
    return;
  }
  appState.currentSubmission = submission;
  renderParentSubmissionDetail();
  renderParentSubmissionMedia();
  switchTab("parentSubmissionDetailScreen");
}

async function openNotificationTarget(notification) {
  if (appState.role === "parent") {
    if (!serverDashboard) await loadParentDashboard();
    if (notification.type === "reward_request") {
      const submissionId = Number(notification.submissionId);
      const submission = appState.submissions.find(
        item => Number(item.submissionId) === submissionId);
      openParentSubmissionDetail(submission);
      return;
    }
    switchTab("parentScreen");
    return;
  }

  if (!serverChildHome) await loadChildHome();
  const submissionId = Number(notification.submissionId);
  const submission = serverChildHome.submissions.find(
    item => Number(item.submissionId) === submissionId);

  if (notification.type === "mission_assigned") {
    switchTab("childTodayMissionsScreen");
    return;
  }
  if (notification.type === "mission_approved") {
    if (submission?.rewardGiven === "N") {
      appState.currentSubmission = submission;
      renderRewardBoxScreen(submission);
      switchTab("childRewardBoxScreen");
    } else {
      appState.selectedInventoryTab = "boxes";
      renderInventoryTab();
      switchTab("childInventoryScreen");
    }
    return;
  }
  if (notification.type === "mission_rejected") {
    appState.currentSubmission = submission || appState.currentSubmission;
    renderChildSubmissionResult(appState.currentSubmission);
    switchTab("childMissionResultScreen");
    return;
  }
  if (notification.type === "reward_paid") {
    appState.selectedInventoryTab = "boxes";
    renderInventoryTab();
    switchTab("childInventoryScreen");
    return;
  }
  switchTab("childNotificationsScreen");
}

async function handleNotificationAction(notification) {
  await markNotificationRead(notification);
  await openNotificationTarget(notification);
}

function applyActivePetState(activePet) {
  if (!activePet) return;
  const petName = activePet.pet?.name || appState.pet.name;
  appState.pet.name = petName === "토리" || petName === "tori" ? "몽글이" : petName;
  appState.pet.level = activePet.currentLevel;
  appState.pet.exp = Math.min(300, Math.max(
    0, activePet.currentExp - ((activePet.currentLevel - 1) * 300)));
  appState.pet.maxExp = 300;
}

function findCurrentChildSubmission() {
  if (!serverChildHome?.submissions?.length) return null;
  const currentId = appState.currentSubmission?.submissionId;
  return serverChildHome.submissions.find(item => item.submissionId === currentId)
    || serverChildHome.submissions[0];
}

function renderChildSubmissionResult(submission) {
  const title = document.getElementById("missionResultTitle");
  const badge = document.getElementById("missionResultBadge");
  const message = document.getElementById("missionResultMessage");
  const action = document.getElementById("missionResultActionBtn");
  if (!title || !badge || !message || !action) return;

  badge.className = "status-badge";
  action.hidden = false;
  if (!submission || submission.status === "pending") {
    title.textContent = "보호자 확인 대기 중";
    badge.classList.add("waiting");
    badge.textContent = "승인 대기";
    message.textContent = "아직 보호자가 인증을 확인하지 않았어요. 잠시 후 다시 확인해 주세요.";
    action.textContent = "미션 목록으로";
    action.dataset.resultAction = "missions";
    return;
  }

  if (submission.status === "rejected") {
    title.textContent = "다시 인증해 주세요";
    badge.classList.add("rejected");
    badge.textContent = "다시 요청";
    message.textContent = "보호자가 인증을 다시 요청했어요. 사진이나 영상을 다시 제출해 주세요.";
    action.textContent = "다시 인증하기";
    action.dataset.resultAction = "resubmit";
    return;
  }

  const boxLabel = `${gradeLabel(submission.boxGrade)} 상자`;
  badge.classList.add("approved");
  badge.textContent = "승인 완료";
  if (submission.rewardGiven === "Y") {
    title.textContent = "보상 수령 완료";
    message.textContent = `${boxLabel}를 이미 열었어요. 보상함에서 현재 보유 현황을 확인할 수 있어요.`;
    action.textContent = "보상함 보기";
    action.dataset.resultAction = "inventory";
    return;
  }

  title.textContent = "미션 승인 완료";
  message.textContent = `보호자가 미션을 승인했어요. ${boxLabel}를 열 수 있어요.`;
  action.textContent = "상자 받기";
  action.dataset.resultAction = "reward";
}

function renderRewardBoxScreen(submission) {
  if (!submission) return;
  const boxType = boxTypeForGrade(submission.boxGrade);
  const meta = getBoxMeta(boxType);
  appState.selectedBoxType = boxType;
  const title = document.getElementById("rewardBoxTitle");
  const visual = document.getElementById("rewardBoxVisual");
  const message = document.getElementById("rewardBoxMessage");
  if (title) title.textContent = `${meta.label} 획득`;
  if (visual) visual.textContent = meta.icon;
  if (message) message.textContent = `승인된 미션 보상으로 ${meta.label} 1개를 받았어요.`;
}

function renderExpResult(result) {
  const title = document.getElementById("expResultTitle");
  const progress = document.getElementById("expResultProgress");
  const message = document.getElementById("expResultMessage");
  const levelExp = Math.min(300, Math.max(
    0, result.currentExp - ((result.currentLevel - 1) * 300)));
  if (title) title.textContent = `EXP +${result.expAmount}`;
  if (progress) progress.style.width = `${levelExp / 3}%`;
  if (message) {
    message.textContent = `${appState.pet.name}이(가) Lv.${result.currentLevel}, EXP ${result.currentExp}까지 성장했어요.`;
  }
}

function setEntryMessage(element, message) {
  if (element) element.textContent = message || "";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getCompletedChildren(children = []) {
  return children.filter(child => {
    const nickname = String(child.nickname || "").trim();
    return Boolean(child.childId)
      && nickname
      && nickname !== "미설정 아이"
      && Boolean(getChildProfileImageSource(child, { allowPlaceholder: false }));
  });
}

function getChildProfileImageSource(child, options = {}) {
  const generatedCharacter = getGeneratedCharacter(child?.inviteCode);
  const generatedSource = getCharacterProfileImageSource(generatedCharacter);
  const serverSource = child?.characterImageUrl || child?.profileImage || "";
  if (generatedSource) return generatedSource;
  if (serverSource) return appAssetUrl(serverSource);
  return options.allowPlaceholder === false ? "" : DEFAULT_PROFILE_IMAGE;
}

function readLocalChildProfiles() {
  try {
    const rawProfiles = localStorage.getItem(LOCAL_CHILD_PROFILES_KEY);
    const profiles = rawProfiles ? JSON.parse(rawProfiles) : [];
    return Array.isArray(profiles) ? profiles : [];
  } catch (error) {
    return [];
  }
}

function saveChildProfile(profile) {
  const profiles = readLocalChildProfiles();
  const nextProfile = {
    childId: profile.childId,
    inviteCode: normalizeInviteCode(profile.inviteCode),
    nickname: profile.nickname,
    profileImage: profile.profileImage,
    generatedCharacter: profile.generatedCharacter || null,
    createdAt: profile.createdAt || new Date().toISOString()
  };
  const index = profiles.findIndex(item =>
    String(item.childId) === String(nextProfile.childId)
      || normalizeInviteCode(item.inviteCode) === nextProfile.inviteCode);
  if (index >= 0) {
    profiles[index] = { ...profiles[index], ...nextProfile };
  } else {
    profiles.push(nextProfile);
  }
  try {
    localStorage.setItem(LOCAL_CHILD_PROFILES_KEY, JSON.stringify(profiles));
  } catch (error) {
    // 저장소 제한이 있어도 서버 저장 흐름은 그대로 진행합니다.
  }
  return nextProfile;
}

function clearJoinDraftStorage() {
  try {
    JOIN_DRAFT_STORAGE_KEYS.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    // localStorage 사용이 막힌 브라우저에서는 입력창 초기화만 수행합니다.
  }
}

async function buildProfileCharacterData(characterData) {
  const originalImageUrl = characterData.originalImageUrl
    || characterData.imageUrl
    || mockCharacterImageUrl;
  let croppedImageUrl = characterData.croppedImageUrl || "";

  try {
    if (characterPreviewImage && characterPreviewImage.src) {
      await characterPreviewImage.decode?.();
      croppedImageUrl = createCroppedImageDataUrl(characterPreviewImage, {
        x: 50,
        y: 50,
        size: 1,
        outputSize: 512
      }) || croppedImageUrl;
    }
  } catch (error) {
    croppedImageUrl = croppedImageUrl || originalImageUrl;
  }

  return {
    ...characterData,
    imageUrl: originalImageUrl,
    originalImageUrl,
    croppedImageUrl: croppedImageUrl || originalImageUrl
  };
}

async function loadParentDashboard(options = {}) {
  serverDashboard = await apiRequest("/parent/dashboard");
  rememberKnownNotifications("parent", serverDashboard.notifications, options.showHeadsUp);
  window.__serverDashboardLoaded = true;
  appState.parent.name = serverDashboard.parent.name;
  appState.parent.email = serverDashboard.parent.email;
  const primaryChild = getCompletedChildren(serverDashboard.children)[0];
  if (primaryChild) {
    appState.child.nickname = primaryChild.nickname;
  }
  appState.submissions = serverDashboard.submissions.map(item => ({
    ...item,
    childName: item.childNickname,
    missionTitle: serverDashboard.missions.find(
      mission => mission.missionId === item.missionId)?.title || "오늘의 미션",
    grade: gradeLabel(item.boxGrade || "low")
  }));
  appState.currentSubmission = appState.submissions[0] || null;
  renderMyPage();
  renderParentDashboardData();
  renderInvite();
  renderParentSubmissions();
  updateAppBadges();
}

function renderParentDashboardData() {
  if (!serverDashboard) return;
  const connectedChildren = getCompletedChildren(serverDashboard.children);
  if (parentNameText) parentNameText.textContent = serverDashboard.parent.name;
  if (parentChildCount) parentChildCount.textContent = `${connectedChildren.length}명`;
  const childList = document.getElementById("parentChildList");
  if (childList) {
    childList.innerHTML = connectedChildren.length
      ? connectedChildren.map(child => {
        const nickname = escapeHtml(child.nickname);
        const profileImage = getChildProfileImageSource(child);
        return `
        <article class="child-manage-card">
          <span class="profile-avatar large child-manage-avatar">
            ${profileImage
              ? `<img class="profile-character-img" src="${escapeHtml(profileImage)}" alt="${nickname} 프로필">`
              : escapeHtml(nickname.slice(0, 1))}
          </span>
          <div>
            <strong>${nickname}</strong>
            <p>프로필 등록 완료</p>
            <p>초대코드: ${escapeHtml(child.inviteCode)}</p>
            <p>프로필 프레임: ${escapeHtml(child.frameType)}</p>
          </div>
        </article>
      `;
      }).join("")
      : '<div class="empty-dex">연결된 아이가 없습니다.</div>';
  }

  const missionList = document.querySelector(
    "#parentMissionsScreen .mission-grade-list");
  if (missionList) {
    missionList.innerHTML = serverDashboard.missions.length
      ? serverDashboard.missions.map(mission => {
        const completed = serverDashboard.todaySubmissions?.some(
          submission => submission.missionId === mission.missionId
            && submission.status === "approved");
        return `
        <article class="parent-mission-item">
          <div class="mission-grade-card ${mission.grade} ${completed ? "mission-completed" : ""}">
          <strong>${gradeLabel(mission.grade)} · ${mission.title}</strong>
          <span>${completed
            ? "오늘 승인 완료"
            : `${mission.mediaType === "photo" ? "사진" : "영상"} 인증 · ${mission.childNickname}`}</span>
          ${completed ? '<b class="mission-complete-stamp">미션 완료</b>' : ""}
          </div>
          <button class="mission-cancel-btn" type="button"
                  data-cancel-mission="${mission.missionId}">
            취소
          </button>
        </article>
      `;
      }).join("")
      : '<div class="empty-dex">등록된 미션이 없습니다.</div>';
  }

  const childSelect = document.getElementById("newMissionChild");
  if (childSelect) {
    const missionCounts = serverDashboard.missions.reduce((counts, mission) => {
      counts[mission.childId] = (counts[mission.childId] || 0) + 1;
      return counts;
    }, {});
    const availableChildren = connectedChildren.filter(
      child => (missionCounts[child.childId] || 0) < 5);
    childSelect.innerHTML = connectedChildren.length
      ? connectedChildren.map(child => {
        const count = missionCounts[child.childId] || 0;
        return `<option value="${child.childId}" ${count >= 5 ? "disabled" : ""}>${escapeHtml(child.nickname)} (${count}/5)${count >= 5 ? " · 등록 완료" : ""}</option>`;
      }).join("")
      : '<option value="">프로필 등록을 완료한 아이가 없습니다</option>';
    childSelect.value = availableChildren[0]?.childId || "";
    const saveMissionButton = document.getElementById("saveMissionBtn");
    if (saveMissionButton) saveMissionButton.disabled = availableChildren.length === 0;
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
    notifications.innerHTML = `${notificationPanelHeader("부모 알림", "parent", serverDashboard.notifications)}${
      serverDashboard.notifications.length
        ? serverDashboard.notifications.map(notificationCard).join("")
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
        <span>${mediaTypeLabel(item.mediaType)} · 승인 대기 · ${item.submittedAt || ""}</span>
      </button>
    `).join("")
    : '<div class="empty-dex">승인 대기 제출물이 없어요.</div>';
};

async function loadChildHome(options = {}) {
  serverChildHome = await apiRequest("/child/home");
  rememberKnownNotifications("child", serverChildHome.notifications, options.showHeadsUp);
  loadedServerDate = serverChildHome.serverDate || "";
  const child = serverChildHome.child;
  appState.child.nickname = child.nickname;
  appState.selectedProfileFrameKey = frameKeyForServerType(child.frameType);
  if (child.inviteCode) setCurrentInviteCode(child.inviteCode);
  if (child.characterImageUrl) {
    const imageUrl = appAssetUrl(child.characterImageUrl);
    const savedCharacter = getGeneratedCharacter(child.inviteCode);
    saveGeneratedCharacter(child.inviteCode, {
      imageUrl,
      originalImageUrl: savedCharacter?.originalImageUrl || imageUrl,
      croppedImageUrl: savedCharacter?.croppedImageUrl || savedCharacter?.originalImageUrl || imageUrl,
      expression: savedCharacter?.expression || "smile",
      background: savedCharacter?.background || "city",
      glasses: savedCharacter?.glasses || "none",
      prompt: savedCharacter?.prompt || ""
    });
  }
  if (serverChildHome.activePet) {
    applyActivePetState(serverChildHome.activePet);
  }
  const currentSubmissionId = appState.currentSubmission?.submissionId;
  appState.submissions = serverChildHome.submissions;
  appState.currentSubmission = appState.submissions.find(
    item => item.submissionId === currentSubmissionId) || appState.submissions[0] || null;
  renderChildMissionData();
  renderInventoryData();
  renderPet();
  renderHomeProfileCharacter();
  renderMyPage();
  updateAppBadges();
}

function renderChildMissionData() {
  if (!serverChildHome) return;
  const list = document.querySelector("#childTodayMissionsScreen .mission-grade-list");
  if (list) {
    const todaySubmissions = serverChildHome.submissions.filter(
      submission => submission.missionDate === serverChildHome.serverDate);
    const countedTodaySubmissions = todaySubmissions.filter(
      submission => submission.status === "pending" || submission.status === "approved");
    const dailyLimitReached = countedTodaySubmissions.length >= 5;
    list.innerHTML = serverChildHome.missions.length
      ? serverChildHome.missions.map(mission => {
        const submission = todaySubmissions.find(
          item => item.missionId === mission.missionId
            && (item.status === "pending" || item.status === "approved"));
        const completed = Boolean(submission);
        const unavailable = completed || dailyLimitReached;
        const statusText = submission?.status === "approved"
          ? "오늘 미션 완료"
          : (submission?.status === "pending"
            ? "인증 제출 완료"
            : (dailyLimitReached ? "오늘 5개 제출 완료" : `${mission.mediaType === "photo" ? "사진" : "영상"} 인증`));
        return `
        <button type="button"
                data-server-mission="${mission.missionId}"
                data-server-media="${mission.mediaType}"
                ${unavailable ? "disabled" : ""}
                class="mission-grade-card ${mission.grade} ${completed ? "mission-completed" : ""} ${dailyLimitReached && !completed ? "daily-limit-reached" : ""}">
          <strong>${gradeLabel(mission.grade)} · ${mission.title}</strong>
          <span>${statusText}</span>
          ${completed ? '<b class="mission-complete-stamp">미션 완료</b>' : ""}
        </button>
      `;
      }).join("")
      : '<div class="empty-dex">오늘 배정된 미션이 없습니다.</div>';
  }

  const notifications = document.querySelector("#childNotificationsScreen .flow-panel");
  if (notifications) {
    notifications.innerHTML = `${notificationPanelHeader("아이 알림", "child", serverChildHome.notifications)}${
      serverChildHome.notifications.length
        ? serverChildHome.notifications.map(notificationCard).join("")
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
  renderInventoryTab();
}

async function restoreSession() {
  const session = await apiRequest("/session");
  if (session.role === "parent") {
    enterParent();
    await loadParentDashboard();
  } else if (session.role === "child") {
    if (session.child?.inviteCode) setCurrentInviteCode(session.child.inviteCode);
    if (session.setupComplete) {
      enterChild("homeScreen");
      await loadChildHome();
    } else {
      resetCharacterCreateState();
      enterChild("childCharacterCreateScreen");
    }
  }
}

function appAssetUrl(path) {
  if (!path) return "";
  return new URL(path.replace(/^\//, ""), document.baseURI).pathname;
}

function backendCharacterPath(path) {
  const match = String(path || "").match(/\/assets\/characters\/[^?#]+\.svg/);
  return match ? match[0] : "";
}

function clearJoinForm() {
  clearJoinDraftStorage();
  [joinParentName, joinParentEmail, joinParentPassword, joinParentPasswordCheck]
    .forEach(input => {
      if (!input) return;
      input.value = "";
      input.defaultValue = "";
    });
}

async function loginChildFromInvite() {
  const inviteCode = childInviteInput.value.trim().toUpperCase();
  const data = await apiRequest("/child/login", {
    method: "POST",
    body: formData({ inviteCode, rememberMe: "on" })
  });
  setCurrentInviteCode(data.child.inviteCode);
  appState.child.nickname = data.child.nickname;
  if (data.setupComplete) {
    enterChild("homeScreen");
    await loadChildHome();
  } else {
    resetCharacterCreateState();
    childNicknameInput.value = "";
    enterChild("childCharacterCreateScreen");
  }
}

async function loginParent() {
  const email = document.getElementById("parentEmail").value.trim();
  const password = document.getElementById("parentPassword").value;
  await apiRequest("/parent/login", {
    method: "POST",
    body: formData({ email, password, rememberMe: "on" })
  });
  enterParent();
  await loadParentDashboard();
}

interceptClick("#parentLoginBtn", loginParent);

["#parentEmail", "#parentPassword"].forEach(selector => {
  document.querySelector(selector)?.addEventListener("keydown", event => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    event.stopImmediatePropagation();
    loginParent().catch(error => showToast(error.message));
  }, true);
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
  const joinedEmail = joinParentEmail.value.trim();
  clearJoinForm();
  document.getElementById("parentEmail").value = joinedEmail;
  setEntryMessage(joinMessage, "");
  showEntryPanel("parentLoginCard");
  showToast("회원가입이 완료되었습니다. 로그인해 주세요.");
});

interceptClick("#childStartBtn", loginChildFromInvite);

childInviteInput.addEventListener("keydown", event => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  event.stopImmediatePropagation();
  loginChildFromInvite().catch(error => setEntryMessage(inviteMessage, error.message));
}, true);

interceptClick("#backToEntryBtn", async () => {
  await apiRequest("/logout", { method: "POST" });
  window.__serverDashboardLoaded = false;
  serverDashboard = null;
  serverChildHome = null;
  knownParentNotificationIds.clear();
  knownChildNotificationIds.clear();
  hideHeadsUpNotification();
  childInviteInput.value = "";
  document.getElementById("parentPassword").value = "";
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
  const cancelButton = event.target.closest("[data-cancel-mission]");
  if (cancelButton) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const missionId = Number(cancelButton.dataset.cancelMission);
    if (!window.confirm("이 미션을 취소할까요? 아이의 미션 목록에서도 사라집니다.")) {
      return;
    }
    apiRequest(`/parent/missions/${missionId}/cancel`, {
      method: "POST"
    }).then(async () => {
      await loadParentDashboard();
      showToast("미션을 취소했습니다.");
    }).catch(error => showToast(error.message));
    return;
  }

  const notificationButton = event.target.closest("[data-notification-id]");
  if (notificationButton) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const notification = notificationFromElement(notificationButton);
    handleNotificationAction(notification).catch(error => showToast(error.message));
    return;
  }

  const markAllButton = event.target.closest("[data-mark-all-notifications]");
  if (markAllButton) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const role = markAllButton.dataset.markAllNotifications || appState.role;
    markAllButton.disabled = true;
    markAllNotificationsRead(role).catch(error => {
      markAllButton.disabled = false;
      showToast(error.message);
    });
    return;
  }

  const missionButton = event.target.closest("[data-server-mission]");
  if (missionButton) {
    event.preventDefault();
    event.stopImmediatePropagation();
    appState.currentMissionId = Number(missionButton.dataset.serverMission);
    appState.captureMode = missionButton.dataset.serverMedia;
    document.querySelectorAll("[data-capture-mode]").forEach(button => {
      button.disabled = false;
      button.title = "";
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
    openParentSubmissionDetail(appState.currentSubmission);
  }
}, true);

document.querySelectorAll("[data-entry-target='parentJoinCard']").forEach(button => {
  button.addEventListener("click", () => {
    clearJoinForm();
    setEntryMessage(joinMessage, "");
  }, true);
});

document.querySelectorAll("[data-tab='parentScreen'], [data-quick-tab='parentChildScreen']")
  .forEach(button => {
    button.addEventListener("click", () => {
      if (appState.role === "parent") {
        loadParentDashboard().catch(error => showToast(error.message));
      }
    }, true);
  });

document.querySelectorAll(
  "[data-tab='parentSubmissionsScreen'], [data-quick-tab='parentSubmissionsScreen'], [data-tab='parentNotificationsScreen'], [data-quick-tab='parentNotificationsScreen']")
  .forEach(button => {
    button.addEventListener("click", () => {
      if (appState.role === "parent") {
        loadParentDashboard().catch(error => showToast(error.message));
      }
    }, true);
  });

document.querySelectorAll(
  "[data-tab='childNotificationsScreen'], [data-tab='childInventoryScreen'], [data-tab='childTodayMissionsScreen']")
  .forEach(button => {
    button.addEventListener("click", () => {
      if (appState.role === "child") {
        loadChildHome().catch(error => showToast(error.message));
      }
    }, true);
  });

document.querySelectorAll("[data-action]").forEach(button => {
  interceptClick(button, async () => {
    const action = button.dataset.action;
    const activePet = await apiRequest("/child/pet/interactions", {
      method: "POST",
      body: formData({ action })
    });
    const previousLevel = appState.pet.level;
    applyActivePetState(activePet);
    handlePetAction(action, { addExperience: false });
    if (appState.pet.level > previousLevel) {
      showToast(`${appState.pet.name}가 Lv.${appState.pet.level}로 성장했어요!`);
      createParticles("🌟", 14);
    }
    renderInventoryTab();
    syncProfileFrames();
  });
});

document.addEventListener("click", event => {
  const frameCard = event.target.closest("[data-frame-key]");
  if (!frameCard || frameCard.dataset.frameUnlocked !== "true") return;
  event.preventDefault();
  const frameKey = frameCard.dataset.frameKey;
  apiRequest("/child/profile/frame", {
    method: "POST",
    body: formData({ frameType: serverFrameTypeForKey(frameKey) })
  }).then(data => {
    appState.selectedProfileFrameKey = frameKeyForServerType(data.child.frameType);
    renderFrameDex();
    syncProfileFrames();
    showToast(`${PROFILE_FRAMES[frameKey].label}를 적용했어요.`);
  }).catch(error => showToast(error.message));
}, true);

async function stopVideoCamera() {
  if (videoRecorder && videoRecorder.state !== "inactive") {
    videoRecorder.stop();
  }
  if (videoStream) {
    stopCaptureStream(videoStream);
    videoStream = null;
  }
  if (captureState.stream) captureState.stream = null;
  captureState.recorder = null;
  const preview = document.getElementById("videoCameraPreview");
  if (preview) {
    preview.pause();
    preview.srcObject = null;
    preview.hidden = true;
  }
}

async function startVideoRecording() {
  appState.captureMode = "video";
  captureState.mediaType = "video";
  if (videoRecorder?.state === "recording") {
    videoRecorder.stop();
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
    const message = typeof MediaRecorder === "undefined"
      ? "이 브라우저에서는 영상 녹화를 지원하지 않습니다."
      : CAMERA_MESSAGES.notSupported;
    setCaptureNotice(message);
    setCapturePlaceholder("🎥\n카메라를 사용할 수 없습니다\n잠시 후 다시 시도해 주세요");
    showToast(message);
    updateCaptureSubmitState();
    return;
  }
  await stopVideoCamera();
  discardVideoRecording = false;
  capturedVideoBlob = null;
  videoChunks = [];
  try {
    videoStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
      audio: false
    });
  } catch (error) {
    const message = normalizeCameraError(error);
    capturedVideoBlob = null;
    videoRecordingReady = false;
    isVideoRecording = false;
    captureState.hasVideo = false;
    captureState.isRecording = false;
    setCaptureNotice(message);
    setCapturePlaceholder(`🎥\n${message === CAMERA_MESSAGES.notFound ? "카메라 장치를 찾을 수 없습니다" : message}`);
    childCaptureStage?.classList.remove("has-media");
    showToast(message);
    updateCaptureSubmitState();
    return;
  }
  captureState.stream = videoStream;
  const preview = document.getElementById("videoCameraPreview");
  preview.srcObject = videoStream;
  preview.hidden = false;
  if (photoCameraPreview) photoCameraPreview.hidden = true;
  const candidates = ["video/webm;codecs=vp8,opus", "video/webm", "video/mp4"];
  const mimeType = candidates.find(type => MediaRecorder.isTypeSupported(type)) || "";
  try {
    videoRecorder = mimeType
      ? new MediaRecorder(videoStream, { mimeType })
      : new MediaRecorder(videoStream);
  } catch (error) {
    const message = normalizeCameraError(error);
    await stopVideoCamera();
    setCaptureNotice(message);
    setCapturePlaceholder("🎥\n카메라를 사용할 수 없습니다\n잠시 후 다시 시도해 주세요");
    showToast(message);
    updateCaptureSubmitState();
    return;
  }
  captureState.recorder = videoRecorder;
  videoRecorder.ondataavailable = event => {
    if (event.data.size) videoChunks.push(event.data);
  };
  videoRecorder.onstop = () => {
    if (discardVideoRecording) {
      discardVideoRecording = false;
      capturedVideoBlob = null;
      videoRecordingReady = false;
      isVideoRecording = false;
      captureState.hasVideo = false;
      captureState.isRecording = false;
      stopVideoCamera();
      updateCaptureSubmitState();
      return;
    }
    capturedVideoBlob = new Blob(videoChunks, {
      type: videoRecorder.mimeType || "video/webm"
    });
    videoRecordingReady = capturedVideoBlob.size > 0;
    isVideoRecording = false;
    captureState.hasVideo = videoRecordingReady;
    captureState.isRecording = false;
    stopVideoCamera();
    setCaptureNotice("");
    setCapturePlaceholder(videoRecordingReady
      ? "✅\n녹화가 완료되었어요"
      : "🎥\n아직 녹화 전이에요\n녹화 시작 버튼을 눌러요");
    childCaptureStage?.classList.toggle("has-media", videoRecordingReady);
    updateCaptureSubmitState();
  };
  videoRecorder.start();
  isVideoRecording = true;
  videoRecordingReady = false;
  captureState.isRecording = true;
  captureState.hasVideo = false;
  setCaptureNotice("");
  setCapturePlaceholder("🔴\n녹화 중이에요");
  childCaptureStage?.classList.add("has-media");
  updateCaptureSubmitState();
  window.setTimeout(() => {
    if (videoRecorder?.state === "recording") videoRecorder.stop();
  }, 30000);
}

interceptClick("#startMockVideoBtn", startVideoRecording);
interceptClick("#stopMockVideoBtn", () => {
  if (videoRecorder?.state === "recording") videoRecorder.stop();
  // TODO: 개발/테스트 전용 mock 영상 Blob이 필요하면 여기에서 별도 버튼으로 분리해 추가합니다.
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
  appState.currentSubmission = serverChildHome.submissions[0] || null;
  appState.missionStatus = "submitted";
  renderSubmissionWaiting();
  switchTab("childSubmissionWaitingScreen");
  showHeadsUpNotification({
    title: "인증이 제출됐어요",
    content: "보호자에게 검토 알림을 보냈어요."
  });
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
    showHeadsUpNotification({
      title: "인증이 승인됐어요",
      content: "아이에게 승인 알림을 보냈어요."
    });
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
    showHeadsUpNotification({
      title: "다시 요청을 보냈어요",
      content: "아이에게 재인증 알림을 보냈어요."
    });
    showToast("다시 요청 상태로 변경했습니다.");
  });
});

interceptClick("#checkSubmissionResultBtn", async () => {
  await loadChildHome();
  const submission = findCurrentChildSubmission();
  appState.currentSubmission = submission;
  renderChildSubmissionResult(submission);
  switchTab("childMissionResultScreen");
});

interceptClick("#missionResultActionBtn", () => {
  const action = document.getElementById("missionResultActionBtn")?.dataset.resultAction;
  const submission = findCurrentChildSubmission();
  if (action === "resubmit" && submission) {
    appState.currentMissionId = submission.missionId;
    appState.captureMode = submission.mediaType;
    switchTab("childCameraScreen");
    setCaptureMode(submission.mediaType);
    return;
  }
  if (action === "reward" && submission) {
    appState.currentSubmission = submission;
    renderRewardBoxScreen(submission);
    switchTab("childRewardBoxScreen");
    return;
  }
  if (action === "inventory") {
    appState.selectedInventoryTab = "boxes";
    renderInventoryTab();
    switchTab("childInventoryScreen");
    return;
  }
  switchTab("childTodayMissionsScreen");
});

interceptClick("#claimRewardBoxBtn", () => {
  const submission = findCurrentChildSubmission();
  if (!submission || submission.status !== "approved" || submission.rewardGiven !== "N") {
    throw new Error("지금 열 수 있는 보상 상자가 없어요.");
  }
  appState.currentSubmission = submission;
  appState.selectedBoxType = boxTypeForGrade(submission.boxGrade);
  prepareBoxOpenScreen(appState.selectedBoxType);
  switchTab("childRewardOpenScreen");
});

interceptClick("#playBoxOpenBtn", async () => {
  if (!serverChildHome) await loadChildHome();
  const grade = gradeForBoxType(appState.selectedBoxType);
  const currentId = appState.currentSubmission?.submissionId;
  const submission = serverChildHome.submissions.find(item =>
    item.submissionId === currentId
      && item.status === "approved"
      && item.rewardGiven === "N")
    || serverChildHome.submissions.find(item =>
      item.status === "approved"
        && item.rewardGiven === "N"
        && item.boxGrade === grade);
  if (!submission) throw new Error("열 수 있는 상자가 없어요.");

  const openButton = document.getElementById("playBoxOpenBtn");
  const expButton = document.getElementById("goExpResultBtn");
  const resultBox = document.getElementById("boxOpenResult");
  const resultText = document.getElementById("boxOpenResultText");
  const stage = document.getElementById("boxVideoStage");
  const guide = document.getElementById("boxOpenGuide");
  if (openButton) {
    openButton.disabled = true;
    openButton.textContent = "개봉 중...";
  }
  const motionPromise = playRewardChestMotion(appState.selectedBoxType);

  try {
    const result = await apiRequest(`/child/boxes/${submission.submissionId}/open`, {
      method: "POST"
    });
    appState.currentSubmission = submission;
    appState.lastRewardExp = result.expAmount;
    renderExpResult(result);
    await loadChildHome();
    await motionPromise;
    if (guide) guide.textContent = "개봉 완료! 경험치 결과를 확인하세요.";
    if (resultBox) resultBox.hidden = false;
    if (resultText) resultText.textContent = `EXP ${result.expAmount}를 획득했어요.`;
    if (openButton) openButton.hidden = true;
    if (expButton) expButton.hidden = false;
    if (stage) stage.classList.remove("is-opening");
    showToast(`EXP ${result.expAmount}를 획득했어요!`);
  } catch (error) {
    if (openButton) {
      openButton.disabled = false;
      openButton.textContent = "상자 열기";
    }
    resetRewardChestMotion(appState.selectedBoxType);
    if (stage) stage.classList.remove("is-opening");
    throw error;
  }
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

interceptClick(startWithCharacterBtn, async () => {
  const characterData = pendingGeneratedCharacter || getGeneratedCharacter();
  if (!characterData) {
    throw new Error("먼저 캐릭터를 생성해 주세요.");
  }
  const inviteCode = getCurrentInviteCode();
  const profileCharacterData = await buildProfileCharacterData(characterData);
  saveGeneratedCharacter(inviteCode, profileCharacterData);
  renderHomeProfileCharacter();
  childNicknameInput.value = "";
  switchTab("childProfileScreen");
  childNicknameInput.focus();
});

interceptClick(completeChildProfileBtn, async () => {
  const nickname = childNicknameInput?.value.trim();
  if (!nickname) throw new Error("아이 닉네임을 입력해 주세요.");
  const characterData = pendingGeneratedCharacter || getGeneratedCharacter();
  if (!characterData) throw new Error("캐릭터를 먼저 생성해 주세요.");

  const profileCharacterData = await buildProfileCharacterData(characterData);
  const setupData = await apiRequest("/child/setup", {
    method: "POST",
    body: formData({
      nickname,
      characterPreset: "forest",
      characterImageUrl: backendCharacterPath(
        profileCharacterData.originalImageUrl || profileCharacterData.imageUrl)
    })
  });
  const refreshedCharacter = saveGeneratedCharacter(getCurrentInviteCode(), {
    ...profileCharacterData
  });
  saveChildProfile({
    childId: setupData?.child?.childId || serverChildHome?.child?.childId || getCurrentInviteCode(),
    inviteCode: getCurrentInviteCode(),
    nickname,
    profileImage: getCharacterProfileImageSource(refreshedCharacter),
    generatedCharacter: refreshedCharacter
  });
  await loadChildHome();
  enterChild("homeScreen");
  showToast("아이 프로필이 등록되었습니다.");
});

window.addEventListener("pageshow", () => {
  if (parentJoinCard?.classList.contains("active")) {
    clearJoinForm();
    setEntryMessage(joinMessage, "");
  }
});

window.addEventListener("pagehide", stopVideoCamera);
restoreSession().catch(() => {});

window.setInterval(() => {
  updateRelativeNotificationTimes();
  const activeScreenId = getActiveScreenId();
  if (!appRoot.classList.contains("is-entered") || activeScreenId === "childCameraScreen") {
    return;
  }
  if (appState.role === "parent") {
    loadParentDashboard({ showHeadsUp: true }).catch(() => {});
  }
  if (appState.role === "child") {
    loadChildHome({ showHeadsUp: true }).catch(() => {});
  }
}, 10000);
