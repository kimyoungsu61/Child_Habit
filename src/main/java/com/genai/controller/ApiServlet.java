package com.genai.controller;

import java.io.IOException;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.ServletException;
import javax.servlet.annotation.MultipartConfig;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import javax.servlet.http.Part;

import com.genai.model.ActivityRecord;
import com.genai.model.BoxOpenResult;
import com.genai.model.ChildMissionProgress;
import com.genai.model.ChildPet;
import com.genai.model.ChildProfile;
import com.genai.model.Mission;
import com.genai.model.MissionSubmission;
import com.genai.model.Notification;
import com.genai.model.Parent;
import com.genai.model.Pet;
import com.genai.model.PetInteractionCooldown;
import com.genai.model.PetInteractionResult;
import com.genai.model.ProfileFrame;
import com.genai.model.RewardInventoryItem;
import com.genai.service.AiImageGenerationResult;
import com.genai.service.AiImageService;
import com.genai.service.AdminDemoService;
import com.genai.service.ChildAccountService;
import com.genai.service.GameProfileService;
import com.genai.service.GeneratedImageStorage;
import com.genai.service.JoinResult;
import com.genai.service.MissionMediaStorage;
import com.genai.service.MissionService;
import com.genai.service.ParentService;
import com.genai.service.PersistentLoginService;
import com.genai.session.RememberCookies;
import com.genai.session.SessionKeys;
import com.google.gson.Gson;

@WebServlet("/api/*")
@MultipartConfig(
        fileSizeThreshold = 1024 * 1024,
        maxFileSize = 100L * 1024 * 1024,
        maxRequestSize = 120L * 1024 * 1024
)
public class ApiServlet extends HttpServlet {
    private final Gson gson = new Gson();
    private ParentService parentService;
    private ChildAccountService childAccountService;
    private GameProfileService gameProfileService;
    private MissionService missionService;
    private MissionMediaStorage mediaStorage;
    private PersistentLoginService persistentLoginService;
    private AiImageService aiImageService;
    private GeneratedImageStorage generatedImageStorage;
    private AdminDemoService adminDemoService;

    @Override
    public void init() {
        parentService = new ParentService();
        childAccountService = new ChildAccountService();
        gameProfileService = new GameProfileService();
        missionService = new MissionService();
        mediaStorage = new MissionMediaStorage();
        persistentLoginService = new PersistentLoginService();
        aiImageService = new AiImageService();
        generatedImageStorage = new GeneratedImageStorage();
        adminDemoService = new AdminDemoService();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        try {
            switch (path(request)) {
                case "/session" -> session(request, response);
                case "/parent/dashboard" -> parentDashboard(request, response);
                case "/child/home" -> childHome(request, response);
                case "/child/frames" -> childFrames(request, response);
                default -> error(response, HttpServletResponse.SC_NOT_FOUND,
                        "지원하지 않는 API입니다.");
            }
        } catch (RuntimeException exception) {
            getServletContext().log("GET API failed: " + path(request), exception);
            error(response, HttpServletResponse.SC_BAD_REQUEST, message(exception));
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws IOException, ServletException {
        request.setCharacterEncoding("UTF-8");
        try {
            String path = path(request);
            if ("/parent/join".equals(path)) {
                parentJoin(request, response);
            } else if ("/parent/login".equals(path)) {
                parentLogin(request, response);
            } else if ("/child/login".equals(path)) {
                childLogin(request, response);
            } else if ("/logout".equals(path)) {
                logout(request, response);
            } else if ("/parent/invites".equals(path)) {
                createInvite(request, response);
            } else if ("/parent/missions".equals(path)) {
                createMission(request, response);
            } else if (path.matches("/parent/missions/\\d+/update")) {
                updateMission(request, response, path);
            } else if (path.matches("/parent/missions/\\d+/cancel")) {
                cancelMission(request, response, path);
            } else if ("/parent/notifications/read".equals(path)) {
                markParentNotificationsRead(request, response);
            } else if ("/child/notifications/read".equals(path)) {
                markChildNotificationsRead(request, response);
            } else if ("/child/setup".equals(path)) {
                childSetup(request, response);
            } else if ("/child/character/generate".equals(path)) {
                generateChildCharacter(request, response);
            } else if ("/child/submissions".equals(path)) {
                submitMission(request, response);
            } else if (path.matches("/parent/submissions/\\d+/(approve|reject)")) {
                reviewSubmission(request, response, path);
            } else if (path.matches("/child/boxes/\\d+/open")) {
                openBox(request, response, path);
            } else if ("/child/pet/interactions".equals(path)) {
                interactWithPet(request, response);
            } else if ("/child/pet/active".equals(path)) {
                switchActivePet(request, response);
            } else if ("/child/profile/frame".equals(path)) {
                updateChildFrame(request, response);
            } else {
                error(response, HttpServletResponse.SC_NOT_FOUND,
                        "지원하지 않는 API입니다.");
            }
        } catch (Exception exception) {
            getServletContext().log("POST API failed: " + path(request), exception);
            error(response, HttpServletResponse.SC_BAD_REQUEST, message(exception));
        }
    }

    private void session(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        HttpSession session = request.getSession(false);
        Parent parent = session == null ? null
                : (Parent) session.getAttribute(SessionKeys.PARENT);
        ChildProfile child = session == null ? null
                : (ChildProfile) session.getAttribute(SessionKeys.CHILD);

        if (parent == null && child == null) {
            parent = persistentLoginService.restoreParent(
                    RememberCookies.read(request, RememberCookies.PARENT));
            if (parent != null) {
                createSession(request, SessionKeys.PARENT, parent);
            } else {
                child = persistentLoginService.restoreChild(
                        RememberCookies.read(request, RememberCookies.CHILD));
                if (child != null) {
                    createSession(request, SessionKeys.CHILD, child);
                }
            }
        }

        Map<String, Object> data = new LinkedHashMap<>();
        if (parent != null) {
            data.put("role", "parent");
            data.put("parent", parentMap(parent));
        } else if (child != null) {
            data.put("role", "child");
            data.put("child", childMap(child));
            data.put("setupComplete", isSetupComplete(child.getChildId()));
        } else {
            data.put("role", "guest");
        }
        success(response, data);
    }

    private void parentJoin(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        String email = value(request.getParameter("email"));
        String password = value(request.getParameter("password"));
        String name = value(request.getParameter("name"));
        if (email.isBlank() || name.isBlank() || password.length() < 8) {
            error(response, HttpServletResponse.SC_BAD_REQUEST,
                    "이름, 이메일, 8자 이상의 비밀번호를 입력해 주세요.");
            return;
        }
        JoinResult result = parentService.join(email, password, name);
        if (result == JoinResult.DUPLICATE_EMAIL) {
            error(response, HttpServletResponse.SC_CONFLICT, "이미 가입된 이메일입니다.");
            return;
        }
        success(response, Map.of("joined", true));
    }

    private void parentLogin(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        Parent parent = parentService.login(
                value(request.getParameter("email")),
                value(request.getParameter("password")));
        if (parent == null) {
            error(response, HttpServletResponse.SC_UNAUTHORIZED,
                    "이메일 또는 비밀번호가 올바르지 않습니다.");
            return;
        }
        createSession(request, SessionKeys.PARENT, parent);
        persistentLoginService.revoke(
                RememberCookies.read(request, RememberCookies.CHILD));
        RememberCookies.clear(request, response, RememberCookies.CHILD);
        replaceRememberCookie(request, response, RememberCookies.PARENT,
                persistentLoginService.issueParentToken(parent.getParentId()),
                PersistentLoginService.PARENT_MAX_AGE_SECONDS);
        success(response, Map.of("role", "parent", "parent", parentMap(parent)));
    }

    private void childLogin(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        String inviteCode = request.getParameter("inviteCode");
        ChildProfile child = adminDemoService.isAdminInviteCode(inviteCode)
                ? adminDemoService.findOrCreateAdminChild()
                : childAccountService.loginByInviteCode(inviteCode);
        if (child == null) {
            error(response, HttpServletResponse.SC_UNAUTHORIZED,
                    "유효하지 않은 초대코드입니다.");
            return;
        }
        createSession(request, SessionKeys.CHILD, child);
        persistentLoginService.revoke(
                RememberCookies.read(request, RememberCookies.PARENT));
        RememberCookies.clear(request, response, RememberCookies.PARENT);
        replaceRememberCookie(request, response, RememberCookies.CHILD,
                persistentLoginService.issueChildToken(child.getChildId()),
                PersistentLoginService.CHILD_MAX_AGE_SECONDS);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("role", "child");
        data.put("child", childMap(child));
        data.put("setupComplete", isSetupComplete(child.getChildId()));
        data.put("starterPets", petMaps(gameProfileService.findStarterPets()));
        success(response, data);
    }

    private void logout(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        HttpSession session = request.getSession(false);
        Parent parent = session == null ? null
                : (Parent) session.getAttribute(SessionKeys.PARENT);
        ChildProfile child = session == null ? null
                : (ChildProfile) session.getAttribute(SessionKeys.CHILD);
        if (adminDemoService.isAdminParent(parent)
                || adminDemoService.isAdminChild(child)) {
            // 5. admin 데모 상태 초기화하기 (로그아웃/서버 재시작 시 초기화)
            adminDemoService.resetAdminChildDemo();
        }
        persistentLoginService.revoke(
                RememberCookies.read(request, RememberCookies.PARENT));
        persistentLoginService.revoke(
                RememberCookies.read(request, RememberCookies.CHILD));
        RememberCookies.clear(request, response, RememberCookies.PARENT);
        RememberCookies.clear(request, response, RememberCookies.CHILD);
        if (session != null) {
            session.invalidate();
        }
        success(response, Map.of("loggedOut", true));
    }

    private void parentDashboard(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        Parent parent = requireParent(request, response);
        if (parent == null) {
            return;
        }
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("parent", parentMap(parent));
        data.put("children", childMaps(childAccountService.findChildren(parent.getParentId())));
        data.put("missions", missionMaps(
                missionService.findMissionsForParent(parent.getParentId())));
        data.put("submissions", submissionMaps(
                missionService.findPendingForParent(parent.getParentId())));
        data.put("todaySubmissions", submissionMaps(
                missionService.findTodayForParent(parent.getParentId())));
        data.put("availableRewards", submissionMaps(
                missionService.findAvailableRewardsForParent(parent.getParentId())));
        data.put("progress", progressMaps(
                missionService.findTodayProgressForParent(parent.getParentId())));
        data.put("notifications", notificationMaps(
                missionService.findNotificationsForParent(parent.getParentId())));
        success(response, data);
    }

    private void childHome(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        ChildProfile child = requireCurrentChild(request, response);
        if (child == null) {
            return;
        }
        ChildPet activePet = gameProfileService.findActivePet(child.getChildId());
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("child", childMap(child));
        data.put("setupComplete", child.getCharacterImageUrl() != null && activePet != null);
        data.put("activePet", activePet == null ? null : childPetMap(activePet));
        data.put("interactionCooldowns",
                interactionCooldownMap(
                        gameProfileService.findInteractionCooldowns(child.getChildId())));
        data.put("ownedPets", childPetMaps(gameProfileService.findOwnedPets(child.getChildId())));
        data.put("missions", missionMaps(missionService.findMissionsForChild(child.getChildId())
                .stream().limit(5).toList()));
        data.put("submissions", submissionMaps(
                missionService.findChildSubmissions(child.getChildId())));
        data.put("inventory", inventoryMaps(
                missionService.findRewardInventoryForChild(child.getChildId())));
        data.put("history", activityMaps(
                missionService.findActivityHistoryForChild(child.getChildId())));
        data.put("notifications", notificationMaps(
                missionService.findNotificationsForChild(child.getChildId())));
        data.put("serverDate", LocalDate.now().toString());
        success(response, data);
    }

    private void childFrames(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        ChildProfile child = requireCurrentChild(request, response);
        if (child == null) {
            return;
        }
        success(response, frameStateMap(child));
    }

    private void createInvite(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        Parent parent = requireParent(request, response);
        if (parent == null) {
            return;
        }
        ChildProfile child = childAccountService.createChildInviteSlot(parent.getParentId());
        success(response, Map.of("child", childMap(child)));
    }

    private void createMission(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        Parent parent = requireParent(request, response);
        if (parent == null) {
            return;
        }
        Long childId = parseLong(request.getParameter("childId"));
        ChildProfile child = childAccountService.findById(childId);
        if (child == null || !parent.getParentId().equals(child.getParentId())) {
            throw new IllegalArgumentException("연결된 아이를 선택해 주세요.");
        }
        missionService.createMission(parent.getParentId(), childId,
                request.getParameter("missionTitle"),
                request.getParameter("missionDescription"),
                request.getParameter("missionGrade"),
                request.getParameter("mediaType"));
        success(response, Map.of("created", true));
    }

    private void updateMission(HttpServletRequest request, HttpServletResponse response,
            String path) throws IOException {
        Parent parent = requireParent(request, response);
        if (parent == null) {
            return;
        }
        Long missionId = Long.valueOf(path.split("/")[3]);
        boolean updated = missionService.updateMission(
                missionId,
                parent.getParentId(),
                parseLong(request.getParameter("childId")),
                request.getParameter("missionTitle"),
                request.getParameter("missionDescription"),
                request.getParameter("missionGrade"),
                request.getParameter("mediaType"));
        if (!updated) {
            error(response, HttpServletResponse.SC_NOT_FOUND,
                    "수정할 미션을 찾을 수 없습니다.");
            return;
        }
        success(response, Map.of("updated", true));
    }

    private void cancelMission(HttpServletRequest request, HttpServletResponse response,
            String path) throws IOException {
        Parent parent = requireParent(request, response);
        if (parent == null) {
            return;
        }
        Long missionId = Long.valueOf(path.split("/")[3]);
        if (!missionService.deactivateMission(missionId, parent.getParentId())) {
            error(response, HttpServletResponse.SC_CONFLICT,
                    "오늘 완료된 미션은 취소할 수 없습니다.");
            return;
        }
        success(response, Map.of("deactivated", true));
    }

    private void markParentNotificationsRead(HttpServletRequest request,
            HttpServletResponse response) throws IOException {
        Parent parent = requireParent(request, response);
        if (parent == null) {
            return;
        }
        Long notificationId = parseLong(request.getParameter("notificationId"));
        int updated = notificationId == null
                ? missionService.markAllParentNotificationsRead(parent.getParentId())
                : (missionService.markParentNotificationRead(
                        notificationId, parent.getParentId()) ? 1 : 0);
        success(response, Map.of("updated", updated));
    }

    private void markChildNotificationsRead(HttpServletRequest request,
            HttpServletResponse response) throws IOException {
        ChildProfile child = requireChild(request, response);
        if (child == null) {
            return;
        }
        Long notificationId = parseLong(request.getParameter("notificationId"));
        int updated = notificationId == null
                ? missionService.markAllChildNotificationsRead(child.getChildId())
                : (missionService.markChildNotificationRead(
                        notificationId, child.getChildId()) ? 1 : 0);
        success(response, Map.of("updated", updated));
    }

    private void childSetup(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        ChildProfile child = requireChild(request, response);
        if (child == null) {
            return;
        }
        Long petId = parseLong(request.getParameter("petId"));
        if (petId == null) {
            List<Pet> starterPets = gameProfileService.findStarterPets();
            if (starterPets.isEmpty()) {
                throw new IllegalStateException("선택 가능한 기본 펫이 없습니다.");
            }
            petId = starterPets.get(0).getPetId();
        }
        String preset = value(request.getParameter("characterPreset"));
        String characterImageUrl = value(request.getParameter("characterImageUrl"));
        gameProfileService.completeInitialSetup(child.getChildId(),
                request.getParameter("nickname"),
                preset.isBlank() ? "forest" : preset,
                characterImageUrl,
                petId);
        ChildProfile refreshed = adminDemoService.isAdminChild(child)
                ? adminDemoService.prepareAdminChild(child.getChildId())
                : childAccountService.findById(child.getChildId());
        request.getSession(false).setAttribute(SessionKeys.CHILD, refreshed);
        success(response, Map.of("child", childMap(refreshed)));
    }

    private void generateChildCharacter(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        ChildProfile child = requireChild(request, response);
        if (child == null) {
            return;
        }
        Map<String, String> options = new LinkedHashMap<>();
        options.put("gender", value(request.getParameter("gender")));
        options.put("userEmotion", value(request.getParameter("userEmotion")));
        options.put("background", value(request.getParameter("background")));
        options.put("glasses", value(request.getParameter("glasses")));
        options.put("prompt", value(request.getParameter("prompt")));

        AiImageGenerationResult generated = aiImageService.generateCharacter(options);
        String imageUrl = generatedImageStorage.savePngBase64(generated.getImageBase64());

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("imageUrl", imageUrl);
        data.put("prompt", generated.getPrompt());
        if (generated.getSeed() != null) {
            data.put("seed", generated.getSeed());
        }
        success(response, data);
    }

    private void submitMission(HttpServletRequest request, HttpServletResponse response)
            throws IOException, ServletException {
        ChildProfile child = requireChild(request, response);
        if (child == null) {
            return;
        }
        if (!"true".equals(request.getHeader("X-Camera-Capture"))) {
            throw new IllegalArgumentException("미션 화면에서 직접 촬영해 주세요.");
        }
        Long missionId = parseLong(request.getParameter("missionId"));
        if (missionId == null) {
            throw new IllegalArgumentException("제출할 미션을 선택해 주세요.");
        }
        Mission mission = missionService.findMissionForChild(
                missionId, child.getChildId());
        if (mission == null) {
            throw new IllegalArgumentException("제출할 미션을 찾을 수 없습니다.");
        }
        String mediaType = request.getParameter("mediaType");
        String requiredMediaType = mission.getMediaType();
        if (!requiredMediaType.equals(mediaType)) {
            throw new IllegalArgumentException(
                    "미션의 인증 방식과 제출 파일 형식이 일치하지 않습니다.");
        }
        String mediaUrl = null;
        try {
            Part mediaFile = request.getPart("mediaFile");
            mediaUrl = mediaStorage.save(mediaFile, requiredMediaType);
            missionService.submit(child.getChildId(),
                    missionId, requiredMediaType, mediaUrl);
        } catch (Exception exception) {
            if (mediaUrl != null) {
                mediaStorage.deleteByUrl(mediaUrl);
            }
            throw exception;
        }
        success(response, Map.of("submitted", true));
    }

    private void reviewSubmission(HttpServletRequest request, HttpServletResponse response,
            String path) throws IOException {
        Parent parent = requireParent(request, response);
        if (parent == null) {
            return;
        }
        String[] parts = path.split("/");
        Long submissionId = Long.valueOf(parts[3]);
        boolean approve = "approve".equals(parts[4]);
        boolean reviewed = approve
                ? missionService.approve(submissionId, parent.getParentId(),
                        request.getParameter("boxGrade"))
                : missionService.reject(submissionId, parent.getParentId());
        if (!reviewed) {
            error(response, HttpServletResponse.SC_NOT_FOUND,
                    "처리할 제출물을 찾을 수 없습니다.");
            return;
        }
        success(response, Map.of("submissionId", submissionId,
                "status", approve ? "approved" : "rejected",
                "boxGrade", approve
                        ? valueOrEmpty(request.getParameter("boxGrade"))
                        : ""));
    }

    private void openBox(HttpServletRequest request, HttpServletResponse response,
            String path) throws IOException {
        ChildProfile child = requireChild(request, response);
        if (child == null) {
            return;
        }
        Long submissionId = Long.valueOf(path.split("/")[3]);
        BoxOpenResult result = adminDemoService.isAdminChild(child)
                && (submissionId == 0L || submissionId < 0L)
                ? missionService.openAdminDemoBox(
                        child.getChildId(), value(request.getParameter("boxGrade")))
                : missionService.openBox(child.getChildId(), submissionId);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("submissionId", result.getSubmissionId());
        data.put("boxGrade", result.getBoxGrade());
        data.put("expAmount", result.getExpAmount());
        data.put("currentLevel", result.getCurrentLevel());
        data.put("currentExp", result.getCurrentExp());
        success(response, data);
    }

    private void interactWithPet(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        ChildProfile child = requireChild(request, response);
        if (child == null) {
            return;
        }
        PetInteractionResult result = gameProfileService.interactWithPet(
                child.getChildId(), value(request.getParameter("action")));
        Map<String, Object> data = childPetMap(result.getActivePet());
        data.put("expGranted", result.isExpGranted());
        data.put("expAmount", result.getExpAmount());
        data.put("interactionCooldowns",
                interactionCooldownMap(result.getCooldowns()));
        data.put("ownedPets",
                childPetMaps(gameProfileService.findOwnedPets(child.getChildId())));
        success(response, data);
    }

    private void switchActivePet(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        ChildProfile child = requireChild(request, response);
        if (child == null) {
            return;
        }
        Long petId = parseLong(request.getParameter("petId"));
        ChildPet activePet = gameProfileService.switchActivePet(child.getChildId(), petId);
        Map<String, Object> data = childPetMap(activePet);
        data.put("interactionCooldowns",
                interactionCooldownMap(
                        gameProfileService.findInteractionCooldowns(child.getChildId())));
        data.put("ownedPets",
                childPetMaps(gameProfileService.findOwnedPets(child.getChildId())));
        success(response, data);
    }

    private void updateChildFrame(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        ChildProfile child = requireChild(request, response);
        if (child == null) {
            return;
        }

        // 1. 요청값 받기 (사용자가 선택한 액자 ID를 가져오는 단계)
        Long frameId = parseLong(request.getParameter("frameId"));
        if (frameId == null) {
            ProfileFrame frame = childAccountService.findFrameByType(
                    value(request.getParameter("frameType")));
            frameId = frame == null ? null : frame.getFrameId();
        }
        if (frameId == null) {
            throw new IllegalArgumentException("선택할 액자를 확인해 주세요.");
        }

        // 2. 해금 여부 확인하기 (현재 아이의 뱃지 개수로 선택 가능한 액자인지 확인하는 단계)
        ProfileFrame frame = childAccountService.findFrameById(frameId);
        if (frame == null) {
            throw new IllegalArgumentException("선택할 수 없는 액자입니다.");
        }
        int badgeCount = childAccountService.countApprovedSubmissions(child.getChildId());
        if (badgeCount < frame.getRequiredBadgeCount()) {
            throw new IllegalArgumentException(
                    "뱃지 " + frame.getRequiredBadgeCount() + "개부터 사용할 수 있는 액자입니다.");
        }

        // 3. 선택 액자 저장하기 (DB에 현재 사용 액자 ID를 저장하는 단계)
        ChildProfile updated = childAccountService.updateFrameById(child.getChildId(), frameId);
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.setAttribute(SessionKeys.CHILD, updated);
        }

        // 4. 결과 반환하기 (화면에서 선택 결과를 반영할 수 있도록 응답하는 단계)
        success(response, frameStateMap(updated));
    }

    private Parent requireParent(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        HttpSession session = request.getSession(false);
        Parent parent = session == null ? null
                : (Parent) session.getAttribute(SessionKeys.PARENT);
        if (parent == null) {
            error(response, HttpServletResponse.SC_UNAUTHORIZED, "부모 로그인이 필요합니다.");
        }
        return parent;
    }

    private ChildProfile requireChild(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        HttpSession session = request.getSession(false);
        ChildProfile child = session == null ? null
                : (ChildProfile) session.getAttribute(SessionKeys.CHILD);
        if (child == null) {
            error(response, HttpServletResponse.SC_UNAUTHORIZED, "아이 로그인이 필요합니다.");
        }
        return child;
    }

    private ChildProfile requireCurrentChild(HttpServletRequest request,
            HttpServletResponse response) throws IOException {
        ChildProfile loginChild = requireChild(request, response);
        if (loginChild == null) {
            return null;
        }
        ChildProfile child = childAccountService.findById(loginChild.getChildId());
        if (child == null) {
            HttpSession session = request.getSession(false);
            if (session != null) {
                session.invalidate();
            }
            persistentLoginService.revoke(
                    RememberCookies.read(request, RememberCookies.CHILD));
            RememberCookies.clear(request, response, RememberCookies.CHILD);
            error(response, HttpServletResponse.SC_UNAUTHORIZED,
                    "아이 로그인 정보가 만료되었습니다. 다시 로그인해 주세요.");
            return null;
        }
        createSession(request, SessionKeys.CHILD, child);
        return child;
    }

    private boolean isSetupComplete(Long childId) {
        ChildProfile child = childAccountService.findById(childId);
        return child != null && child.getCharacterImageUrl() != null
                && gameProfileService.findActivePet(childId) != null;
    }

    private void createSession(HttpServletRequest request, String key, Object value) {
        HttpSession oldSession = request.getSession(false);
        if (oldSession != null) {
            oldSession.invalidate();
        }
        HttpSession session = request.getSession(true);
        session.setAttribute(key, value);
        session.setMaxInactiveInterval(30 * 60);
    }

    private void replaceRememberCookie(HttpServletRequest request,
            HttpServletResponse response, String cookieName, String token, int maxAge) {
        String oldToken = RememberCookies.read(request, cookieName);
        persistentLoginService.revoke(oldToken);
        RememberCookies.add(request, response, cookieName, token, maxAge);
    }

    private String path(HttpServletRequest request) {
        String path = request.getPathInfo();
        return path == null || path.isBlank() ? "/" : path;
    }

    private void success(HttpServletResponse response, Object data) throws IOException {
        writeJson(response, HttpServletResponse.SC_OK,
                Map.of("success", true, "data", data));
    }

    private void error(HttpServletResponse response, int status, String message)
            throws IOException {
        writeJson(response, status,
                Map.of("success", false, "message", message));
    }

    private void writeJson(HttpServletResponse response, int status, Object body)
            throws IOException {
        response.setStatus(status);
        response.setCharacterEncoding("UTF-8");
        response.setContentType("application/json");
        response.setHeader("Cache-Control", "no-store");
        response.getWriter().write(gson.toJson(body));
    }

    private Map<String, Object> parentMap(Parent parent) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("parentId", parent.getParentId());
        map.put("email", parent.getEmail());
        map.put("name", parent.getName());
        return map;
    }

    private Map<String, Object> childMap(ChildProfile child) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("childId", child.getChildId());
        map.put("parentId", child.getParentId());
        map.put("nickname", child.getNickname());
        map.put("characterImageUrl", child.getCharacterImageUrl());
        map.put("characterLevel", child.getCharacterLevel());
        map.put("inviteCode", child.getInviteCode());
        map.put("frameId", child.getFrameId());
        map.put("frameType", child.getFrameType());
        map.put("adminDemoMode", adminDemoService.isAdminChild(child));
        return map;
    }

    private Map<String, Object> frameStateMap(ChildProfile child) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("child", childMap(child));
        data.put("frames", frameMaps(childAccountService.findFrames()));
        data.put("badgeCount", childAccountService.countApprovedSubmissions(child.getChildId()));
        data.put("currentFrameId", child.getFrameId());
        data.put("currentFrameType", child.getFrameType());
        return data;
    }

    private Map<String, Object> frameMap(ProfileFrame frame) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("frameId", frame.getFrameId());
        map.put("frameType", frame.getFrameType());
        map.put("frameName", frame.getFrameName());
        map.put("frameImageUrl", frame.getFrameImageUrl());
        map.put("requiredBadgeCount", frame.getRequiredBadgeCount());
        return map;
    }

    private Map<String, Object> missionMap(Mission mission) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("missionId", mission.getMissionId());
        map.put("childId", mission.getChildId());
        map.put("childNickname", mission.getChildNickname());
        map.put("title", mission.getMissionTitle());
        map.put("description", mission.getMissionDescription());
        map.put("grade", mission.getMissionGrade());
        map.put("mediaType", mission.getMediaType());
        return map;
    }

    private Map<String, Object> submissionMap(MissionSubmission submission) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("submissionId", submission.getSubmissionId());
        map.put("missionId", submission.getMissionId());
        map.put("childId", submission.getChildId());
        map.put("childNickname", submission.getChildNickname());
        map.put("boxGrade", submission.getBoxGrade());
        map.put("mediaType", submission.getMediaType());
        map.put("mediaUrl", submission.getMediaUrl());
        map.put("status", submission.getStatus());
        map.put("missionDate", submission.getMissionDate() == null
                ? ""
                : submission.getMissionDate().toString());
        map.put("submittedAt", string(submission.getSubmittedAt()));
        map.put("reviewedAt", string(submission.getReviewedAt()));
        map.put("rewardGiven", submission.getRewardGiven());
        return map;
    }

    private String valueOrEmpty(String value) {
        return value == null ? "" : value;
    }

    private Map<String, Object> childPetMap(ChildPet childPet) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("childPetId", childPet.getChildPetId());
        map.put("petId", childPet.getPetId());
        map.put("currentLevel", childPet.getCurrentLevel());
        map.put("currentExp", childPet.getCurrentExp());
        map.put("isMaxed", childPet.getIsMaxed());
        map.put("badgeAcquired", childPet.getBadgeAcquired());
        if (childPet.getPet() != null) {
            map.put("pet", petMap(childPet.getPet()));
        }
        return map;
    }

    private Map<String, Long> interactionCooldownMap(
            List<PetInteractionCooldown> cooldowns) {
        Map<String, Long> map = new LinkedHashMap<>();
        ZoneId zone = ZoneId.of("Asia/Seoul");
        for (PetInteractionCooldown cooldown : cooldowns) {
            if (cooldown.getActionType() == null
                    || cooldown.getLastRewardedAt() == null) {
                continue;
            }
            long cooldownEndsAt = cooldown.getLastRewardedAt()
                    .plusMinutes(30)
                    .atZone(zone)
                    .toInstant()
                    .toEpochMilli();
            map.put(cooldown.getActionType(), cooldownEndsAt);
        }
        return map;
    }

    private List<Map<String, Object>> childPetMaps(List<ChildPet> childPets) {
        return childPets.stream().map(this::childPetMap).toList();
    }

    private Map<String, Object> petMap(Pet pet) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("petId", pet.getPetId());
        map.put("name", pet.getDisplayName());
        map.put("imageUrl", pet.getPetImageUrl());
        map.put("maxLevel", pet.getMaxLevel());
        map.put("badgeName", pet.getBadgeName());
        map.put("badgeImageUrl", pet.getBadgeImageUrl());
        return map;
    }

    private List<Map<String, Object>> childMaps(List<ChildProfile> children) {
        return children.stream().map(this::childMap).toList();
    }

    private List<Map<String, Object>> frameMaps(List<ProfileFrame> frames) {
        return frames.stream().map(this::frameMap).toList();
    }

    private List<Map<String, Object>> missionMaps(List<Mission> missions) {
        return missions.stream().map(this::missionMap).toList();
    }

    private List<Map<String, Object>> submissionMaps(List<MissionSubmission> submissions) {
        return submissions.stream().map(this::submissionMap).toList();
    }

    private List<Map<String, Object>> petMaps(List<Pet> pets) {
        return pets.stream().map(this::petMap).toList();
    }

    private List<Map<String, Object>> inventoryMaps(List<RewardInventoryItem> items) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (RewardInventoryItem item : items) {
            result.add(Map.of("boxGrade", item.getBoxGrade(),
                    "boxName", item.getBoxName(), "quantity", item.getQuantity()));
        }
        return result;
    }

    private List<Map<String, Object>> progressMaps(List<ChildMissionProgress> items) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (ChildMissionProgress item : items) {
            result.add(Map.of("childId", item.getChildId(),
                    "childNickname", item.getChildNickname(),
                    "assignedCount", item.getAssignedCount(),
                    "dailyLimit", item.getDailyLimit(),
                    "assignmentRemainingCount", item.getAssignmentRemainingCount(),
                    "pendingCount", item.getPendingCount(),
                    "approvedCount", item.getApprovedCount(),
                    "rejectedCount", item.getRejectedCount()));
        }
        return result;
    }

    private List<Map<String, Object>> notificationMaps(List<Notification> notifications) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Notification item : notifications) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("notificationId", item.getNotificationId());
            map.put("type", item.getNotificationType());
            map.put("missionId", item.getMissionId());
            map.put("submissionId", item.getSubmissionId());
            map.put("rewardId", item.getRewardId());
            map.put("title", notificationTitle(item));
            map.put("content", notificationContent(item));
            map.put("isRead", item.getIsRead());
            map.put("createdAt", string(item.getCreatedAt()));
            result.add(map);
        }
        return result;
    }

    private String notificationTitle(Notification notification) {
        return switch (notification.getNotificationType()) {
            case "mission_assigned" -> "새 미션이 도착했어요";
            case "reward_request" -> "새 인증이 도착했어요";
            case "mission_approved" -> "미션이 승인되었어요";
            case "mission_rejected" -> "인증을 다시 제출해 주세요";
            case "reward_paid" -> storedOrDefault(
                    notification.getTitle(), "보상 상자를 열었어요");
            default -> notification.getTitle();
        };
    }

    private String notificationContent(Notification notification) {
        return switch (notification.getNotificationType()) {
            case "mission_assigned" -> "보호자가 새로운 미션을 배정했어요.";
            case "reward_request" -> "아이가 미션 인증을 제출했어요. 확인해 주세요.";
            case "mission_approved" -> "보호자가 미션을 승인했어요. 보상함에서 상자를 확인해 주세요.";
            case "mission_rejected" -> "보호자가 인증을 다시 요청했어요. 미션 인증을 다시 제출해 주세요.";
            case "reward_paid" -> storedOrDefault(
                    notification.getContent(), "보상 상자를 열어 경험치를 획득했어요.");
            default -> notification.getContent();
        };
    }

    private String storedOrDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private List<Map<String, Object>> activityMaps(List<ActivityRecord> activities) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (ActivityRecord item : activities) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("type", item.getActivityType());
            map.put("title", item.getTitle());
            map.put("description", item.getDescription());
            map.put("status", item.getStatus());
            map.put("referenceId", item.getReferenceId());
            map.put("eventAt", string(item.getEventAt()));
            result.add(map);
        }
        return result;
    }

    private String string(Object value) {
        return value == null ? null : value.toString();
    }

    private Long parseLong(String value) {
        return value == null || value.isBlank() ? null : Long.valueOf(value);
    }

    private String value(String input) {
        return input == null ? "" : input.trim();
    }

    private String message(Exception exception) {
        return exception.getMessage() == null
                ? "요청 처리 중 오류가 발생했습니다."
                : exception.getMessage();
    }
}
