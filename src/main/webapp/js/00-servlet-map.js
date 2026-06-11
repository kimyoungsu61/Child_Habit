// PDF에 정리된 Servlet 주소를 프론트에서 한눈에 보기 위한 지도입니다.
// 아직 서버를 실제로 호출하지는 않습니다.
// 백엔드 API가 준비되면 각 버튼/화면 로직에서 아래 값을 참고해 fetch를 연결하면 됩니다.

const SERVLET_ENDPOINTS = {
  // 로그인, 회원가입, 로그아웃처럼 "세션"을 만들거나 없애는 Servlet 모음입니다.
  auth: {
    entry: { servlet: "LoginServlet", method: "GET", url: "/login" },
    parentJoin: { servlet: "ParentJoinServlet", method: "GET/POST", url: "/join, /parent/join" },
    parentLogin: { servlet: "ParentLoginServlet", method: "GET/POST", url: "/parent/login" },
    logout: { servlet: "ParentLogoutServlet", method: "GET/POST", url: "/logout, /parent/logout" },
    childInviteLogin: { servlet: "ChildInviteLoginServlet", method: "GET/POST", url: "/child/login" }
  },
  // 부모가 아이를 초대하고, 기존 초대코드를 다시 발급하는 흐름입니다.
  invite: {
    create: { servlet: "ChildInviteCreateServlet", method: "GET/POST", url: "/parent/children/new, /parent/invites/create" },
    regenerate: { servlet: "InviteRegenerateServlet", method: "POST", url: "/parent/invite/regenerate" }
  },
  // 아이 초기 설정, 아이 홈, 현재 펫 상태를 가져오는 흐름입니다.
  child: {
    setup: { servlet: "ChildSetupServlet", method: "GET/POST", url: "/child/setup" },
    home: { servlet: "ChildHomeServlet", method: "GET", url: "/child/home" },
    petStatus: { servlet: "PetStatusServlet", method: "GET", url: "/child/pet/status" }
  },
  // 부모가 미션을 만들고, 아이가 미션을 보고 제출하는 흐름입니다.
  mission: {
    create: { servlet: "MissionCreateServlet", method: "GET/POST", url: "/parent/missions/create" },
    list: { servlet: "MissionListServlet", method: "GET", url: "/parent/missions, /child/missions" },
    detail: { servlet: "MissionDetailServlet", method: "GET", url: "/parent/missions/detail, /child/missions/detail" },
    submit: { servlet: "MissionSubmitServlet", method: "GET/POST", url: "/child/mission, /child/missions/submit" },
    media: { servlet: "MissionMediaServlet", method: "GET", url: "/media/submissions/*" }
  },
  // 부모가 아이의 사진/영상 제출물을 검토하는 흐름입니다.
  submission: {
    listAndReview: { servlet: "SubmissionListServlet", method: "GET/POST", url: "/parent/reviews, /parent/submissions" },
    approve: { servlet: "SubmissionApproveServlet", method: "POST", url: "/parent/submissions/approve" },
    reject: { servlet: "SubmissionRejectServlet", method: "POST", url: "/parent/submissions/reject" }
  },
  // 아이가 승인된 보상 상자를 여는 흐름입니다.
  reward: {
    openBox: { servlet: "BoxOpenServlet", method: "POST", url: "/child/boxes/open" }
  },
  // 부모 대시보드와 부모/아이 알림 목록을 가져오는 흐름입니다.
  dashboard: {
    parent: { servlet: "ParentDashboardServlet", method: "GET", url: "/parent/dashboard" },
    notifications: { servlet: "NotificationListServlet", method: "GET", url: "/parent/notifications, /child/notifications" }
  }
};

function getAppContextPath() {
  const root = document.getElementById("appRoot");
  return window.APP_CONTEXT
    || window.APP_CONTEXT_PATH
    || root?.dataset?.contextPath
    || "";
}

function appPath(path = "") {
  const value = String(path || "");
  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|data:|blob:)/i.test(value)) return value;
  const contextPath = getAppContextPath();
  if (!value) return contextPath || "/";
  return `${contextPath}${value.startsWith("/") ? value : `/${value}`}`;
}

window.APP_CONTEXT = getAppContextPath();
window.APP_CONTEXT_PATH = window.APP_CONTEXT;
window.appPath = appPath;

// 공통 요청 함수 초안입니다.
// 지금은 임시 화면 흐름을 유지해야 하므로 아직 호출하지 않습니다.
// 나중에는 callServlet(SERVLET_ENDPOINTS.mission.submit, formData)처럼 사용할 수 있습니다.
async function callServlet(endpoint, payload, options = {}) {
  const targetUrl = appPath(endpoint.url.split(",")[0].trim());
  const method = endpoint.method.includes("POST") && payload ? "POST" : "GET";
  return fetch(targetUrl, {
    method,
    body: payload,
    credentials: "include",
    ...options
  });
}
