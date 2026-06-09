<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!doctype html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>미션 인증 촬영</title>
    <style>
        .camera-stage { max-width: 640px; }
        .camera-view { width: 100%; background: #111; border-radius: 12px; }
        .camera-actions { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0; }
        .status { min-height: 1.5em; }
        [hidden] { display: none !important; }
    </style>
</head>
<body>
<header>
    <h1>오늘의 미션</h1>
    <a href="${pageContext.request.contextPath}/child/home">아이 홈</a>
</header>

<nav>
    <a href="${pageContext.request.contextPath}/child/inventory">보상함</a>
    <a href="${pageContext.request.contextPath}/child/history">성장 기록</a>
    <a href="${pageContext.request.contextPath}/child/notifications">알림</a>
</nav>

<c:if test="${param.submitted == '1'}">
    <p>인증을 제출했습니다. 부모님의 확인을 기다려 주세요.</p>
</c:if>
<c:if test="${not empty error}">
    <p><c:out value="${error}"/></p>
</c:if>
<c:if test="${not empty boxResult}">
    <p>
        <c:out value="${boxResult.boxGrade}"/> 상자를 열어
        <c:out value="${boxResult.expAmount}"/> EXP를 얻었습니다.
        현재 Lv.${boxResult.currentLevel}, EXP ${boxResult.currentExp}
    </p>
</c:if>

<section class="camera-stage">
    <h2>직접 촬영해서 인증하기</h2>
    <p>앨범이나 파일에서는 올릴 수 없습니다. 이 화면에서 바로 촬영해 주세요.</p>

    <c:choose>
        <c:when test="${empty missions}">
            <p>현재 인증할 수 있는 미션이 없습니다.</p>
        </c:when>
        <c:otherwise>
            <label for="missionId">미션</label>
            <select id="missionId" required>
                <c:forEach var="mission" items="${missions}">
                    <option value="${mission.missionId}"
                            data-media-type="${mission.mediaType}">
                        <c:out value="${mission.missionTitle}"/> ·
                        <c:out value="${mission.missionGrade}"/> ·
                        <c:out value="${mission.mediaType == 'photo' ? '사진' : '영상'}"/>
                    </option>
                </c:forEach>
            </select>

            <p>인증 방식: <strong id="mediaTypeLabel"></strong></p>
            <video id="cameraPreview" class="camera-view" autoplay playsinline muted></video>
            <img id="photoPreview" class="camera-view" alt="촬영한 사진 미리보기" hidden>
            <video id="videoPreview" class="camera-view" controls playsinline hidden></video>
            <canvas id="photoCanvas" hidden></canvas>

            <div class="camera-actions">
                <button id="startCameraButton" type="button">카메라 켜기</button>
                <button id="takePhotoButton" type="button" hidden>사진 촬영</button>
                <button id="startRecordingButton" type="button" hidden>영상 녹화 시작</button>
                <button id="stopRecordingButton" type="button" hidden>녹화 종료</button>
                <button id="retakeButton" type="button" hidden>다시 촬영</button>
                <button id="submitButton" type="button" disabled>인증 제출</button>
            </div>
            <p id="cameraStatus" class="status" role="status"></p>
        </c:otherwise>
    </c:choose>
</section>

<section>
    <h2>제출 기록</h2>
    <c:choose>
        <c:when test="${empty submissions}">
            <p>아직 제출 기록이 없습니다.</p>
        </c:when>
        <c:otherwise>
            <c:forEach var="submission" items="${submissions}">
                <article>
                    <strong>
                        <c:out value="${submission.mediaType == 'photo' ? '사진' : '영상'}"/> 인증
                    </strong>
                    <p>상태: <c:out value="${submission.status}"/></p>
                    <span><c:out value="${submission.submittedAt}"/></span>
                    <c:if test="${submission.status == 'approved' && submission.rewardGiven == 'N'}">
                        <form method="post" action="${pageContext.request.contextPath}/child/boxes/open">
                            <input type="hidden" name="submissionId"
                                   value="${submission.submissionId}">
                            <button type="submit">상자 개봉</button>
                        </form>
                    </c:if>
                </article>
            </c:forEach>
        </c:otherwise>
    </c:choose>
</section>

<c:if test="${not empty missions}">
<script>
(() => {
    const submitUrl = '<c:url value="/child/mission"/>';
    const missionSelect = document.getElementById('missionId');
    const mediaTypeLabel = document.getElementById('mediaTypeLabel');
    const cameraPreview = document.getElementById('cameraPreview');
    const photoPreview = document.getElementById('photoPreview');
    const videoPreview = document.getElementById('videoPreview');
    const photoCanvas = document.getElementById('photoCanvas');
    const status = document.getElementById('cameraStatus');
    const startCameraButton = document.getElementById('startCameraButton');
    const takePhotoButton = document.getElementById('takePhotoButton');
    const startRecordingButton = document.getElementById('startRecordingButton');
    const stopRecordingButton = document.getElementById('stopRecordingButton');
    const retakeButton = document.getElementById('retakeButton');
    const submitButton = document.getElementById('submitButton');

    let stream = null;
    let recorder = null;
    let recordedChunks = [];
    let capturedBlob = null;
    let capturedFileName = null;
    let previewUrl = null;
    let recordingTimer = null;

    const selectedMediaType = () =>
        missionSelect.options[missionSelect.selectedIndex].dataset.mediaType;

    function setStatus(message) {
        status.textContent = message;
    }

    function clearCapture() {
        capturedBlob = null;
        capturedFileName = null;
        submitButton.disabled = true;
        retakeButton.hidden = true;
        photoPreview.hidden = true;
        videoPreview.hidden = true;
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            previewUrl = null;
        }
        videoPreview.removeAttribute('src');
    }

    function stopCamera() {
        clearTimeout(recordingTimer);
        if (recorder && recorder.state !== 'inactive') {
            recorder.onstop = null;
            recorder.stop();
        }
        recorder = null;
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
        cameraPreview.srcObject = null;
    }

    function updateMode() {
        stopCamera();
        clearCapture();
        const isPhoto = selectedMediaType() === 'photo';
        mediaTypeLabel.textContent = isPhoto ? '사진 촬영' : '영상 촬영';
        startCameraButton.hidden = false;
        takePhotoButton.hidden = true;
        startRecordingButton.hidden = true;
        stopRecordingButton.hidden = true;
        cameraPreview.hidden = false;
        setStatus('카메라 켜기 버튼을 눌러 주세요.');
    }

    async function startCamera() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setStatus('이 브라우저에서는 카메라를 사용할 수 없습니다. HTTPS 또는 localhost로 접속해 주세요.');
            return;
        }

        stopCamera();
        clearCapture();
        const isVideo = selectedMediaType() === 'video';
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: 'environment' } },
                audio: isVideo
            });
            cameraPreview.srcObject = stream;
            cameraPreview.hidden = false;
            startCameraButton.hidden = true;
            takePhotoButton.hidden = isVideo;
            startRecordingButton.hidden = !isVideo;
            setStatus(isVideo ? '준비되면 영상 녹화를 시작하세요.' : '준비되면 사진을 촬영하세요.');
        } catch (error) {
            setStatus('카메라 권한이 필요합니다. 브라우저 설정에서 카메라 사용을 허용해 주세요.');
        }
    }

    function takePhoto() {
        if (!stream || cameraPreview.videoWidth === 0) {
            setStatus('카메라 화면이 준비될 때까지 잠시 기다려 주세요.');
            return;
        }
        photoCanvas.width = cameraPreview.videoWidth;
        photoCanvas.height = cameraPreview.videoHeight;
        photoCanvas.getContext('2d').drawImage(
            cameraPreview, 0, 0, photoCanvas.width, photoCanvas.height);
        photoCanvas.toBlob(blob => {
            if (!blob) {
                setStatus('사진을 만들지 못했습니다. 다시 촬영해 주세요.');
                return;
            }
            capturedBlob = blob;
            capturedFileName = 'mission-photo.jpg';
            previewUrl = URL.createObjectURL(blob);
            photoPreview.src = previewUrl;
            photoPreview.hidden = false;
            cameraPreview.hidden = true;
            stopCamera();
            retakeButton.hidden = false;
            takePhotoButton.hidden = true;
            submitButton.disabled = false;
            setStatus('사진 촬영이 완료되었습니다.');
        }, 'image/jpeg', 0.9);
    }

    function supportedVideoType() {
        const types = [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm',
            'video/mp4'
        ];
        return types.find(type => MediaRecorder.isTypeSupported(type)) || '';
    }

    function startRecording() {
        if (!stream || typeof MediaRecorder === 'undefined') {
            setStatus('이 브라우저에서는 영상 녹화를 사용할 수 없습니다.');
            return;
        }
        recordedChunks = [];
        const mimeType = supportedVideoType();
        recorder = mimeType
            ? new MediaRecorder(stream, { mimeType })
            : new MediaRecorder(stream);
        recorder.ondataavailable = event => {
            if (event.data.size > 0) recordedChunks.push(event.data);
        };
        recorder.onstop = finishRecording;
        recorder.start();
        startRecordingButton.hidden = true;
        stopRecordingButton.hidden = false;
        setStatus('녹화 중입니다. 최대 30초까지 촬영됩니다.');
        recordingTimer = setTimeout(stopRecording, 30000);
    }

    function stopRecording() {
        clearTimeout(recordingTimer);
        if (recorder && recorder.state !== 'inactive') {
            recorder.stop();
        }
    }

    function finishRecording() {
        const mimeType = recorder.mimeType || 'video/webm';
        capturedBlob = new Blob(recordedChunks, { type: mimeType });
        capturedFileName = mimeType.includes('mp4') ? 'mission-video.mp4' : 'mission-video.webm';
        previewUrl = URL.createObjectURL(capturedBlob);
        videoPreview.src = previewUrl;
        videoPreview.hidden = false;
        cameraPreview.hidden = true;
        stopRecordingButton.hidden = true;
        retakeButton.hidden = false;
        submitButton.disabled = false;
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
        recorder = null;
        setStatus('영상 촬영이 완료되었습니다.');
    }

    async function submitCapture() {
        if (!capturedBlob) {
            setStatus('먼저 사진 또는 영상을 촬영해 주세요.');
            return;
        }
        submitButton.disabled = true;
        setStatus('인증을 제출하고 있습니다.');

        const formData = new FormData();
        formData.append('missionId', missionSelect.value);
        formData.append('mediaType', selectedMediaType());
        formData.append('mediaFile', capturedBlob, capturedFileName);

        try {
            const response = await fetch(submitUrl, {
                method: 'POST',
                headers: { 'X-Camera-Capture': 'true' },
                body: formData
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || '인증 제출에 실패했습니다.');
            }
            window.location.href = result.redirect;
        } catch (error) {
            submitButton.disabled = false;
            setStatus(error.message || '인증 제출에 실패했습니다.');
        }
    }

    missionSelect.addEventListener('change', updateMode);
    startCameraButton.addEventListener('click', startCamera);
    takePhotoButton.addEventListener('click', takePhoto);
    startRecordingButton.addEventListener('click', startRecording);
    stopRecordingButton.addEventListener('click', stopRecording);
    retakeButton.addEventListener('click', startCamera);
    submitButton.addEventListener('click', submitCapture);
    window.addEventListener('pagehide', stopCamera);
    updateMode();
})();
</script>
</c:if>
</body>
</html>
