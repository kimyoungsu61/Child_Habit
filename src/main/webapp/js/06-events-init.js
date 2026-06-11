// 버튼 클릭, 입력, 모달 닫기 같은 이벤트를 실제 함수와 연결하는 파일입니다.
// 주니어 개발자는 "어떤 버튼이 어떤 함수를 부르는지"를 알고 싶을 때 이 파일부터 보면 됩니다.
// 백엔드 연결 시에도 대부분 이 이벤트 안에서 callServlet(...)을 호출하게 됩니다.

// 시작 화면의 핵심 버튼들입니다. 지금은 임시 함수로 바로 화면을 전환합니다.
document.getElementById("childStartBtn").addEventListener("click", handleChildInvite);
document.getElementById("parentLoginBtn").addEventListener("click", enterParent);
document.getElementById("backToEntryBtn").addEventListener("click", backToEntry);
showParentJoinBtn?.addEventListener("click", toggleParentJoin);
parentJoinBtn?.addEventListener("click", handleParentJoin);

// 아이 프로필 생성 완료 버튼입니다.
// 현재는 nickname만 appState에 저장하지만, 나중에는 ChildSetupServlet에 저장 요청을 보내면 됩니다.
completeChildProfileBtn?.addEventListener("click", () => {
  const nickname = childNicknameInput?.value.trim() || "토리";
  appState.child.nickname = nickname.slice(0, 10);
  addHistory("profile", "아이 프로필 생성", `${appState.child.nickname} 프로필이 생성됐어요.`);
  renderProfile();
  renderMyPage();
  switchTab("homeScreen");
});

// 초대코드 입력칸에서 Enter를 눌러도 버튼 클릭과 같은 동작을 하게 합니다.
childInviteInput.addEventListener("keydown", event => {
  if (event.key === "Enter") handleChildInvite();
});

// 캐릭터 생성 옵션 버튼입니다. 선택값만 바꾸고, 실제 이미지는 생성 버튼에서 만듭니다.
document.querySelectorAll("[data-character-option]").forEach(button => {
  button.addEventListener("click", () => {
    const key = button.dataset.characterOption;
    selectedCharacterOptions[key] = button.dataset.value;
    pendingGeneratedCharacter = null;
    setCharacterCreateLoading(false);
    if (characterCreateMessage) characterCreateMessage.textContent = "";
    renderCharacterOptions();
    renderCharacterPreview(null);
  });
});

// 캐릭터 생성 버튼입니다.
// 현재는 기본 임시 이미지를 사용하지만, requestCharacterImage 안쪽을 서버 호출로 바꾸면 됩니다.
generateCharacterBtn?.addEventListener("click", async () => {
  const missingOptionMessage = getMissingCharacterOptionLabel(selectedCharacterOptions);
  if (missingOptionMessage) {
    if (characterCreateMessage) characterCreateMessage.textContent = missingOptionMessage;
    renderCharacterPreview(null);
    return;
  }

  if (characterCreateMessage) characterCreateMessage.textContent = "캐릭터를 생성하는 중이에요...";
  setCharacterCreateLoading(true);
  try {
    const result = await requestCharacterImage(selectedCharacterOptions);
    pendingGeneratedCharacter = {
      imageUrl: result.imageUrl,
      originalImageUrl: result.imageUrl,
      croppedImageUrl: "",
      gender: selectedCharacterOptions.gender,
      expression: selectedCharacterOptions.expression,
      background: selectedCharacterOptions.background,
      glasses: selectedCharacterOptions.glasses,
      prompt: result.prompt
    };
    renderCharacterPreview(pendingGeneratedCharacter);
    if (characterCreateMessage) characterCreateMessage.textContent = "캐릭터가 생성됐어요.";
  } catch (error) {
    if (characterCreateMessage) {
      characterCreateMessage.textContent = error.message || "캐릭터 생성에 실패했어요.";
    }
    renderCharacterPreview(null);
  } finally {
    setCharacterCreateLoading(false);
  }
});

// 생성된 캐릭터를 현재 아이 프로필로 확정합니다.
startWithCharacterBtn?.addEventListener("click", async () => {
  const currentInviteCode = getCurrentInviteCode();
  if (!currentInviteCode) {
    if (characterCreateMessage) characterCreateMessage.textContent = "초대코드를 먼저 입력해 주세요.";
    backToEntry();
    showEntryPanel("childEntryCard");
    return;
  }

  const characterData = pendingGeneratedCharacter || getGeneratedCharacter();
  if (!characterData) {
    if (characterCreateMessage) characterCreateMessage.textContent = "먼저 캐릭터를 생성해 주세요.";
    return;
  }

  if (characterCreateMessage) characterCreateMessage.textContent = "크롭 이미지를 저장하는 중이에요...";
  const originalImageUrl = characterData.originalImageUrl || characterData.imageUrl || mockCharacterImageUrl;
  let croppedImageUrl = characterData.croppedImageUrl || "";

  try {
    if (characterPreviewImage && characterPreviewImage.src) {
      await characterPreviewImage.decode?.();
      croppedImageUrl = createCroppedImageDataUrl(characterPreviewImage, { x: 50, y: 50, size: 1, outputSize: 512 }) || croppedImageUrl;
    }
  } catch (error) {
    croppedImageUrl = croppedImageUrl || originalImageUrl;
  }

  const savedCharacter = saveGeneratedCharacter(currentInviteCode, {
    ...characterData,
    imageUrl: originalImageUrl,
    originalImageUrl,
    croppedImageUrl: croppedImageUrl || originalImageUrl
  });

  if (!savedCharacter) {
    if (characterCreateMessage) characterCreateMessage.textContent = "초대코드별 캐릭터 저장에 실패했어요.";
    return;
  }
  renderCharacterPreview(savedCharacter);
  renderHomeProfileCharacter();
  addHistory("profile", "AI 캐릭터 생성", "선택한 AI 캐릭터가 프로필 프레임에 적용됐어요.");
  if (characterCreateMessage) characterCreateMessage.textContent = "캐릭터가 저장됐어요.";
  switchTab("homeScreen");
});

// 홈 화면의 펫 액션 버튼입니다. data-action 값으로 어떤 액션인지 구분합니다.
document.querySelectorAll("[data-action]").forEach(button => {
  button.addEventListener("click", () => handlePetAction(button.dataset.action));
});

// 하단 탭 메뉴입니다. 로그인 전에는 시작 화면으로 돌려보내고, 로그인 후에는 screen을 전환합니다.
document.querySelectorAll(".nav-btn").forEach(button => {
  button.addEventListener("click", () => {
    if (!appRoot.classList.contains("is-entered")) {
      showEntryPanel("entryStartCard");
      document.querySelectorAll(".nav-btn").forEach(navButton => {
        navButton.classList.toggle("active", navButton.dataset.tab === "homeScreen");
      });
      return;
    }
    switchTab(button.dataset.tab);
  });
});

// data-quick-tab 버튼은 화면 안쪽에서 다른 화면으로 빠르게 이동할 때 사용합니다.
function handleQuickTabButton(button) {
  const targetTab = button.dataset.quickTab;
  const missionMap = {
    childMissionLowScreen: "mission-low",
    childMissionMiddleScreen: "mission-middle",
    childMissionHighScreen: "mission-high"
  };
  if (missionMap[targetTab]) appState.currentMissionId = missionMap[targetTab];
  if (targetTab === "childCameraScreen") {
    appState.captureMode = "video";
  }
  if (button.dataset.submissionIndex) {
    appState.currentSubmission = appState.submissions[Number(button.dataset.submissionIndex)];
  }
  switchTab(targetTab);
}

// 처음 HTML에 존재하는 quick-tab 버튼을 연결합니다.
document.querySelectorAll("[data-quick-tab]").forEach(button => {
  button.dataset.quickBound = "true";
  button.addEventListener("click", () => handleQuickTabButton(button));
});

// renderParentSubmissions처럼 JS로 나중에 만든 버튼도 quick-tab이 동작하도록 이벤트 위임을 둡니다.
document.addEventListener("click", event => {
  const button = event.target.closest("[data-quick-tab]");
  if (!button || button.dataset.quickBound === "true") return;
  handleQuickTabButton(button);
});

// 시작 화면 안의 카드 전환 버튼입니다. 부모 로그인/회원가입/아이 초대코드 패널을 바꿉니다.
document.querySelectorAll("[data-entry-target]").forEach(button => {
  button.addEventListener("click", () => {
    showEntryPanel(button.dataset.entryTarget);
  });
});

// 촬영 방식을 영상/사진으로 전환하는 버튼입니다.
document.querySelectorAll("[data-capture-mode]").forEach(button => {
  button.addEventListener("click", () => setCaptureMode(button.dataset.captureMode));
});

cameraDeviceSelect?.addEventListener("change", event => {
  changeCameraDevice(event.target.value).catch(error => {
    setCaptureNotice(normalizeCameraError(error));
  });
});

refreshCameraDevicesBtn?.addEventListener("click", () => {
  refreshCameraDevices({ requestPermission: true })
    .then(devices => {
      setCaptureNotice(devices.length
        ? `${devices.length}개의 카메라를 찾았습니다.`
        : "연결된 카메라를 찾을 수 없습니다.");
    })
    .catch(error => setCaptureNotice(normalizeCameraError(error)));
});

navigator.mediaDevices?.addEventListener?.("devicechange", () => {
  refreshCameraDevices().catch(() => {});
});

takePhotoBtn?.addEventListener("click", () => {
  Promise.resolve(takePhoto()).catch(error => {
    const message = normalizeCameraError(error);
    if (cameraPermissionMessage) cameraPermissionMessage.textContent = message;
    if (capturePlaceholder) capturePlaceholder.textContent = `📷\n${message}`;
    updateCaptureSubmitState();
  });
});
retakePhotoBtn?.addEventListener("click", retakePhoto);

// 영상 녹화 임시 버튼입니다. 실제 녹화 파일은 아직 만들지 않고 상태만 바꿉니다.
startMockVideoBtn?.addEventListener("click", () => {
  appState.captureMode = "video";
  if (!isVideoRecording) {
    isVideoRecording = true;
    videoRecordingReady = false;
    childCaptureStage?.classList.remove("has-media");
    if (capturePlaceholder) capturePlaceholder.textContent = "🔴\n녹화 중이에요\n끝나면 녹화 종료를 눌러요";
    if (cameraPermissionMessage) cameraPermissionMessage.textContent = "녹화 중에는 제출할 수 없어요.";
    showToast("녹화를 시작했어요.");
  } else {
    isVideoRecording = false;
    videoRecordingReady = true;
    if (capturePlaceholder) capturePlaceholder.textContent = "✅\n영상 촬영 완료\n이제 인증 제출을 눌러요";
    if (cameraPermissionMessage) cameraPermissionMessage.textContent = "";
    childCaptureStage?.classList.add("has-media");
    showToast("녹화가 완료됐어요.");
  }
  updateCaptureSubmitState();
});

// 영상 녹화를 끝낸 것으로 처리합니다. 실제 파일 업로드는 MissionSubmitServlet 연결 때 추가합니다.
stopMockVideoBtn?.addEventListener("click", () => {
  if (!isVideoRecording) return;
  isVideoRecording = false;
  videoRecordingReady = true;
  if (capturePlaceholder) capturePlaceholder.textContent = "✅\n영상 촬영 완료\n이제 인증 제출을 눌러요";
  if (cameraPermissionMessage) cameraPermissionMessage.textContent = "";
  childCaptureStage?.classList.add("has-media");
  updateCaptureSubmitState();
  showToast("녹화가 완료됐어요.");
});
submitCaptureBtn?.addEventListener("click", submitCapture);

document.getElementById("goCertifyBtn")?.addEventListener("click", () => switchTab("certifyScreen"));
document.getElementById("profileOpenBtn").addEventListener("click", openProfileModal);

document.querySelectorAll("[data-verify-mode]").forEach(button => {
  button.addEventListener("click", () => {
    appState.missionMode = button.dataset.verifyMode;
    appState.missionStatus = "none";
    renderMission();
  });
});

document.getElementById("generateInviteBtn").addEventListener("click", () => {
  appState.inviteCode = createInviteCode();
  renderInvite();
  showToast("새 초대코드가 생성됐어요.");
});

[profileXRange, profileYRange, profileScaleRange].forEach(input => {
  if (!input) return;
  input.addEventListener("input", () => {
    appState.child.profile.x = Number(profileXRange.value);
    appState.child.profile.y = Number(profileYRange.value);
    appState.child.profile.scale = Number(profileScaleRange.value);
    renderProfile();
  });
});

if (profileCropView && profilePhotoImage) {
  profilePhotoImage.addEventListener("load", () => {
    // 1. 이미지 로드 후 크롭 재계산하기 (naturalWidth/naturalHeight가 생긴 뒤 원 크롭을 적용하는 단계)
    refreshProfileCropSelector();
    requestAnimationFrame(refreshProfileCropSelector);
  });

  profileCropView.addEventListener("wheel", event => {
    event.preventDefault();
    profileCropWasEdited = true;
    const nextScale = appState.child.profile.scale + (event.deltaY < 0 ? 6 : -6);
    appState.child.profile.scale = Math.max(90, Math.min(260, nextScale));
    refreshProfileCropSelector();
  }, { passive: false });

  profileSizeRange?.addEventListener("input", event => {
    setProfileSelectorSize(Number(event.currentTarget.value));
  });

  profileSizeDownBtn?.addEventListener("click", () => {
    setProfileSelectorSize(getProfileSelectorSize() - 4);
  });

  profileSizeUpBtn?.addEventListener("click", () => {
    setProfileSelectorSize(getProfileSelectorSize() + 4);
  });

  profileCropView.addEventListener("pointerdown", event => {
    profileCropView.setPointerCapture(event.pointerId);
    profileCropView.classList.add("dragging");
    profileDrag = { id: event.pointerId };
    queueProfileCropMove(event);
  });

  profileCropView.addEventListener("pointermove", event => {
    if (!profileDrag || profileDrag.id !== event.pointerId) return;
    queueProfileCropMove(event);
  });

  profileCropView.addEventListener("pointerup", () => {
    profileCropView.classList.remove("dragging");
    profileDrag = null;
  });

  profileCropView.addEventListener("pointercancel", () => {
    profileCropView.classList.remove("dragging");
    profileDrag = null;
  });

  profileCropView.addEventListener("lostpointercapture", () => {
    profileCropView.classList.remove("dragging");
    profileDrag = null;
  });
}

document.querySelectorAll("[data-close-modal]").forEach(element => {
  element.addEventListener("click", closeProfileModal);
});

recordBtn.addEventListener("click", () => {
  appState.missionStatus = "recording";
  renderMission();
  showToast(appState.missionMode === "photo" ? "사진을 촬영했어요." : "녹화를 시작했어요.");
});

submitBtn.addEventListener("click", () => {
  appState.missionStatus = "submitted";
  createSubmission(appState.missionMode === "photo" ? "photo" : "video");
  appState.rewardMessage = "보호자 확인을 기다리고 있어요.";
  addHistory("submitted", "습관 인증 제출", `${appState.missionMode === "photo" ? "사진" : "영상"} 인증을 보호자에게 보냈어요.`);
  renderMission();
  renderParentSubmissions();
  switchTab("rewardScreen");
  showToast(appState.missionMode === "photo" ? "사진 인증이 제출됐어요." : "영상 인증이 제출됐어요.");
});

document.querySelectorAll("[data-box]").forEach(button => {
  button.addEventListener("click", () => {
    const boxType = button.dataset.box;
    if (appState.rewardBoxCounts[boxType] <= 0) {
      showToast("보유한 상자가 없어요. 보호자 확인을 먼저 받아요.");
      return;
    }
    const [min, max] = rewardBoxes[boxType];
    const exp = Math.floor(min + Math.random() * (max - min + 1));
    appState.rewardBoxCounts[boxType] -= 1;
    addExp(exp);
    petDex[0].badgeAcquired = appState.pet.level >= 5;
    appState.rewardMessage = `${exp} EXP를 얻었어요. 몽글이가 더 반짝여요!`;
    addHistory("reward", "보상상자 오픈", `${exp} EXP를 획득했어요.`);
    renderMission();
    restartReactClass();
    playFrameSequence("magic", { loop: false, onComplete: resetPet });
    showToast(`${exp} EXP 획득!`);
  });
});

document.querySelectorAll("[data-filter]").forEach(button => {
  button.addEventListener("click", () => {
    appState.dexFilter = button.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach(filterButton => {
      filterButton.classList.toggle("active", filterButton === button);
    });
    renderDex();
  });
});

// 3. 클래스 초기화하기 (연속 클릭해도 애니메이션이 다시 실행되게 만드는 단계)
preloadFrameSequences();
loadSavedTheme();
bindThemeControls();
renderPet();
renderMission();
renderDex();
renderInvite();
renderProfile();
renderRewardCounts();
renderMyPage();
renderParentSubmissions();
renderSubmissionWaiting();
configureDefaultNav();
ensureBackNavigationControls();
showEntryPanel("entryStartCard");
setPetFrame("idle", 0);
playFrameSequence("idle", { loop: true });

// 인벤토리 카테고리 탭입니다.
// 1. 탭값 저장하기 (사용자가 선택한 보상함 카테고리를 상태에 저장하는 단계)
// 2. 화면 다시 그리기 (선택된 탭 패널만 보이게 갱신하는 단계)
document.querySelectorAll("[data-inventory-tab]").forEach(button => {
  button.addEventListener("click", () => {
    appState.selectedInventoryTab = button.dataset.inventoryTab || "boxes";
    renderInventoryTab();
  });
});

// 인벤토리의 리워드 상자 카드입니다.
// 1. 상자 종류 받기 (하급/중급/상급 중 어떤 상자를 눌렀는지 확인하는 단계)
// 2. 보유 수량 확인하기 (0개면 개봉 화면으로 보내지 않는 단계)
// 3. 개봉 화면 이동하기 (선택한 상자 정보를 화면에 반영하는 단계)
document.querySelectorAll("[data-open-box]").forEach(button => {
  button.addEventListener("click", () => {
    const boxType = button.dataset.openBox || "beginner";
    if ((appState.rewardBoxCounts[boxType] || 0) <= 0) {
      showToast("보유한 상자가 없어요. 미션 보상을 먼저 받아요.");
      return;
    }
    appState.selectedBoxType = boxType;
    prepareBoxOpenScreen(boxType);
    switchTab("childRewardOpenScreen");
  });
});

// 상자 개봉 버튼입니다.
// 1. 선택된 상자 확인하기 (인벤토리에서 선택한 상자 등급을 가져오는 단계)
// 2. 개봉 연출 실행하기 (현재는 CSS 애니메이션, 추후 영상 재생으로 교체할 단계)
// 3. 경험치 반영하기 (상자 수량 차감 후 펫 EXP를 올리는 단계)
document.getElementById("playBoxOpenBtn")?.addEventListener("click", openSelectedRewardBox);
