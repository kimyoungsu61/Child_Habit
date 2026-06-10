// 앱 전체에서 같이 쓰는 상수와 임시 상태를 모아둔 파일입니다.
// 현재는 서버가 완성되지 않았기 때문에 appState가 DB 응답 역할을 대신합니다.
// 백엔드 연결 후에는 ParentLoginServlet, ChildHomeServlet, MissionListServlet 등의 응답으로
// appState 초기값을 채우거나, 화면별 fetch 결과로 교체하면 됩니다.

const PET_FRAME_ROOT = "./assets/pets/mongle";
const PET_ANIMATIONS = {
  idle: { frames: 121, fps: 24, loop: true },
  touch: { frames: 121, fps: 24, loop: false },
  praise: { frames: 121, fps: 24, loop: false },
  play: { frames: 121, fps: 24, loop: false },
  magic: { frames: 121, fps: 24, loop: false }
};
const DEFAULT_PROFILE_IMAGE = "./assets/images/profile.webp";
const PROFILE_IMAGE_STORAGE_KEY = "profileImage";
const PROFILE_CROP_STYLE_STORAGE_KEY = "profileCropStyle";
const GENERATED_CHARACTER_STORAGE_KEY = "generatedCharacter";
const CURRENT_INVITE_CODE_STORAGE_KEY = "currentInviteCode";
const mockCharacterImageUrl = DEFAULT_PROFILE_IMAGE;
const PROFILE_FRAMES = {
  bronze: { label: "동 액자", image: "./assets/frames/frame-bronze.webp", unlockLevel: 1 },
  silver: { label: "은 액자", image: "./assets/frames/frame-silver.webp", unlockLevel: 2 },
  gold: { label: "금 액자", image: "./assets/frames/frame-gold.webp", unlockLevel: 3 }
};

// 화면에서 보여줄 모든 임시 데이터입니다.
// 주니어 개발자는 먼저 이 객체를 보면 "현재 앱이 어떤 상태값으로 움직이는지" 이해하기 쉽습니다.
const appState = {
  role: "guest",
  child: {
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
    name: "몽글이",
    type: "구름 강아지",
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
  touch: { state: "happy", animation: "touch", exp: 10, effect: "🤍", dialogue: "쓰다듬어줘서 기분이 좋아졌어!" },
  praise: { state: "proud", animation: "praise", exp: 15, effect: "⭐", dialogue: "칭찬을 받으니까 더 해보고 싶어!" },
  play: { state: "cheerful", animation: "play", exp: 10, effect: "🎈", dialogue: "같이 놀아서 마음이 반짝반짝해!" },
  magic: { state: "magic", animation: "magic", exp: 20, effect: "🌟", dialogue: "마법처럼 용기가 뿅 생겼어!" }
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
// 현재는 기본 펫 1마리만 있지만, 추후 서버 응답 배열로 확장할 수 있습니다.
const petDex = [
  {
    id: "mongle",
    name: "몽글이",
    type: "구름 강아지",
    owned: true,
    active: true,
    acquisitionType: "기본 펫",
    badgeName: "첫 습관 뱃지",
    badgeAcquired: false,
    description: "좋은 습관을 실천할 때마다 함께 용기를 얻는 첫 번째 친구"
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
const stateChip = document.getElementById("stateChip");
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
  expression: null,
  background: null,
  glasses: null
};
let pendingGeneratedCharacter = null;
