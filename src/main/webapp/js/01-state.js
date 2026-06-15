// 앱 전체에서 같이 쓰는 상수와 임시 상태를 모아둔 파일입니다.
// 현재는 서버가 완성되지 않았기 때문에 appState가 DB 응답 역할을 대신합니다.
// 백엔드 연결 후에는 ParentLoginServlet, ChildHomeServlet, MissionListServlet 등의 응답으로
// appState 초기값을 채우거나, 화면별 fetch 결과로 교체하면 됩니다.

const DEFAULT_PET_ID = "mongle";
const PET_FRAME_ASSET_VERSION = "roa-touch-play-magic-webp-20260614-1";
const PET_FRAME_ROOTS = {
  mongle: appPath("/assets/pets/mongle"),
  roa: appPath("/assets/pets/roa")
};
const PET_HOME_BACKGROUND_ASSET_VERSION = "pet-home-bg-20260613";
const PET_HOME_BACKGROUNDS = {
  mongle: appPath(`/assets/backgrounds/pet_home_bg.png?v=${PET_HOME_BACKGROUND_ASSET_VERSION}`),
  roa: appPath(`/assets/backgrounds/pet_home_bg_roa.png?v=${PET_HOME_BACKGROUND_ASSET_VERSION}`)
};
const DEFAULT_PET_ANIMATIONS = {
  idle: { frames: 121, fps: 24, loop: true },
  touch: { frames: 121, fps: 24, loop: false },
  praise: { frames: 121, fps: 24, loop: false },
  play: { frames: 121, fps: 24, loop: false },
  magic: { frames: 121, fps: 24, loop: false }
};
const PET_ANIMATION_SETS = {
  mongle: DEFAULT_PET_ANIMATIONS,
  roa: {
    idle: { frames: 121, fps: 24, loop: true },
    touch: { frames: 121, fps: 24, loop: false },
    praise: { frames: 121, fps: 24, loop: false },
    play: { frames: 121, fps: 24, loop: false },
    magic: { frames: 121, fps: 24, loop: false }
  }
};
const DEFAULT_PROFILE_IMAGE = appPath("/assets/images/profile.webp");
const PROFILE_IMAGE_STORAGE_KEY = "profileImage";
const PROFILE_CROP_STYLE_STORAGE_KEY = "profileCropStyle";
const GENERATED_CHARACTER_STORAGE_KEY = "generatedCharacter";
const CURRENT_INVITE_CODE_STORAGE_KEY = "currentInviteCode";
const THEME_STORAGE_KEY = "dduuttnnTheme";
const mockCharacterImageUrl = DEFAULT_PROFILE_IMAGE;
const PROFILE_FRAME_IMAGE_PATHS = {
  bronze: appPath("/assets/images/profile-frames/profile_frame_bronze.png"),
  silver: appPath("/assets/images/profile-frames/profile_frame_silver.png"),
  gold: appPath("/assets/images/profile-frames/profile_frame_gold.png"),
  crystal: appPath("/assets/images/profile-frames/profile_frame_crystal.png"),
  legend: appPath("/assets/images/profile-frames/profile_frame_legend.png"),
  aurora: appPath("/assets/images/profile-frames/profile_frame_aurora.png")
};

function profileFrameKeyAlias(frameKey = "") {
  const key = String(frameKey || "").toLowerCase();
  if (key === "wood") return "bronze";
  if (key === "iron") return "silver";
  return key || "bronze";
}

function profileFrameImageForKey(frameKey = "bronze") {
  return PROFILE_FRAME_IMAGE_PATHS[profileFrameKeyAlias(frameKey)] || PROFILE_FRAME_IMAGE_PATHS.bronze;
}

const PROFILE_FRAMES = {
  bronze: {
    frameId: 1,
    type: "bronze",
    label: "동 액자",
    image: appPath("/assets/frames/frame-bronze.webp"),
    profileImage: profileFrameImageForKey("bronze"),
    requiredBadgeCount: 0,
    unlockLevel: 0
  }
};
const APP_THEMES = {
  default: { label: "기본" },
  mint: { label: "민트" },
  sky: { label: "하늘" },
  peach: { label: "복숭아" },
  lavender: { label: "라벤더" }
};

// 화면에서 보여줄 모든 임시 데이터입니다.
// 주니어 개발자는 먼저 이 객체를 보면 "현재 앱이 어떤 상태값으로 움직이는지" 이해하기 쉽습니다.
const appState = {
  role: "guest",
  child: {
    childId: null,
    inviteCode: "",
    frameType: "",
    petType: "",
    dataReady: false,
    nickname: "토리",
    profile: {
      x: 50,
      y: 48,
      scale: 100
    }
  },
  parent: {
    name: "김보호자",
    email: "parent@test.com"
  },
  pet: {
    id: DEFAULT_PET_ID,
    name: "몽글",
    type: "별빛 마법 펫",
    level: 1,
    exp: 0,
    maxExp: 300,
    state: "normal",
    dialogue: "오늘은 어떤 좋은 습관을 만들어볼까?",
    activeAction: null
  },
  missionStatus: "none",
  missionMode: "video",
  rewardMessage: "보호자 확인이 완료되면 상자를 고를 수 있어요.",
  selectedInventoryTab: "boxes",
  selectedBoxType: "beginner",
  selectedProfileFrameKey: "bronze",
  selectedProfileFrameId: null,
  profileFrames: [],
  profileFrameBadgeCount: 0,
  theme: "default",
  lastRewardExp: 25,
  dexFilter: "all",

  currentMissionId: "mission-low",
  captureMode: "video",
  currentSubmission: null,
  submissions: [
    {
      missionId: "mission-low",
      childName: "유리",
      missionTitle: "양치하기",
      grade: "하급",
      mediaType: "video",
      status: "pending",
      submittedAt: "오늘 08:10"
    },
    {
      missionId: "mission-middle",
      childName: "민준",
      missionTitle: "책 읽기 10분",
      grade: "중급",
      mediaType: "photo",
      status: "pending",
      submittedAt: "오늘 18:20"
    }
  ],
  rewardBoxCounts: {
    beginner: 0,
    middle: 0,
    premium: 0,
    surprise: 0
  },
  histories: []
};

// 펫의 감정 상태별 화면 문구입니다.
// appState.pet.state 값이 normal/happy/proud 등으로 바뀌면 여기의 label/dialogue를 사용합니다.
const stateMeta = {
  normal: { label: "기본", dialogue: "오늘은 어떤 좋은 습관을 만들어볼까?" },
  happy: { label: "기분 좋음", dialogue: "쓰다듬어줘서 기분이 좋아졌어!" },
  proud: { label: "자신감", dialogue: "칭찬을 받으니까 더 해보고 싶어!" },
  cheerful: { label: "신남", dialogue: "같이 놀아서 마음이 반짝반짝해!" },
  magic: { label: "반짝", dialogue: "마법처럼 용기가 뿅 생겼어!" }
};

// 홈 화면의 펫 액션 버튼과 실제 변화값을 연결합니다.
// 예: data-action="touch" 버튼 클릭 -> happy 상태, touch 애니메이션, EXP +10.
const actionMap = {
  touch: { state: "happy", animation: "touch", exp: 10, effect: "🤍", toast: "쓰담쓰담!" },
  praise: { state: "proud", animation: "praise", exp: 15, effect: "⭐", toast: "잘했어!" },
  play: { state: "cheerful", animation: "play", exp: 10, effect: "🎈", toast: "같이 놀자!" },
  magic: { state: "magic", animation: "magic", exp: 20, effect: "🌟", toast: "마법 뿅!" }
};

// 보상 상자를 열었을 때 랜덤으로 받을 EXP 범위입니다.
// 실제 서버 연결 후에는 BoxOpenServlet에서 계산한 결과만 받아오는 편이 안전합니다.
const rewardBoxes = {
  beginner: [10, 30],
  middle: [30, 70],
  premium: [70, 150],
  surprise: [20, 60]
};

// 도감 화면에 보여줄 펫 목록입니다.
// 화면 순서와 이미지 경로는 기획/DB 기준의 펫, 뱃지 순서와 맞춰둡니다.
const petDex = [
  {
    id: "mongle",
    petId: 1,
    name: "몽글",
    type: "별빛 마법 펫",
    owned: true,
    active: true,
    acquisitionType: "기본 펫",
    level: 1,
    petImage: appPath("/assets/images/pets/pet_mongle.webp"),
    badgeImage: appPath("/assets/images/badges/badge_mongle.webp"),
    badgeName: "몽글 별빛 뱃지",
    badgeAcquired: false,
    description: "별빛을 모아 아이의 습관 성장을 응원하는 첫 번째 친구."
  },
  {
    id: "roa",
    petId: 2,
    name: "로아",
    type: "불꽃 용기 펫",
    owned: false,
    active: false,
    acquisitionType: "랜덤 상자",
    level: 1,
    petImage: appPath("/assets/images/pets/pet_roa.webp"),
    badgeImage: appPath("/assets/images/badges/badge_roa.webp"),
    badgeName: "로아 용기 뱃지",
    badgeAcquired: false,
    description: "작은 불꽃으로 아이의 안전과 용기를 따뜻하게 밝혀주는 친구."
  },
  {
    id: "haeon",
    petId: 3,
    name: "해온",
    type: "햇살 응원 펫",
    owned: false,
    active: false,
    acquisitionType: "랜덤 상자",
    level: 1,
    petImage: appPath("/assets/images/pets/pet_haeon.webp"),
    badgeImage: appPath("/assets/images/badges/badge_haeon.webp"),
    badgeName: "해온 햇살 뱃지",
    badgeAcquired: false,
    description: "따뜻한 햇살처럼 매일의 도전을 응원하는 친구."
  },
  {
    id: "nuri",
    petId: 4,
    name: "누리",
    type: "잎새 성장 펫",
    owned: false,
    active: false,
    acquisitionType: "랜덤 상자",
    level: 1,
    petImage: appPath("/assets/images/pets/pet_nuri.webp"),
    badgeImage: appPath("/assets/images/badges/badge_nuri.webp"),
    badgeName: "누리 잎새 뱃지",
    badgeAcquired: false,
    description: "작은 새싹처럼 천천히 자라는 마음을 함께 돌보는 친구."
  },
  {
    id: "aro",
    petId: 5,
    name: "아로",
    type: "물결 평온 펫",
    owned: false,
    active: false,
    acquisitionType: "랜덤 상자",
    level: 1,
    petImage: appPath("/assets/images/pets/pet_aro.webp"),
    badgeImage: appPath("/assets/images/badges/badge_aro.webp"),
    badgeName: "아로 물결 뱃지",
    badgeAcquired: false,
    description: "잔잔한 물결처럼 아이의 마음을 차분하게 감싸주는 친구."
  },
  {
    id: "pogeun",
    petId: 6,
    name: "포근",
    type: "하트 정서 펫",
    owned: false,
    active: false,
    acquisitionType: "랜덤 상자",
    level: 1,
    petImage: appPath("/assets/images/pets/pet_pogeun.webp"),
    badgeImage: appPath("/assets/images/badges/badge_pogeun.webp"),
    badgeName: "포근 하트 뱃지",
    badgeAcquired: false,
    description: "포근한 마음으로 아이의 감정을 다정하게 안아주는 친구."
  }
];

let frameRaf = null;
let frameRunId = 0;
let cachedImages = {};
let toastTimer = null;

// HTML 요소를 한 번만 찾아 변수에 담아둡니다.
// 아래 변수들은 다른 JS 파일에서도 그대로 사용하므로 script 로드 순서가 중요합니다.
const appRoot = document.getElementById("appRoot");
const pageTitle = document.getElementById("pageTitle");
const pageSubtitle = document.getElementById("pageSubtitle");
const petCard = document.getElementById("petCard");
const petFrame = document.getElementById("petFrame");
const petLoadingState = document.getElementById("petLoadingState");
const themeButton = document.getElementById("themeButton");
const themeLabel = document.getElementById("themeLabel");
const themeModal = document.getElementById("themeModal");
const petSpeech = document.getElementById("petSpeech");
const petMeta = document.getElementById("petMeta");
const expText = document.getElementById("expText");
const expPercent = document.getElementById("expPercent");
const expFill = document.getElementById("expFill");
const effectLayer = document.getElementById("effectLayer");
const levelPill = document.getElementById("levelPill");
const reviewBadge = document.getElementById("reviewBadge");
const rewardBadge = document.getElementById("rewardBadge");
const reviewMode = document.getElementById("reviewMode");
const rewardMessage = document.getElementById("rewardMessage");
const recordBtn = document.getElementById("recordBtn");
const submitBtn = document.getElementById("submitBtn");
const recText = document.getElementById("recText");
const previewText = document.getElementById("previewText");
const cameraBox = document.getElementById("cameraBox");
const toast = document.getElementById("toast");
const profileModal = document.getElementById("profileModal");
const profileNickname = document.getElementById("profileNickname");
const profilePetLevel = document.getElementById("profilePetLevel");
const profileMissionStatus = document.getElementById("profileMissionStatus");
const petDexList = document.getElementById("petDexList");
const inviteCodeText = document.getElementById("inviteCodeText");
const copyInviteCodeBtn = document.getElementById("copyInviteCodeBtn");
const parentNameText = document.getElementById("parentNameText");
const childInviteInput = document.getElementById("childInviteInput");
const childNicknameInput = document.getElementById("childNicknameInput");
const completeChildProfileBtn = document.getElementById("completeChildProfileBtn");
const childHistoryList = document.getElementById("childHistoryList");
const parentHistoryList = document.getElementById("parentHistoryList");
const parentChildList = document.getElementById("parentChildList");
const myNickname = document.getElementById("myNickname");
const myPetSummary = document.getElementById("myPetSummary");
const myExpText = document.getElementById("myExpText");
const myMissionStatus = document.getElementById("myMissionStatus");
const myBadgeText = document.getElementById("myBadgeText");
const profileCropArt = document.getElementById("profileCropArt");
const profileXRange = document.getElementById("profileXRange");
const profileYRange = document.getElementById("profileYRange");
const profileScaleRange = document.getElementById("profileScaleRange");
const inviteMessage = document.getElementById("inviteMessage");
const showParentJoinBtn = document.getElementById("showParentJoinBtn");
const parentJoinCard = document.getElementById("parentJoinCard");
const parentJoinBtn = document.getElementById("parentJoinBtn");
const parentLoginMessage = document.getElementById("parentLoginMessage");
const joinMessage = document.getElementById("joinMessage");
const joinParentName = document.getElementById("joinParentName");
const joinParentEmail = document.getElementById("joinParentEmail");
const joinParentPassword = document.getElementById("joinParentPassword");
const joinParentPasswordCheck = document.getElementById("joinParentPasswordCheck");
const parentChildCount = document.getElementById("parentChildCount");
const parentMissionSummary = document.getElementById("parentMissionSummary");
const parentBoxSummary = document.getElementById("parentBoxSummary");
const profileCropView = document.getElementById("profileCropView");
const profileCropSelector = document.getElementById("profileCropSelector");
const profilePhotoImage = document.getElementById("profilePhotoImage");
const profileSizeRange = document.getElementById("profileSizeRange");
const profileSizeDownBtn = document.getElementById("profileSizeDownBtn");
const profileSizeUpBtn = document.getElementById("profileSizeUpBtn");
const parentSubmissionList = document.getElementById("parentSubmissionList");
const parentSubmissionPreview = document.getElementById("parentSubmissionPreview");
const parentSubmissionChild = document.getElementById("parentSubmissionChild");
const parentSubmissionMediaType = document.getElementById("parentSubmissionMediaType");
const parentSubmissionGrade = document.getElementById("parentSubmissionGrade");
const submissionWaitingMessage = document.getElementById("submissionWaitingMessage");
const photoCameraPreview = document.getElementById("photoCameraPreview");
const photoCaptureCanvas = document.getElementById("photoCaptureCanvas");
const photoCapturePreview = document.getElementById("photoCapturePreview");
const childCaptureStage = document.getElementById("childCaptureStage");
const capturePlaceholder = document.getElementById("capturePlaceholder");
const captureModeIndicator = document.getElementById("captureModeIndicator");
const verifyModeIndicator = document.getElementById("verifyModeIndicator");
const cameraPermissionMessage = document.getElementById("cameraPermissionMessage");

function hidePhotoCapturePreview() {
  if (!photoCapturePreview) return;
  photoCapturePreview.hidden = true;
  photoCapturePreview.classList.remove("is-visible");
  photoCapturePreview.removeAttribute("src");
  photoCapturePreview.setAttribute("src", "");
  photoCapturePreview.alt = "";
  photoCapturePreview.style.setProperty("display", "none", "important");
}

function showPhotoCapturePreview(dataUrl) {
  if (!photoCapturePreview || !dataUrl) return;
  photoCapturePreview.src = dataUrl;
  photoCapturePreview.alt = "촬영된 사진 미리보기";
  photoCapturePreview.hidden = false;
  photoCapturePreview.classList.add("is-visible");
  photoCapturePreview.style.removeProperty("display");
}
const photoCaptureActions = document.getElementById("photoCaptureActions");
const videoCaptureActions = document.getElementById("videoCaptureActions");
const takePhotoBtn = document.getElementById("takePhotoBtn");
const retakePhotoBtn = document.getElementById("retakePhotoBtn");
const startMockVideoBtn = document.getElementById("startMockVideoBtn");
const stopMockVideoBtn = document.getElementById("stopMockVideoBtn");
const submitCaptureBtn = document.getElementById("submitCaptureBtn");
const cameraDeviceSelect = document.getElementById("cameraDeviceSelect");
const refreshCameraDevicesBtn = document.getElementById("refreshCameraDevicesBtn");
const generateCharacterBtn = document.getElementById("generateCharacterBtn");
const startWithCharacterBtn = document.getElementById("startWithCharacterBtn");
const characterCreateMessage = document.getElementById("characterCreateMessage");
const characterPreview = document.getElementById("characterPreview");
const characterPreviewImage = document.getElementById("characterPreviewImage");
const characterSummary = document.getElementById("characterSummary");
let profileDrag = null;
let profileCropRaf = 0;
let pendingProfilePoint = null;
let profileCropWasEdited = false;
let photoStream = null;
let capturedPhotoDataUrl = "";
let videoRecordingReady = false;
let isVideoRecording = false;
let discardVideoRecording = false;
let selectedCameraDeviceId = "";
let cameraSwipeStartX = 0;
let cameraSwipeStartY = 0;
let cameraSwipeStartTime = 0;
let cameraSwipePointerId = null;
let isSwitchingCameraBySwipe = false;
const CAMERA_MESSAGES = {
  permission: "카메라 권한을 허용해 주세요.",
  notFound: "카메라 장치를 찾을 수 없습니다.",
  unavailable: "카메라를 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.",
  notSupported: "이 브라우저에서는 카메라 촬영을 지원하지 않습니다."
};
const captureState = {
  mediaType: "video",
  isRecording: false,
  hasVideo: false,
  hasPhoto: false,
  stream: null,
  recorder: null
};
let selectedCharacterOptions = {
  gender: null,
  expression: null,
  background: null,
  glasses: null
};
let pendingGeneratedCharacter = null;
