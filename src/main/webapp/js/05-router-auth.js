// 화면 전환과 로그인/가입 진입 흐름을 담당합니다.
// 현재는 클라이언트에서 role만 바꿔서 부모/아이 모드를 흉내 냅니다.
// 실제 서비스에서는 LoginServlet, ParentLoginServlet, ChildInviteLoginServlet 등이 세션을 만들고,
// 프론트는 서버가 내려준 사용자 역할에 따라 화면을 보여주는 방식으로 바꾸면 됩니다.

function configureNavForRole(role) {
  const navItems = role === "parent"
    ? [
      ["parentScreen", "홈"],
      ["parentMissionsScreen", "미션"],
      ["parentChildScreen", "펫"],
      ["parentSubmissionsScreen", "보상함"],
      ["parentNotificationsScreen", "알림"]
    ]
    : [
      ["homeScreen", "홈"],
      ["childTodayMissionsScreen", "미션"],
      ["petScreen", "펫"],
      ["childInventoryScreen", "보상함"],
      ["childNotificationsScreen", "알림"]
    ];

  document.querySelectorAll(".nav-btn").forEach((button, index) => {
    const item = navItems[index];
    if (!item) {
      button.style.display = "none";
      return;
    }
    button.style.display = "block";
    button.dataset.tab = item[0];
    button.textContent = item[1];
  });
}

// 아직 로그인 전이어도 하단 메뉴 기본값은 아이 화면 기준으로 맞춰 둡니다.
function configureDefaultNav() {
  configureNavForRole("child");
  document.querySelectorAll(".nav-btn").forEach(button => {
    button.classList.toggle("active", button.dataset.tab === "homeScreen");
  });
}

const pageHistory = [];
const navigationRootScreens = new Set(["homeScreen", "parentScreen"]);
const entryFallbackScreens = new Set(["childCharacterCreateScreen", "childProfileScreen"]);

function getActiveScreenId() {
  return document.querySelector(".screen.active")?.id || "";
}

function ensureBackNavigationControls() {
  const topbar = document.querySelector(".topbar");
  const profileButton = document.getElementById("profileOpenBtn");
  if (topbar && profileButton && !document.getElementById("pageBackBtn")) {
    const pageBackButton = document.createElement("button");
    pageBackButton.className = "page-back-btn";
    pageBackButton.id = "pageBackBtn";
    pageBackButton.type = "button";
    pageBackButton.setAttribute("aria-label", "이전 화면으로 돌아가기");
    pageBackButton.textContent = "<";
    pageBackButton.addEventListener("click", goBackPage);
    topbar.insertBefore(pageBackButton, profileButton);
  }

  document.querySelectorAll(".entry-panel").forEach(panel => {
    if (panel.id === "entryStartCard" || panel.querySelector(".entry-back-btn")) return;
    const entryBackButton = document.createElement("button");
    entryBackButton.className = "entry-back-btn";
    entryBackButton.type = "button";
    entryBackButton.setAttribute("aria-label", "이전 화면으로 돌아가기");
    entryBackButton.textContent = "<";
    entryBackButton.addEventListener("click", goBackEntryPanel);
    panel.prepend(entryBackButton);
  });

  updateBackNavigationControls();
  updateEntryBackButtons();
}

function updateBackNavigationControls() {
  const pageBackButton = document.getElementById("pageBackBtn");
  if (!pageBackButton) return;
  const activeScreenId = getActiveScreenId();
  const isRootScreen = navigationRootScreens.has(activeScreenId);
  const hasEntryFallback = entryFallbackScreens.has(activeScreenId);
  const canGoBack = appRoot.classList.contains("is-entered") && !isRootScreen && (pageHistory.length > 0 || hasEntryFallback);
  pageBackButton.hidden = !canGoBack;
  pageBackButton.disabled = !canGoBack;
}

function rememberPageHistory(targetScreenId) {
  const currentScreenId = getActiveScreenId();
  if (!currentScreenId || currentScreenId === targetScreenId) return;
  if (navigationRootScreens.has(targetScreenId)) {
    pageHistory.length = 0;
    return;
  }
  const previousScreenId = pageHistory[pageHistory.length - 1];
  if (previousScreenId === targetScreenId) {
    pageHistory.pop();
    return;
  }
  pageHistory.push(currentScreenId);
}

function goBackPage() {
  const previousScreenId = pageHistory.pop();
  if (!previousScreenId) {
    if (entryFallbackScreens.has(getActiveScreenId())) {
      backToEntry();
      showEntryPanel("childEntryCard", { skipHistory: true });
    }
    return;
  }
  switchTab(previousScreenId, { skipHistory: true });
}

// 짧은 안내 문구를 화면 아래 toast로 보여줍니다.
function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("show");
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1500);
}

// 상세 화면에 들어가도 하단 메뉴에서는 대표 탭이 active로 보이게 묶어줍니다.
function getNavActiveTab(screenId) {
  if (appState.role === "parent") {
    const parentNavGroups = {
      parentInviteScreen: "parentScreen",
      parentHistoryScreen: "parentScreen",
      parentReviewScreen: "parentSubmissionsScreen",
      parentMissionsScreen: "parentMissionsScreen",
      parentMissionNewScreen: "parentMissionsScreen",
      parentMissionEditScreen: "parentMissionsScreen",
      parentMissionGradesScreen: "parentMissionsScreen",
      parentMissionAssignScreen: "parentMissionsScreen",
      parentChildScreen: "parentChildScreen",
      parentChildProgressScreen: "parentChildScreen",
      parentSubmissionsScreen: "parentSubmissionsScreen",
      parentSubmissionDetailScreen: "parentSubmissionsScreen",
      parentRewardConfirmScreen: "parentSubmissionsScreen",
      parentNotificationsScreen: "parentNotificationsScreen"
    };
    return parentNavGroups[screenId] || screenId;
  }
  if (appState.role !== "child") return screenId;
  const childNavGroups = {
    childMissionLowScreen: "childTodayMissionsScreen",
    childMissionMiddleScreen: "childTodayMissionsScreen",
    childMissionHighScreen: "childTodayMissionsScreen",
    childCameraScreen: "childTodayMissionsScreen",
    childSubmissionWaitingScreen: "childTodayMissionsScreen",
    childMissionResultScreen: "childTodayMissionsScreen",
    childRewardBoxScreen: "childInventoryScreen",
    childRewardOpenScreen: "childInventoryScreen",
    childExpResultScreen: "childInventoryScreen",
    childFrameScreen: "childInventoryScreen",
    childCharacterCreateScreen: "childInventoryScreen"
  };
  return childNavGroups[screenId] || screenId;
}

// 모든 screen을 숨긴 뒤 요청한 screen 하나만 보여주는 핵심 라우터입니다.
// 이 프로젝트는 SPA처럼 동작하지만, 아직 실제 URL 라우팅은 사용하지 않습니다.
function switchTab(screenId, options = {}) {
  if (!options.skipHistory) rememberPageHistory(screenId);
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.toggle("active", screen.id === screenId);
  });
  const activeTab = getNavActiveTab(screenId);
  document.querySelectorAll(".nav-btn").forEach(button => {
    button.classList.toggle("active", button.dataset.tab === activeTab);
  });
  const activeScreen = document.getElementById(screenId);
  if (!activeScreen) return;
  pageTitle.textContent = activeScreen.dataset.title;
  pageSubtitle.textContent = activeScreen.dataset.subtitle;
  if (screenId === "childCameraScreen") {
    setCaptureMode(appState.captureMode || "photo");
  } else {
    clearCaptureStreams();
  }
  if (screenId === "childSubmissionWaitingScreen") renderSubmissionWaiting();
  if (screenId === "parentSubmissionsScreen") renderParentSubmissions();
  if (screenId === "parentSubmissionDetailScreen") renderParentSubmissionDetail();
  if (screenId === "childCharacterCreateScreen") {
    renderCharacterOptions();
    renderCharacterPreview(pendingGeneratedCharacter || getGeneratedCharacter());
  }
  updateBackNavigationControls();
  requestAnimationFrame(() => {
    appRoot.scrollTop = 0;
    window.scrollTo(0, 0);
  });
}

// 아이 모드로 앱에 입장합니다. 실제 백엔드 연결 후에는 child 세션 확인 뒤 호출해야 합니다.
function enterChild(startScreenId = "homeScreen") {
  appState.role = "child";
  document.body.className = "child-mode";
  appRoot.classList.add("is-entered");
  configureNavForRole("child");
  pageHistory.length = 0;
  switchTab(startScreenId, { skipHistory: true });
  renderPet();
  renderMission();
  renderDex();
  renderProfile();
  renderMyPage();
}

// 부모 모드로 앱에 입장합니다. 실제 백엔드 연결 후에는 parent 세션 확인 뒤 호출해야 합니다.
function enterParent() {
  appState.role = "parent";
  document.body.className = "parent-mode";
  appRoot.classList.add("is-entered");
  configureNavForRole("parent");
  pageHistory.length = 0;
  switchTab("parentScreen", { skipHistory: true });
  renderMission();
  renderInvite();
  renderMyPage();
}

// 부모 회원가입 패널을 보여주는 작은 래퍼입니다.
function toggleParentJoin() {
  showEntryPanel("parentJoinCard");
  joinMessage.textContent = "";
  joinParentName?.focus();
}

// 부모 회원가입 임시 처리입니다.
// 나중에는 ParentJoinServlet에 POST하고, 성공 시 로그인 화면으로 이동시키면 됩니다.
function handleParentJoin() {
  const name = joinParentName?.value.trim() || "김보호자";
  const email = joinParentEmail?.value.trim() || "parent@test.com";
  const password = joinParentPassword?.value.trim() || "";
  const passwordCheck = joinParentPasswordCheck?.value.trim() || "";

  if (!email.includes("@")) {
    joinMessage.textContent = "이메일 형식을 확인해 주세요.";
    joinParentEmail?.focus();
    return;
  }

  if (password && passwordCheck && password !== passwordCheck) {
    joinMessage.textContent = "비밀번호 확인이 일치하지 않아요.";
    joinParentPasswordCheck?.focus();
    return;
  }

  appState.parent.name = name.slice(0, 10);
  appState.parent.email = email;

  const parentEmailInput = document.getElementById("parentEmail");
  const parentPasswordInput = document.getElementById("parentPassword");
  if (parentEmailInput) parentEmailInput.value = email;
  if (parentPasswordInput && password) parentPasswordInput.value = password;

  joinMessage.textContent = "가입 정보가 반영됐어요. 보호자 화면으로 이동합니다.";
  addHistory("parent", "보호자 회원가입", `${appState.parent.name} 계정이 생성됐어요.`);
  setTimeout(() => enterParent(), 350);
}

// 아이 초대코드 입력 임시 처리입니다.
// 나중에는 ChildInviteLoginServlet에 inviteCode를 보내고, 서버 응답에 따라 진입 화면을 정하면 됩니다.
function handleChildInvite() {
  const typedCode = childInviteInput.value.trim().toUpperCase();

  if (!typedCode) {
    inviteMessage.textContent = "초대코드를 입력해 주세요.";
    childInviteInput.focus();
    return;
  }

  const currentInviteCode = setCurrentInviteCode(typedCode);
  const savedCharacter = getGeneratedCharacter(currentInviteCode);
  childInviteInput.value = currentInviteCode;
  inviteMessage.textContent = "";
  if (!savedCharacter) resetCharacterCreateState();
  enterChild(savedCharacter ? "homeScreen" : "childCharacterCreateScreen");
}

function backToEntry() {
  appState.role = "guest";
  document.body.className = "";
  appRoot.classList.remove("is-entered");
  pageHistory.length = 0;
  closeProfileModal();
  updateBackNavigationControls();
}

function openProfileModal() {
  document.body.classList.add("profile-modal-open");
profileModal.classList.add("active");
  profileModal.setAttribute("aria-hidden", "false");

  // 1. 수정용 이미지 준비하기 (프로필 수정 모달에는 현재 캐릭터 원본 이미지를 올리는 단계)
  if (profilePhotoImage) {
    const editSource = getProfileEditImageSource();
    if (profilePhotoImage.getAttribute("src") !== editSource) {
      profilePhotoImage.src = editSource;
    }
  }

  // 2. 원 크롭 다시 계산하기 (모달을 연 직후 실제 화면 크기 기준으로 크롭을 적용하는 단계)
  renderProfile();
  requestAnimationFrame(() => {
    refreshProfileCropSelector();
    requestAnimationFrame(refreshProfileCropSelector);
  });
}

function closeProfileModal() {
  document.body.classList.remove("profile-modal-open");
profileModal.classList.remove("active");
  profileModal.setAttribute("aria-hidden", "true");
}
