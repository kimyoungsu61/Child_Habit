package com.genai.controller;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.annotation.MultipartConfig;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.Part;

import com.genai.model.ChildProfile;
import com.genai.model.Mission;
import com.genai.service.MissionMediaStorage;
import com.genai.service.MissionService;
import com.genai.session.SessionKeys;

@WebServlet({"/child/mission", "/child/missions/submit"})
@MultipartConfig(
        fileSizeThreshold = 1024 * 1024,
        maxFileSize = 100L * 1024 * 1024,
        maxRequestSize = 120L * 1024 * 1024
)
public class MissionSubmitServlet extends HttpServlet {
    private MissionService missionService;
    private MissionMediaStorage mediaStorage;

    @Override
    public void init() {
        missionService = new MissionService();
        mediaStorage = new MissionMediaStorage();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        ChildProfile child =
                (ChildProfile) request.getSession(false).getAttribute(SessionKeys.CHILD);
        request.setAttribute("missions", missionService.findMissionsForChild(child.getChildId()));
        request.setAttribute("submissions", missionService.findChildSubmissions(child.getChildId()));
        request.getRequestDispatcher("/WEB-INF/views/child-mission.jsp").forward(request, response);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        request.setCharacterEncoding("UTF-8");
        ChildProfile child =
                (ChildProfile) request.getSession(false).getAttribute(SessionKeys.CHILD);
        String mediaUrl = null;

        try {
            if (!"true".equals(request.getHeader("X-Camera-Capture"))) {
                throw new IllegalArgumentException(
                        "사진 또는 영상은 미션 화면에서 직접 촬영해 주세요.");
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
            String requestedMediaType = request.getParameter("mediaType");
            String requiredMediaType = mission.getMediaType();
            if (!requiredMediaType.equals(requestedMediaType)) {
                throw new IllegalArgumentException(
                        "미션의 인증 방식과 제출 파일 형식이 일치하지 않습니다.");
            }
            Part mediaFile = request.getPart("mediaFile");
            mediaUrl = mediaStorage.save(mediaFile, requiredMediaType);
            missionService.submit(
                    child.getChildId(), missionId, requiredMediaType, mediaUrl);
            writeJson(response, HttpServletResponse.SC_OK,
                    "{\"redirect\":\"" + request.getContextPath()
                            + "/child/mission?submitted=1\"}");
        } catch (Exception exception) {
            if (mediaUrl != null) {
                mediaStorage.deleteByUrl(mediaUrl);
            }
            getServletContext().log("Mission submission failed.", exception);
            writeJson(response, HttpServletResponse.SC_BAD_REQUEST,
                    "{\"error\":\"" + jsonEscape(exception.getMessage()) + "\"}");
        }
    }

    private Long parseLong(String value) {
        return value == null || value.isBlank() ? null : Long.valueOf(value);
    }

    private void writeJson(HttpServletResponse response, int status, String json)
            throws IOException {
        response.setStatus(status);
        response.setCharacterEncoding("UTF-8");
        response.setContentType("application/json");
        response.getWriter().write(json);
    }

    private String jsonEscape(String value) {
        if (value == null) {
            return "인증 제출 중 오류가 발생했습니다.";
        }
        return value.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\r", "\\r")
                .replace("\n", "\\n");
    }
}
