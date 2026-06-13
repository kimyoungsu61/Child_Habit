// 펫 애니메이션, 미션 상태 표시, 펫 도감 렌더링을 담당합니다.
// 지금은 버튼 클릭으로 appState를 직접 바꾸지만, 실제 서비스에서는
// PetStatusServlet, MissionListServlet, MissionDetailServlet, BoxOpenServlet 응답을 받아 그리면 됩니다.

let isPetActionRunning = false;

function setPetActionButtonsLocked(locked) {
  isPetActionRunning = locked;
  document.querySelectorAll("[data-action]").forEach(button => {
    button.disabled = locked;
    button.setAttribute("aria-disabled", String(locked));
  });
  document.querySelector(".pet-actions")?.setAttribute("aria-busy", String(locked));
}

function beginPetAction() {
  if (isPetActionRunning) return false;
  setPetActionButtonsLocked(true);
  return true;
}

function finishPetAction() {
  setPetActionButtonsLocked(false);
}

function normalizePetId(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "로아" || normalized === "roa") return "roa";
  if (normalized === "몽글" || normalized === "몽글이" || normalized === "mongle" || normalized === "tori" || normalized === "토리") {
    return "mongle";
  }
  return PET_FRAME_ROOTS[normalized] ? normalized : DEFAULT_PET_ID;
}

function activePetId() {
  const directId = normalizePetId(appState.pet?.id || "");
  if (directId !== DEFAULT_PET_ID || !appState.pet?.petId) return directId;
  const dexPet = petDex.find(pet => Number(pet.petId) === Number(appState.pet.petId))
    || petDex[Number(appState.pet.petId) - 1];
  return normalizePetId(dexPet?.id || appState.pet?.name);
}

function activePetFrameRoot() {
  return PET_FRAME_ROOTS[activePetId()] || PET_FRAME_ROOTS[DEFAULT_PET_ID];
}

function activePetAnimations() {
  return PET_ANIMATION_SETS[activePetId()] || DEFAULT_PET_ANIMATIONS;
}

function activePetHomeBackground(petId = activePetId()) {
  return PET_HOME_BACKGROUNDS[petId] || PET_HOME_BACKGROUNDS[DEFAULT_PET_ID];
}

function setPetHomeBackground(element, petId = activePetId()) {
  if (!element) return;
  element.style.setProperty("--pet-home-bg", `url("${activePetHomeBackground(petId)}")`);
}

function getAnimation(name) {
  const animations = activePetAnimations();
  return animations[name] || animations.idle || DEFAULT_PET_ANIMATIONS.idle;
}

// 애니메이션 프레임 파일 경로를 만듭니다.
// assets/pets/mongle/{animation}/frame_0001.webp 규칙을 한 곳에서 관리합니다.
function framePath(animationName, frameIndex) {
  const padded = String(frameIndex + 1).padStart(4, "0");
  const root = activePetFrameRoot();
  const animation = activePetAnimations()[animationName] ? animationName : "idle";
  return `${root}/${animation}/frame_${padded}.webp?v=${PET_FRAME_ASSET_VERSION}`;
}

// 현재 펫 이미지 한 장을 교체합니다.
// playFrameSequence가 이 함수를 반복 호출해서 움직이는 것처럼 보이게 합니다.
function setPetFrame(animationName, frameIndex) {
  petFrame.src = framePath(animationName, frameIndex);
  const dexPet = petDex.find(pet => pet.id === activePetId());
  if (dexPet?.name) petFrame.alt = dexPet.name;
}

// 같은 애니메이션을 연속 클릭해도 CSS animation이 다시 시작되도록 class를 뗐다 붙입니다.
function restartReactClass() {
  petFrame.classList.remove("reacting");
  void petFrame.offsetWidth;
  petFrame.classList.add("reacting");
  window.setTimeout(() => petFrame.classList.remove("reacting"), 190);
}

// 이전 requestAnimationFrame 루프를 끊어 중복 애니메이션을 막습니다.
function stopFrameAnimation() {
  frameRunId += 1;
  if (frameRaf) {
    cancelAnimationFrame(frameRaf);
    frameRaf = null;
  }
}

// webp 프레임을 순서대로 넘겨 보여주는 핵심 애니메이션 함수입니다.
// loop가 false인 액션은 끝난 뒤 idle 애니메이션으로 돌아갑니다.
function playFrameSequence(animationName, options = {}) {
  const animation = getAnimation(animationName);
  const loop = options.loop ?? animation.loop;
  const fps = Math.max(1, Number(animation.fps) || 12);
  const frames = Math.max(1, Number(animation.frames) || 1);
  const frameMs = 1000 / fps;
  let frameIndex = 0;
  let lastTime = performance.now();
  let elapsed = 0;
  const runId = frameRunId + 1;

  stopFrameAnimation();
  frameRunId = runId;
  setPetFrame(animationName, 0);

  const tick = now => {
    if (runId !== frameRunId) return;

    elapsed += now - lastTime;
    lastTime = now;

    while (elapsed >= frameMs) {
      elapsed -= frameMs;
      frameIndex += 1;

      if (frameIndex >= frames) {
        if (loop) {
          frameIndex = 0;
        } else {
          setPetFrame(animationName, frames - 1);
          frameRaf = null;
          if (typeof options.onComplete === "function") options.onComplete();
          return;
        }
      }
    }

    setPetFrame(animationName, frameIndex);
    frameRaf = requestAnimationFrame(tick);
  };

  frameRaf = requestAnimationFrame(tick);
}

// 자주 쓰는 프레임 이미지를 미리 로드해 첫 클릭 때 끊김을 줄입니다.
function preloadFrameSequences() {
  const petId = activePetId();
  cachedImages[petId] = {};
  Object.entries(activePetAnimations()).forEach(([animationName, animation]) => {
    cachedImages[petId][animationName] = [];
    for (let index = 0; index < animation.frames; index += 1) {
      const image = new Image();
      image.decoding = "async";
      image.src = framePath(animationName, index);
      cachedImages[petId][animationName].push(image);
    }
  });
}

// 서버/상태값용 영문 status를 화면에 보여줄 한글 문구로 바꿉니다.
function missionLabel(status) {
  const labels = {
    none: "대기",
    recording: "작성 중",
    submitted: "확인 대기",
    approved: "확인 완료",
    rejected: "다시 요청"
  };
  return labels[status] || labels.none;
}

function getThemeMeta(themeKey) {
  return APP_THEMES[themeKey] || APP_THEMES.default;
}

function applyTheme(themeKey, options = {}) {
  const normalizedKey = APP_THEMES[themeKey] ? themeKey : "default";
  const meta = getThemeMeta(normalizedKey);
  appState.theme = normalizedKey;
  document.body.dataset.theme = normalizedKey;
  if (themeLabel) themeLabel.textContent = meta.label;
  if (themeButton) themeButton.setAttribute("aria-label", `${meta.label} 테마 선택`);
  document.querySelectorAll("[data-theme-choice]").forEach(button => {
    const active = button.dataset.themeChoice === normalizedKey;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  if (options.persist) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, normalizedKey);
    } catch (error) {
      // localStorage가 막힌 환경에서는 현재 세션 테마만 적용한다.
    }
  }
}

function loadSavedTheme() {
  let savedTheme = "default";
  try {
    savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || "default";
  } catch (error) {
    savedTheme = "default";
  }
  applyTheme(savedTheme);
}

function openThemeModal() {
  if (!themeModal) return;
  applyTheme(appState.theme);
  themeModal.classList.add("active");
  themeModal.setAttribute("aria-hidden", "false");
}

function closeThemeModal() {
  if (!themeModal) return;
  themeModal.classList.remove("active");
  themeModal.setAttribute("aria-hidden", "true");
}

function bindThemeControls() {
  themeButton?.addEventListener("click", openThemeModal);
  document.querySelectorAll("[data-close-theme]").forEach(element => {
    element.addEventListener("click", closeThemeModal);
  });
  document.querySelectorAll("[data-theme-choice]").forEach(button => {
    button.addEventListener("click", () => {
      applyTheme(button.dataset.themeChoice, { persist: true });
      closeThemeModal();
      showToast(`${getThemeMeta(appState.theme).label} 테마를 적용했어요.`);
    });
  });
}

// EXP를 더하고, maxExp를 넘으면 레벨업시킵니다.
// 실제 서버 연결 후에는 서버에서 계산한 level/exp를 그대로 반영하는 편이 좋습니다.
function addExp(amount) {
  const levelBefore = appState.pet.level;
  const maxLevel = Math.max(1, Number(appState.pet.maxLevel) || 10);
  if (appState.pet.level >= maxLevel) {
    appState.pet.level = maxLevel;
    appState.pet.exp = appState.pet.maxExp;
    renderPet();
    return;
  }
  appState.pet.exp += amount;
  while (appState.pet.exp >= appState.pet.maxExp && appState.pet.level < maxLevel) {
    appState.pet.exp -= appState.pet.maxExp;
    appState.pet.level += 1;
    showToast(`${appState.pet.name}가 Lv.${appState.pet.level}로 성장했어요!`);
    createParticles("🌟", 14);
  }
  if (appState.pet.level >= maxLevel) {
    appState.pet.level = maxLevel;
    appState.pet.exp = appState.pet.maxExp;
  }
  if (appState.pet.level > levelBefore) {
    window.setTimeout(function () {
      if (typeof window.playSound === "function") window.playSound("levelUp");
    }, 300);
  }
  renderPet();
  renderDex();
  renderInventoryTab();
  renderMyPage();
  syncProfileFrames();
}

// 홈 화면의 펫 이름, 상태, EXP 바, 말풍선을 한 번에 다시 그립니다.
function renderPet() {
  const pet = appState.pet;
  const currentPetId = activePetId();
  const maxed = pet.level >= (Number(pet.maxLevel) || 10);
  const displayExp = maxed ? pet.maxExp : pet.exp;
  const percent = maxed ? 100 : Math.min(100, Math.round((displayExp / pet.maxExp) * 100));

  if (levelPill) levelPill.textContent = `Lv.${pet.level}`;
  if (petMeta) petMeta.textContent = `${pet.name} · Lv.${pet.level}`;
  if (themeLabel) themeLabel.textContent = getThemeMeta(appState.theme).label;
  petSpeech.textContent = `"${stateMeta.normal.dialogue}"`;
  expText.textContent = `EXP ${displayExp} / ${pet.maxExp}`;
  expPercent.textContent = `${percent}%`;
  expFill.style.width = `${percent}%`;
  petCard.className = `card pet-room state-${pet.state}${appState.child.dataReady ? "" : " pet-data-loading"}`;
  petCard.setAttribute("aria-busy", String(!appState.child.dataReady));
  petCard.dataset.petId = currentPetId;
  setPetHomeBackground(petCard, currentPetId);
  document.querySelectorAll(".pet-stage.profile-preview-frame-wrap").forEach(stage => {
    stage.dataset.petId = currentPetId;
    setPetHomeBackground(stage, currentPetId);
  });
  if (profilePetLevel) profilePetLevel.textContent = `Lv.${pet.level}`;
  if (profileMissionStatus) profileMissionStatus.textContent = missionLabel(appState.missionStatus);
  if (parentMissionSummary) parentMissionSummary.textContent = missionLabel(appState.missionStatus);
  if (parentBoxSummary) {
    const totalBoxes = Object.values(appState.rewardBoxCounts).reduce((sum, count) => sum + count, 0);
    parentBoxSummary.textContent = `${totalBoxes}개`;
  }
  if (parentChildCount && !window.__serverDashboardLoaded) {
    parentChildCount.textContent = "0명";
  }
  renderProfile();
  syncProfileFrames();
  renderMyPage();
  scheduleApplySavedProfileCropStyle();

  document.querySelectorAll("[data-action]").forEach(button => {
    button.classList.toggle("is-active", button.dataset.action === pet.activeAction);
  });
}

function resetPet() {
  appState.pet.state = "normal";
  appState.pet.activeAction = null;
  appState.pet.dialogue = stateMeta.normal.dialogue;
  renderPet();
  playFrameSequence("idle", { loop: true });
}

function handlePetAction(type, options = {}) {
  const action = actionMap[type];
  if (!action) {
    if (options.lockAlreadyAcquired) finishPetAction();
    return false;
  }
  if (!options.lockAlreadyAcquired && !beginPetAction()) return false;

  if (typeof window.playSound === "function") {
    window.playSound(type);
  }

  appState.pet.state = action.state;
  appState.pet.activeAction = type;
  appState.pet.dialogue = stateMeta.normal.dialogue;
  renderPet();
  restartReactClass();
  createParticles(action.effect, 9);
  if (action.toast) showToast(action.toast);
  if (options.addExperience !== false) addExp(action.exp);
  playFrameSequence(action.animation, {
    loop: false,
    onComplete: () => {
      resetPet();
      finishPetAction();
    }
  });
  return true;
}

function createParticles(symbol, count = 10) {
  effectLayer.innerHTML = "";
  for (let i = 0; i < count; i += 1) {
    const particle = document.createElement("span");
    particle.className = "particle";
    particle.textContent = symbol;
    particle.style.setProperty("--x", `${20 + Math.random() * 60}%`);
    particle.style.setProperty("--y", `${30 + Math.random() * 42}%`);
    particle.style.setProperty("--size", `${16 + Math.random() * 9}px`);
    particle.style.animationDelay = `${Math.random() * 0.14}s`;
    effectLayer.appendChild(particle);
  }
  setTimeout(() => {
    effectLayer.innerHTML = "";
  }, 980);
}

function setStatusBadge(element, status) {
  if (!element) return;
  element.className = "status-badge";
  if (status === "submitted" || status === "recording") element.classList.add("waiting");
  if (status === "approved") element.classList.add("approved");
  if (status === "rejected") element.classList.add("rejected");
  element.textContent = missionLabel(status);
}

// 미션 승인 상태와 보상 가능 여부를 화면에 반영합니다.
function renderMission() {
  setStatusBadge(reviewBadge, appState.missionStatus);
  setStatusBadge(rewardBadge, appState.missionStatus);
  const isPhotoMode = appState.missionMode === "photo";
  if (reviewMode) reviewMode.textContent = isPhotoMode ? "사진" : "영상";
  if (rewardMessage) rewardMessage.textContent = appState.rewardMessage;
  if (profileMissionStatus) profileMissionStatus.textContent = missionLabel(appState.missionStatus);
  if (parentMissionSummary) parentMissionSummary.textContent = missionLabel(appState.missionStatus);
  if (parentBoxSummary) {
    const totalBoxes = Object.values(appState.rewardBoxCounts).reduce((sum, count) => sum + count, 0);
    parentBoxSummary.textContent = `${totalBoxes}개`;
  }
  if (parentChildCount && !window.__serverDashboardLoaded) {
    parentChildCount.textContent = "0명";
  }
  recText.textContent = appState.missionStatus === "recording"
    ? (isPhotoMode ? "PHOTO 완료" : "REC 진행 중")
    : (isPhotoMode ? "PHOTO" : "REC 00:00");
  previewText.textContent = isPhotoMode ? "사진 미리보기" : "카메라 미리보기";
  recordBtn.textContent = isPhotoMode ? "사진 촬영" : "녹화 시작";
  cameraBox.classList.toggle("photo-mode", isPhotoMode);
  document.querySelectorAll("[data-verify-mode]").forEach(button => {
    button.classList.toggle("active", button.dataset.verifyMode === appState.missionMode);
  });
  renderRewardCounts();
  renderMyPage();
}

// 펫 도감 목록을 현재 필터 상태에 맞춰 다시 그립니다.
function renderDex() {
  const dexFilter = appState.dexFilter === "owned" ? "owned" : "all";
  appState.dexFilter = dexFilter;
  const filtered = petDex.filter(pet => {
    if (dexFilter === "owned") return pet.owned;
    return true;
  });

  if (!filtered.length) {
    petDexList.innerHTML = '<div class="empty-dex">아직 보유한 펫이 없어요.</div>';
    return;
  }

  petDexList.innerHTML = filtered.map(pet => {
    const active = pet.active || pet.id === activePetId();
    const owned = Boolean(pet.owned);
    const currentLevel = active ? Math.max(1, Number(appState.pet.level) || 1) : Number(pet.level) || 1;
    const levelText = owned ? `Lv.${currentLevel}` : "-";
    const imageSrc = pet.petImage || framePath("idle", 0);

    return `
      <article class="dex-card ${owned ? "owned" : "locked"}">
        <div class="dex-thumb">
          <img class="dex-image" src="${imageSrc}" alt="${owned ? pet.name : "미보유 펫 실루엣"}" />
          ${owned ? "" : `<img class="dex-lock-mark" src="${appPath("/assets/icons/pet-mystery-lock.svg")}" alt="" aria-hidden="true" />`}
        </div>
        <div class="dex-copy">
          <h3>${pet.name} <small>${pet.type}</small></h3>
          <p>${pet.description}</p>
          <div class="dex-meta">
            <span>획득 경로: ${pet.acquisitionType}</span>
            <span>현재 레벨: ${levelText}</span>
            <span>뱃지 상태: ${pet.badgeAcquired ? pet.badgeName : "뱃지 없음"}</span>
          </div>
          <div class="dex-badges">
            <span class="mini-badge ${owned ? "owned" : "locked"}">${owned ? "보유 중" : "미보유"}</span>
            ${active ? '<span class="mini-badge active">대표 펫</span>' : ""}
            <span class="mini-badge">${pet.badgeAcquired ? "뱃지 획득" : "뱃지 없음"}</span>
          </div>
          ${owned && !active ? `
            <button class="btn compact" type="button" data-select-pet="${pet.petId}">
              대표로 설정
            </button>
          ` : ""}
        </div>
      </article>
    `;
  }).join("");
}


