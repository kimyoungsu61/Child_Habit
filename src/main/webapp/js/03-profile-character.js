// 아이 프로필, 초대코드별 캐릭터 저장, 프로필 원형 크롭을 담당합니다.
// 현재는 localStorage에 저장하지만, 실제 서비스에서는 ChildSetupServlet이 저장하고
// ChildHomeServlet이 저장된 프로필/캐릭터 정보를 내려주는 구조가 좋습니다.

function getPetFrameLevel() {
  // 1. 현재 대표 펫 레벨 가져오기 (추후 여러 펫이 생기면 activePet.currentLevel 값으로 교체하는 단계)
  return Number(appState.pet?.level) || 1;
}

function isProfileFrameUnlocked(frameKey, level = getPetFrameLevel()) {
  // 2. 액자 해금 여부 계산하기 (모든 펫은 자신의 현재 레벨 기준으로 액자를 해금하는 단계)
  const frame = PROFILE_FRAMES[frameKey];
  if (!frame) return false;
  if (Number.isFinite(Number(frame.requiredBadgeCount))) {
    return Number(appState.profileFrameBadgeCount) >= Number(frame.requiredBadgeCount);
  }
  return level >= frame.unlockLevel;
}

function getProfileFrameByLevel(level) {
  // 3. 현재 레벨에서 사용할 수 있는 가장 높은 액자를 계산하기 (자동 적용용 임시 정책)
  const frames = Object.entries(PROFILE_FRAMES)
    .filter(([, frame]) => frame)
    .sort((a, b) => Number(b[1].requiredBadgeCount ?? b[1].unlockLevel ?? 0)
      - Number(a[1].requiredBadgeCount ?? a[1].unlockLevel ?? 0));
  const unlocked = frames.find(([key]) => isProfileFrameUnlocked(key, level));
  if (unlocked) return { key: unlocked[0], ...unlocked[1] };
  const firstFrame = frames[frames.length - 1];
  if (firstFrame) return { key: firstFrame[0], ...firstFrame[1] };
  return {
    key: "bronze",
    label: "동 액자",
    image: appPath("/assets/frames/frame-bronze.webp"),
    profileImage: profileFrameImageForKey("bronze"),
    frameId: 1,
    requiredBadgeCount: 0
  };
}

// 현재 펫 레벨에 맞는 프로필 프레임을 계산합니다.
function getCurrentProfileFrame() {
  const selectedKey = appState.selectedProfileFrameKey || "bronze";
  if (appState.selectedProfileFrameId != null) {
    const selectedById = Object.entries(PROFILE_FRAMES)
      .find(([, frame]) => Number(frame.frameId) === Number(appState.selectedProfileFrameId));
    if (selectedById && isProfileFrameUnlocked(selectedById[0])) {
      return { key: selectedById[0], ...selectedById[1] };
    }
  }
  if (isProfileFrameUnlocked(selectedKey)) {
    return { key: selectedKey, ...PROFILE_FRAMES[selectedKey] };
  }
  return getProfileFrameByLevel(getPetFrameLevel());
}

// 초대코드는 대소문자/공백이 섞일 수 있으므로 비교 전에 같은 형식으로 정리합니다.
function normalizeInviteCode(inviteCode) {
  return String(inviteCode || "").trim().toUpperCase();
}

// 한 브라우저에서 여러 초대코드를 테스트할 수 있도록 초대코드별 저장 key를 나눕니다.
function getCharacterStorageKey(inviteCode) {
  return `${GENERATED_CHARACTER_STORAGE_KEY}_${normalizeInviteCode(inviteCode)}`;
}

// 현재 아이가 입력한 초대코드를 localStorage에서 읽습니다.
function getCurrentInviteCode() {
  try {
    return normalizeInviteCode(localStorage.getItem(CURRENT_INVITE_CODE_STORAGE_KEY));
  } catch (error) {
    return "";
  }
}

// 초대코드를 저장해두면 새로고침 후에도 같은 캐릭터를 다시 찾을 수 있습니다.
function setCurrentInviteCode(inviteCode) {
  const normalizedCode = normalizeInviteCode(inviteCode);
  try {
    localStorage.setItem(CURRENT_INVITE_CODE_STORAGE_KEY, normalizedCode);
  } catch (error) {
    // localStorage가 막힌 환경에서는 현재 세션 상태만 사용한다.
  }
  return normalizedCode;
}

function getGeneratedCharacter(inviteCode = getCurrentInviteCode()) {
  const normalizedCode = normalizeInviteCode(inviteCode);
  if (!normalizedCode) return null;
  try {
    const rawCharacter = localStorage.getItem(getCharacterStorageKey(normalizedCode));
    if (!rawCharacter) return null;
    const character = JSON.parse(rawCharacter);
    const profileSource = character?.croppedImageUrl || character?.originalImageUrl || character?.imageUrl;
    if (!character || typeof profileSource !== "string") return null;
    return { ...character, inviteCode: character.inviteCode || normalizedCode };
  } catch (error) {
    return null;
  }
}

function getCharacterProfileImageSource(character) {
  return character?.croppedImageUrl
    || character?.originalImageUrl
    || character?.imageUrl
    || "";
}

function getHomeProfileImageSource() {
  const generatedCharacter = getGeneratedCharacter();
  return getCharacterProfileImageSource(generatedCharacter) || getSavedProfileImage() || DEFAULT_PROFILE_IMAGE;
}

function getProfileEditImageSource() {
  const generatedCharacter = getGeneratedCharacter();

  return generatedCharacter?.originalImageUrl
    || generatedCharacter?.imageUrl
    || getCharacterProfileImageSource(generatedCharacter)
    || getSavedProfileImage()
    || DEFAULT_PROFILE_IMAGE;
}

function getCharacterOptionLabels(options) {
  const labels = {
    expression: { smile: "웃음", focus: "집중", curious: "호기심" },
    background: { city: "도심", countryside: "시골", futureCity: "미래도시" },
    glasses: { wear: "착용", none: "미착용" }
  };
  return {
    expression: labels.expression[options.expression] || "",
    background: labels.background[options.background] || "",
    glasses: labels.glasses[options.glasses] || ""
  };
}

function getMissingCharacterOptionLabel(options) {
  if (!options.expression) return "표정을 선택해 주세요.";
  if (!options.background) return "배경을 선택해 주세요.";
  if (!options.glasses) return "안경 착용 여부를 선택해 주세요.";
  return "";
}

// 선택한 옵션을 이미지 생성용 문장으로 바꿉니다.
// 현재는 임시 이미지지만, 나중에 서버/Colab API에 이 prompt를 보낼 수 있습니다.
function buildCharacterPrompt(options) {
  const expressionPrompt = {
    smile: "smile, happy expression, bright smiling face",
    focus: "focused expression, serious attentive eyes, concentrating",
    curious: "curious expression, interested eyes, slightly surprised"
  };
  const backgroundPrompt = {
    city: "city background, urban street, soft pastel background",
    countryside: "countryside background, nature village, warm pastel background",
    futureCity: "futuristic city background, sci-fi city, soft neon pastel background"
  };
  const glassesPrompt = {
    wear: "wearing glasses",
    none: "no glasses"
  };

  return [
    "young korean child character",
    "upper body portrait",
    "front facing",
    "profile image",
    "one character only",
    "cute anime style",
    "clean face",
    "soft pastel colors",
    expressionPrompt[options.expression],
    backgroundPrompt[options.background],
    glassesPrompt[options.glasses]
  ].filter(Boolean).join(", ");
}

function renderCharacterSummary(characterData) {
  if (!characterSummary) return;
  if (!characterData) {
    characterSummary.hidden = true;
    characterSummary.innerHTML = "";
    return;
  }
  const labels = getCharacterOptionLabels(characterData);
  characterSummary.hidden = false;
  characterSummary.innerHTML = `
    <span>표정: ${labels.expression}</span>
    <span>배경: ${labels.background}</span>
    <span>안경: ${labels.glasses}</span>
  `;
}

async function requestCharacterImage(options) {
  const prompt = buildCharacterPrompt(options);
  await new Promise(resolve => setTimeout(resolve, 450));
  const variant = `${options.expression}-${options.glasses}`;
  return {
    imageUrl: appPath(`/assets/characters/avatar-${variant}.svg`),
    prompt
  };
}

function createCroppedImageDataUrl(imageElement, cropState = {}) {
  if (!imageElement?.complete || !imageElement.naturalWidth || !imageElement.naturalHeight) {
    return "";
  }

  const outputSize = Math.max(64, Number(cropState.outputSize) || 512);
  const cropScale = Math.max(0.1, Math.min(1, Number(cropState.size) || 1));
  const cropSize = Math.min(imageElement.naturalWidth, imageElement.naturalHeight) * cropScale;
  const centerX = (Number(cropState.x) || 50) / 100 * imageElement.naturalWidth;
  const centerY = (Number(cropState.y) || 50) / 100 * imageElement.naturalHeight;
  const sourceX = Math.max(0, Math.min(imageElement.naturalWidth - cropSize, centerX - cropSize / 2));
  const sourceY = Math.max(0, Math.min(imageElement.naturalHeight - cropSize, centerY - cropSize / 2));
  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const context = canvas.getContext("2d");

  context.clearRect(0, 0, outputSize, outputSize);
  context.save();
  context.beginPath();
  context.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
  context.clip();
  context.drawImage(imageElement, sourceX, sourceY, cropSize, cropSize, 0, 0, outputSize, outputSize);
  context.restore();

  return canvas.toDataURL("image/png");
}

// 생성된 캐릭터를 현재 초대코드에 묶어서 저장합니다.
// 서버 연결 전까지는 localStorage가 임시 DB 역할을 합니다.
function saveGeneratedCharacter(inviteCode, characterData) {
  const normalizedCode = normalizeInviteCode(inviteCode);
  if (!normalizedCode) return null;
  const savedData = {
    ...characterData,
    inviteCode: normalizedCode,
    createdAt: characterData.createdAt || new Date().toISOString()
  };
  try {
    localStorage.setItem(getCharacterStorageKey(normalizedCode), JSON.stringify(savedData));
  } catch (error) {
    // localStorage가 막힌 환경에서는 현재 세션 상태만 사용한다.
  }
  pendingGeneratedCharacter = savedData;
  return savedData;
}

// 캐릭터 생성 화면을 처음 상태로 되돌립니다.
function resetCharacterCreateState() {
  selectedCharacterOptions = {
    expression: null,
    background: null,
    glasses: null
  };
  pendingGeneratedCharacter = null;
  setCharacterCreateLoading(false);
  if (characterCreateMessage) characterCreateMessage.textContent = "";
  renderCharacterOptions();
  renderCharacterPreview(null);
}

// 다른 아이가 같은 브라우저를 쓸 때 이전 초대코드 캐릭터가 섞이지 않게 정리합니다.
function clearCurrentInviteCharacter() {
  const currentInviteCode = getCurrentInviteCode();
  if (!currentInviteCode) return false;
  try {
    localStorage.removeItem(getCharacterStorageKey(currentInviteCode));
  } catch (error) {
    return false;
  }
  pendingGeneratedCharacter = null;
  renderHomeProfileCharacter();
  return true;
}

window.clearCurrentInviteCharacter = clearCurrentInviteCharacter;

// 캐릭터 옵션 버튼의 active 상태를 현재 선택값과 맞춥니다.
function renderCharacterOptions() {
  document.querySelectorAll("[data-character-option]").forEach(button => {
    const key = button.dataset.characterOption;
    button.classList.toggle("active", selectedCharacterOptions[key] === button.dataset.value);
  });
}

// 생성된 캐릭터 미리보기와 선택 요약을 화면에 보여줍니다.
function setCharacterCreateLoading(isLoading) {
  const panel = document.querySelector(".character-create-panel");
  panel?.classList.toggle("is-generating", isLoading);

  if (generateCharacterBtn) {
    generateCharacterBtn.disabled = isLoading;
    generateCharacterBtn.setAttribute("aria-busy", isLoading ? "true" : "false");
  }

  document.querySelectorAll("[data-character-option]").forEach(button => {
    button.disabled = isLoading;
  });

  if (!characterPreview) return;
  characterPreview.classList.toggle("is-generating", isLoading);

  if (isLoading) {
    characterPreview.hidden = false;
    characterPreview.setAttribute("aria-busy", "true");
    if (characterPreviewImage) {
      characterPreviewImage.hidden = true;
      characterPreviewImage.removeAttribute("src");
    }
    return;
  }

  characterPreview.removeAttribute("aria-busy");
  if (characterPreviewImage) characterPreviewImage.hidden = false;
}

function renderCharacterPreview(characterData) {
  if (!characterPreview || !characterPreviewImage) return;
  const previewSource = getCharacterProfileImageSource(characterData);
  if (!previewSource) {
    characterPreview.hidden = true;
    characterPreview.classList.remove("is-generating");
    characterPreview.removeAttribute("aria-busy");
    characterPreviewImage.hidden = false;
    characterPreviewImage.removeAttribute("src");
    if (startWithCharacterBtn) startWithCharacterBtn.hidden = true;
    renderCharacterSummary(null);
    return;
  }
  characterPreview.hidden = false;
  characterPreview.classList.remove("is-generating");
  characterPreview.removeAttribute("aria-busy");
  characterPreviewImage.hidden = false;
  characterPreviewImage.src = previewSource;
  renderCharacterSummary(characterData);
  if (startWithCharacterBtn) startWithCharacterBtn.hidden = false;
}

// 홈/상단/마이페이지에 보이는 프로필 이미지를 현재 캐릭터 기준으로 동기화합니다.
function renderHomeProfileCharacter() {
  const source = getHomeProfileImageSource();
  document.querySelectorAll(".profile-avatar.profile-photo").forEach(avatar => {
    setDefaultProfileAvatar(avatar, source);
  });
  syncProfileFrames();
}

function profileFrameSourceForChild(frame = getCurrentProfileFrame()) {
  const source = frame.profileImage || profileFrameImageForKey(frame.key) || "";
  if (!source) return "";
  const version = [
    appState.child.childId || "guest",
    frame.frameId || frame.key || "frame"
  ].join("-");
  const separator = source.includes("?") ? "&" : "?";
  return `${source}${separator}v=${encodeURIComponent(version)}`;
}

function setPetHomeLoading(loading) {
  appState.child.dataReady = !loading;
  if (!petCard) return;
  petCard.classList.toggle("pet-data-loading", loading);
  petCard.setAttribute("aria-busy", String(loading));
  if (petLoadingState) {
    petLoadingState.toggleAttribute("aria-hidden", !loading);
  }
}

function clearProfilePreviewFrame() {
  const overlay = document.getElementById("profileFrameOverlay");
  if (!overlay) return;
  overlay.onload = null;
  overlay.onerror = null;
  overlay.hidden = true;
  overlay.removeAttribute("src");
  delete overlay.dataset.loadedSource;
}

function loadProfilePreviewFrame(frame = getCurrentProfileFrame()) {
  const overlay = document.getElementById("profileFrameOverlay");
  const source = profileFrameSourceForChild(frame);
  if (!overlay || !source) return Promise.resolve(false);

  overlay.hidden = true;
  overlay.dataset.frame = frame.key || "";
  overlay.title = frame.label || "";

  return new Promise(resolve => {
    let settled = false;
    const timeoutId = window.setTimeout(() => finish(false), 10000);
    const finish = loaded => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      overlay.onload = null;
      overlay.onerror = null;
      overlay.hidden = !loaded;
      if (loaded) overlay.dataset.loadedSource = source;
      resolve(loaded);
    };
    overlay.onload = () => finish(true);
    overlay.onerror = () => {
      overlay.removeAttribute("src");
      finish(false);
    };
    overlay.src = source;
    if (overlay.complete && overlay.naturalWidth > 0) finish(true);
  });
}

function syncProfilePreviewFrame(frame = getCurrentProfileFrame()) {
  const overlay = document.getElementById("profileFrameOverlay");
  if (!overlay) return;
  if (!appState.child.dataReady) {
    clearProfilePreviewFrame();
    return;
  }
  const profileImage = profileFrameSourceForChild(frame);
  if (!profileImage) {
    clearProfilePreviewFrame();
    return;
  }
  overlay.dataset.frame = frame.key || "bronze";
  overlay.title = frame.label || "";
  if (overlay.dataset.loadedSource === profileImage) {
    overlay.hidden = false;
    return;
  }
  loadProfilePreviewFrame(frame);
}

// 프로필 프레임 이미지를 현재 펫 레벨 기준으로 다시 입힙니다.
function syncProfileFrames() {
  const frame = getCurrentProfileFrame();
  document.querySelectorAll(".profile-avatar.profile-photo").forEach(avatar => {
    avatar.classList.add("profile-frame-wrap");
    avatar.dataset.frame = frame.key;
    avatar.setAttribute("title", frame.label);

    let frameImage = avatar.querySelector(".profile-avatar-frame");
    if (!frameImage) {
      frameImage = document.createElement("img");
      frameImage.className = "profile-avatar-frame profile-frame-img";
      frameImage.alt = "";
      frameImage.setAttribute("aria-hidden", "true");
      avatar.appendChild(frameImage);
    }
    frameImage.classList.add("profile-frame-img");
    frameImage.src = frame.image;
  });
  syncProfilePreviewFrame(frame);
}

// 프로필 모달, 마이페이지, 상단 아바타에 들어가는 정보를 다시 그립니다.
function renderProfile() {
  const initial = appState.child.nickname.slice(0, 1);
  document.querySelectorAll(".profile-avatar:not(.profile-photo)").forEach(avatar => {
    avatar.textContent = initial;
  });

  if (profileNickname) profileNickname.textContent = appState.child.nickname;
  if (profilePhotoImage) {
    const editSource = getProfileEditImageSource();
    profilePhotoImage.style.transform = "none";
    if (profilePhotoImage.getAttribute("src") !== editSource) {
      profilePhotoImage.src = editSource;
    }
  }

  refreshProfileCropSelector();
  syncProfileFrames();
  scheduleApplySavedProfileCropStyle();

  if (profileCropArt) {
    const profile = appState.child.profile;
    profileCropArt.style.setProperty("--profile-x", `${profile.x}%`);
    profileCropArt.style.setProperty("--profile-y", `${profile.y}%`);
    profileCropArt.style.setProperty("--profile-scale", `${profile.scale / 100}`);
    profileCropArt.querySelector("span").textContent = initial;
  }

  if (profileXRange) profileXRange.value = appState.child.profile.x;
  if (profileYRange) profileYRange.value = appState.child.profile.y;
  if (profileScaleRange) profileScaleRange.value = appState.child.profile.scale;
}

function clampProfileValue(value, min, max) {
  const number = Number(value);
  if (Number.isNaN(number)) return min;
  return Math.min(max, Math.max(min, number));
}

function getSavedProfileImage() {
  try {
    const savedProfileImage = localStorage.getItem(PROFILE_IMAGE_STORAGE_KEY);
    if (!savedProfileImage) return "";
    const source = savedProfileImage.trim();
    const isValidSource = source === DEFAULT_PROFILE_IMAGE
      || source.startsWith("data:image/")
      || source.startsWith("./assets/")
      || source.startsWith("assets/")
      || source.startsWith("/assets/")
      || source.startsWith(`${window.APP_CONTEXT || ""}/assets/`)
      || source.startsWith(`${window.APP_CONTEXT || ""}/media/`)
      || source.startsWith("https://")
      || source.startsWith("http://");
    return isValidSource && !source.includes("undefined") && !source.includes("NaN") ? source : "";
  } catch (error) {
    return "";
  }
}

function resetStoredProfileImage() {
  try {
    localStorage.removeItem(PROFILE_IMAGE_STORAGE_KEY);
  } catch (error) {
    // localStorage가 막힌 환경에서는 기본 이미지만 사용한다.
  }
}

function getAvatarImage(avatar) {
  avatar.classList.add("profile-frame-wrap");
  let cropInner = avatar.querySelector(".profile-avatar-inner");
  if (!cropInner) {
    avatar.textContent = "";
    avatar.style.backgroundImage = "none";
    cropInner = document.createElement("span");
    cropInner.className = "profile-avatar-inner profile-frame-mask";
    avatar.insertBefore(cropInner, avatar.firstChild);
  }
  cropInner.classList.add("profile-frame-mask");

  let avatarImage = cropInner.querySelector(".profile-avatar-crop");
  if (!avatarImage) {
    avatarImage = document.createElement("img");
    avatarImage.className = "profile-avatar-crop profile-character-img";
    avatarImage.alt = "";
    cropInner.appendChild(avatarImage);
  }
  avatarImage.classList.add("profile-character-img");
  return avatarImage;
}

function clearAvatarCropStyles(avatarImage) {
  avatarImage.style.removeProperty("--avatar-width");
  avatarImage.style.removeProperty("--avatar-height");
  avatarImage.style.removeProperty("--avatar-left");
  avatarImage.style.removeProperty("--avatar-top");
  avatarImage.style.left = "0";
  avatarImage.style.top = "0";
  avatarImage.style.width = "100%";
  avatarImage.style.height = "100%";
  avatarImage.style.objectFit = "cover";
}

function setDefaultProfileAvatar(avatar, source = DEFAULT_PROFILE_IMAGE) {
  const avatarImage = getAvatarImage(avatar);
  avatar.style.backgroundImage = "none";
  clearAvatarCropStyles(avatarImage);
  avatarImage.src = source || DEFAULT_PROFILE_IMAGE;
  avatarImage.onerror = () => {
    resetStoredProfileImage();
    avatarImage.onerror = null;
    clearAvatarCropStyles(avatarImage);
    avatarImage.src = source || DEFAULT_PROFILE_IMAGE;
  };
}

function hasSafeAvatarMetrics(values) {
  return values.every(value => Number.isFinite(value) && Math.abs(value) <= 10000);
}

function saveProfileCropStyle(cropStyle) {
  try {
    localStorage.setItem(PROFILE_CROP_STYLE_STORAGE_KEY, JSON.stringify(cropStyle));
  } catch (error) {
    // 1. 저장 실패 무시하기 (저장소 제한이 있어도 현재 화면 반영은 유지하는 단계)
  }
}

function getSavedProfileCropStyle() {
  try {
    const rawCropStyle = localStorage.getItem(PROFILE_CROP_STYLE_STORAGE_KEY);
    if (!rawCropStyle) return null;

    const cropStyle = JSON.parse(rawCropStyle);
    const values = [
      cropStyle.widthRatio,
      cropStyle.heightRatio,
      cropStyle.leftRatio,
      cropStyle.topRatio
    ];

    const isValidSource = typeof cropStyle.source === "string" && cropStyle.source.length > 0;
    if (!isValidSource || !hasSafeAvatarMetrics(values)) return null;

    return cropStyle;
  } catch (error) {
    return null;
  }
}

function applySavedProfileCropStyle() {
  const cropStyle = getSavedProfileCropStyle();
  if (!cropStyle) return false;

  const avatars = document.querySelectorAll(".profile-avatar.profile-photo");
  if (!avatars.length) return false;

  let applied = false;

  avatars.forEach(avatar => {
    const avatarRect = avatar.getBoundingClientRect();
    const avatarWidth = avatarRect.width || avatar.offsetWidth || avatar.clientWidth;

    if (!avatarWidth) return;

    const avatarImage = getAvatarImage(avatar);
    const avatarWidthValue = avatarWidth * cropStyle.widthRatio;
    const avatarHeightValue = avatarWidth * cropStyle.heightRatio;
    const avatarLeftValue = avatarWidth * cropStyle.leftRatio;
    const avatarTopValue = avatarWidth * cropStyle.topRatio;

    if (!hasSafeAvatarMetrics([avatarWidthValue, avatarHeightValue, avatarLeftValue, avatarTopValue])) {
      return;
    }

    avatar.style.backgroundImage = "none";
    avatarImage.src = cropStyle.source;
    avatarImage.onerror = () => setDefaultProfileAvatar(avatar, getHomeProfileImageSource());
    avatarImage.style.objectFit = "fill";
    avatarImage.style.setProperty("--avatar-width", `${avatarWidthValue}px`);
    avatarImage.style.setProperty("--avatar-height", `${avatarHeightValue}px`);
    avatarImage.style.setProperty("--avatar-left", `${avatarLeftValue}px`);
    avatarImage.style.setProperty("--avatar-top", `${avatarTopValue}px`);
    applied = true;
  });

  if (applied) syncProfileFrames();
  return applied;
}

function scheduleApplySavedProfileCropStyle() {
  // 1. 즉시 적용하기 (PC처럼 레이아웃이 바로 잡힌 환경에서 먼저 반영하는 단계)
  applySavedProfileCropStyle();

  // 2. 다음 프레임에 다시 적용하기 (모바일에서 주소창/하단바 때문에 크기가 늦게 잡히는 문제를 보정하는 단계)
  requestAnimationFrame(() => {
    applySavedProfileCropStyle();

    requestAnimationFrame(() => {
      applySavedProfileCropStyle();
    });
  });

  // 3. 지연 적용하기 (모바일 브라우저가 이미지/프레임 크기를 늦게 계산하는 경우를 보정하는 단계)
  window.setTimeout(applySavedProfileCropStyle, 80);
  window.setTimeout(applySavedProfileCropStyle, 180);
}

function getProfileSelectorSize() {
  const scale = clampProfileValue(appState.child.profile.scale / 100, 0.9, 2.6);
  const size = scale <= 1.7
    ? Math.round(92 - ((scale - 0.9) / 0.8) * 36)
    : Math.round(56 - ((scale - 1.7) / 0.9) * 22);
  return clampProfileValue(size, 34, 92);
}

function getProfileScaleFromSelectorSize(size) {
  const selectorSize = clampProfileValue(size, 34, 92);
  const scale = selectorSize >= 56
    ? 0.9 + ((92 - selectorSize) / 36) * 0.8
    : 1.7 + ((56 - selectorSize) / 22) * 0.9;
  return Math.round(clampProfileValue(scale, 0.9, 2.6) * 100);
}

function setProfileSelectorSize(size) {
  profileCropWasEdited = true;
  appState.child.profile.scale = getProfileScaleFromSelectorSize(size);
  refreshProfileCropSelector();
}

function getProfileCropBounds() {
  const viewRect = profileCropView?.getBoundingClientRect();
  const selectorSize = getProfileSelectorSize();
  if (!viewRect?.width || !viewRect?.height) {
    const fallbackRadius = selectorSize / 2;
    return {
      minX: fallbackRadius,
      maxX: 100 - fallbackRadius,
      minY: fallbackRadius,
      maxY: 100 - fallbackRadius
    };
  }

  const radius = ((selectorSize / 100) * viewRect.width) / 2;
  return {
    minX: (radius / viewRect.width) * 100,
    maxX: ((viewRect.width - radius) / viewRect.width) * 100,
    minY: (radius / viewRect.height) * 100,
    maxY: ((viewRect.height - radius) / viewRect.height) * 100
  };
}

function getBoundedProfilePoint(x, y) {
  const bounds = getProfileCropBounds();
  return {
    x: clampProfileValue(x ?? 50, bounds.minX, bounds.maxX),
    y: clampProfileValue(y ?? 50, bounds.minY, bounds.maxY)
  };
}

function refreshProfileCropSelector() {
  if (!profileCropSelector) return;
  const point = getBoundedProfilePoint(appState.child.profile.x, appState.child.profile.y);
  const size = getProfileSelectorSize();
  appState.child.profile.x = point.x;
  appState.child.profile.y = point.y;
  profileCropSelector.style.setProperty("--selector-x", `${point.x}%`);
  profileCropSelector.style.setProperty("--selector-y", `${point.y}%`);
  profileCropSelector.style.setProperty("--selector-size", `${size}%`);
  if (profileSizeRange) profileSizeRange.value = size;
  applyProfileAvatarCrop(point, size);
}

function applyProfileAvatarCrop(point, size) {
  const imageSource = profilePhotoImage?.currentSrc || profilePhotoImage?.src || getProfileEditImageSource();
  const imageWidth = profilePhotoImage?.naturalWidth || 512;
  const imageHeight = profilePhotoImage?.naturalHeight || 512;
  const viewRect = profileCropView?.getBoundingClientRect();
  const selectorRect = profileCropSelector?.getBoundingClientRect();
  const fallbackImage = getHomeProfileImageSource();

  // 1. 이미지 로딩 상태 확인하기 (프로필 수정 모달의 원본 이미지가 준비됐는지 확인하는 단계)
  if (!profilePhotoImage || !profilePhotoImage.complete || !profilePhotoImage.naturalWidth || !profilePhotoImage.naturalHeight) {
    document.querySelectorAll(".profile-avatar.profile-photo").forEach(avatar => {
      setDefaultProfileAvatar(avatar, fallbackImage);
    });
    return;
  }

  // 2. 크롭 기준 영역 확인하기 (원 선택 영역과 이미지 영역의 실제 크기를 가져오는 단계)
  if (!imageSource || !imageWidth || !imageHeight || !viewRect?.width || !viewRect?.height || !selectorRect?.width) {
    document.querySelectorAll(".profile-avatar.profile-photo").forEach(avatar => {
      setDefaultProfileAvatar(avatar, fallbackImage);
    });
    return;
  }

  // 3. object-fit: cover 기준 계산하기 (모달에서 보이는 이미지 위치와 크기를 계산하는 단계)
  const coverScale = Math.max(viewRect.width / imageWidth, viewRect.height / imageHeight);
  const renderedWidth = imageWidth * coverScale;
  const renderedHeight = imageHeight * coverScale;
  const imageLeft = (viewRect.width - renderedWidth) / 2;
  const imageTop = (viewRect.height - renderedHeight) / 2;
  const cropLeft = selectorRect.left - viewRect.left;
  const cropTop = selectorRect.top - viewRect.top;
  const cropSize = selectorRect.width;

  if (!hasSafeAvatarMetrics([coverScale, renderedWidth, renderedHeight, imageLeft, imageTop, cropLeft, cropTop, cropSize]) || cropSize <= 0) {
    document.querySelectorAll(".profile-avatar.profile-photo").forEach(avatar => {
      setDefaultProfileAvatar(avatar, fallbackImage);
    });
    return;
  }

  // 4. 크롭 비율 저장하기 (상호작용 후 모바일에서 재렌더링되어도 같은 크롭을 유지하는 단계)
  const cropStyle = {
    source: imageSource,
    widthRatio: renderedWidth / cropSize,
    heightRatio: renderedHeight / cropSize,
    leftRatio: (imageLeft - cropLeft) / cropSize,
    topRatio: (imageTop - cropTop) / cropSize
  };

  saveProfileCropStyle(cropStyle);

  // 5. 홈/마이페이지 프로필에 원 크롭 반영하기 (모바일 레이아웃 지연까지 고려해서 여러 번 적용하는 단계)
  scheduleApplySavedProfileCropStyle();
}

function updateProfileCrop(point) {
  profileCropWasEdited = true;
  const bounded = getBoundedProfilePoint(point.x, point.y);
  appState.child.profile.x = bounded.x;
  appState.child.profile.y = bounded.y;
  refreshProfileCropSelector();
}

function queueProfileCropMove(event) {
  if (!profileCropView) return;
  const cropViewRect = profileCropView.getBoundingClientRect();
  const selectorRect = profileCropSelector?.getBoundingClientRect();
  if (!cropViewRect.width || !cropViewRect.height || !selectorRect?.width) return;

  const radius = selectorRect.width / 2;
  let nextX = event.clientX - cropViewRect.left;
  let nextY = event.clientY - cropViewRect.top;

  nextX = clampProfileValue(nextX, radius, cropViewRect.width - radius);
  nextY = clampProfileValue(nextY, radius, cropViewRect.height - radius);

  pendingProfilePoint = {
    x: (nextX / cropViewRect.width) * 100,
    y: (nextY / cropViewRect.height) * 100
  };

  if (profileCropRaf) return;
  profileCropRaf = requestAnimationFrame(() => {
    updateProfileCrop(pendingProfilePoint);
    pendingProfilePoint = null;
    profileCropRaf = 0;
  });
}

// AI branch: local Jupyter Flask integration uses these normalized values.
function getCharacterOptionLabels(options) {
  const labels = {
    gender: { boy: "남자", girl: "여자" },
    expression: { smile: "행복", focus: "보통", curious: "신남" },
    background: { city: "도시", countryside: "공원", futureCity: "미래도시" },
    glasses: { wear: "안경 착용", none: "안경 미착용" }
  };
  return {
    gender: labels.gender[options.gender] || "",
    expression: labels.expression[options.expression] || "",
    background: labels.background[options.background] || "",
    glasses: labels.glasses[options.glasses] || ""
  };
}

function getMissingCharacterOptionLabel(options) {
  if (!options.gender) return "성별을 선택해 주세요.";
  if (!options.expression) return "표정을 선택해 주세요.";
  if (!options.background) return "배경을 선택해 주세요.";
  if (!options.glasses) return "안경 착용 여부를 선택해 주세요.";
  return "";
}

function buildCharacterPrompt(options) {
  const genderPrompt = {
    boy: "1boy, young korean boy, clearly male child",
    girl: "1girl, young korean girl, clearly female child"
  };
  const expressionPrompt = {
    smile: "happy child expression, joyful, cheerful, open mouth smile",
    focus: "neutral child expression, calm but alert, closed mouth",
    curious: "excited child expression, cheerful, lively, bright eyes"
  };
  const backgroundPrompt = {
    city: "city street, buildings, urban background, daylight",
    countryside: "park, trees, grass, flowers, sunlight",
    futureCity: "cyberpunk city, futuristic cityscape, neon lights"
  };
  const glassesPrompt = {
    wear: "glasses, round glasses, eyewear",
    none: "no glasses"
  };

  return [
    "masterpiece, best quality, anime artwork",
    "young korean child character",
    "lower elementary school student",
    "one child only, solo",
    "medium shot, head to waist visible",
    "front facing, looking at viewer, eyes open",
    "cute children app character style",
    genderPrompt[options.gender],
    expressionPrompt[options.expression],
    backgroundPrompt[options.background],
    glassesPrompt[options.glasses]
  ].filter(Boolean).join(", ");
}

async function requestCharacterImage(options) {
  const prompt = buildCharacterPrompt(options);
  const result = await apiRequest("/child/character/generate", {
    method: "POST",
    body: formData({
      gender: options.gender,
      userEmotion: options.expression,
      background: options.background,
      glasses: options.glasses,
      prompt
    })
  });
  const imageUrl = typeof appAssetUrl === "function"
    ? appAssetUrl(result.imageUrl)
    : result.imageUrl;
  return { ...result, imageUrl };
}

function resetCharacterCreateState() {
  selectedCharacterOptions = {
    gender: null,
    expression: null,
    background: null,
    glasses: null
  };
  pendingGeneratedCharacter = null;
  setCharacterCreateLoading(false);
  if (characterCreateMessage) characterCreateMessage.textContent = "";
  renderCharacterOptions();
  renderCharacterPreview(null);
}
