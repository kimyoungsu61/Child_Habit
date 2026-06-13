# AI image generation with Colab and ngrok

This app can call an image generation model running in Google Colab through an ngrok HTTPS tunnel.

## Runtime flow

```text
JSP/JS character screen
-> POST /api/child/character/generate
-> Java AiImageService
-> POST {AI_IMAGE_API_URL}
-> Colab Flask runs generate_character(...)
-> Flask returns image_base64
-> Java stores PNG under /media/generated/{uuid}.png
-> Browser previews the returned imageUrl
-> /api/child/setup stores character_image_url in Oracle
```

## Java configuration

The fallback endpoint is still local for development:

```text
http://127.0.0.1:5000/generate
```

When the model runs in Colab, set `AI_IMAGE_API_URL` to the ngrok URL plus `/generate`.

PowerShell example:

```powershell
$env:AI_IMAGE_API_URL="https://xxxx.ngrok-free.app/generate"
$env:AI_IMAGE_API_TOKEN="optional-token"
```

Restart Tomcat or the local Java server after changing the environment variable.

You can also pass the same value as a JVM system property:

```text
-DAI_IMAGE_API_URL=https://xxxx.ngrok-free.app/generate
-DAI_IMAGE_API_TOKEN=optional-token
```

## Sharing the web app with teammates

The ngrok URL above is only for the AI image generation API (`/generate`).
It is not the URL teammates should open in a browser.

To let teammates access the Tomcat web app from outside your local network,
open a separate ngrok tunnel for the Tomcat port:

```powershell
ngrok http 8081
```

If ngrok prints:

```text
Forwarding  https://xxxx.ngrok-free.app -> http://localhost:8081
```

share this browser URL with teammates:

```text
https://xxxx.ngrok-free.app/back/app
```

Do not share a private LAN URL such as `http://192.168.x.x:8081/back/app`
with teammates outside the same network. That address only works on the same
Wi-Fi/LAN.

## 웹앱 외부 접속 트러블슈팅

### 사용자가 로딩 화면만 계속 보는 경우

먼저 어떤 URL을 공유했는지 확인합니다.

아래처럼 `192.168.x.x`로 시작하는 사설 IP 주소는 외부 사용자에게 공유하면 안 됩니다.

```text
http://192.168.x.x:8081/back/app
```

이 주소는 개발자 PC와 같은 와이파이/LAN에 있는 기기에서만 접속할 수 있습니다.

Colab AI 서버용 URL도 사용자에게 공유하면 안 됩니다.

```text
https://xxxx.ngrok-free.app/generate
```

`/generate` URL은 `AiImageService`가 AI 이미지 서버를 호출할 때만 사용하는 주소입니다.
사용자가 브라우저에서 여는 주소가 아닙니다.

사용자는 웹앱 터널 주소로 접속해야 합니다.

```text
https://<web-app-tunnel-domain>/back/app
```

### ngrok 설정이 안 되어 있는 경우

`ngrok http 8081` 실행 시 ngrok authtoken 미설정 오류가 나면,
Cloudflare quick tunnel을 대신 사용할 수 있습니다.

```powershell
cloudflared tunnel --url http://localhost:8081
```

실행 후 아래와 같은 URL이 출력되면:

```text
https://example.trycloudflare.com
```

사용자에게는 다음 주소를 공유합니다.

```text
https://example.trycloudflare.com/back/app
```

### 컴퓨터를 껐다가 다시 켠 경우

임시 터널은 PC를 끄거나 재시작하거나 터널 프로세스를 종료하면 끊깁니다.
컴퓨터를 다시 켠 뒤에는 아래 순서대로 다시 실행합니다.

1. Tomcat을 실행하거나 배포 스크립트를 실행합니다.

```powershell
.\deploy.bat
```

2. 로컬에서 앱이 정상 접속되는지 확인합니다.

```text
http://localhost:8081/back/app
```

3. 웹앱용 외부 터널을 새로 엽니다.

ngrok을 사용하는 경우:

```powershell
ngrok http 8081
```

Cloudflare quick tunnel을 사용하는 경우:

```powershell
cloudflared tunnel --url http://localhost:8081
```

4. 새로 출력된 HTTPS 도메인 뒤에 `/back/app`을 붙입니다.

```text
https://<new-public-domain>/back/app
```

5. 완성된 새 URL을 사용자에게 전달합니다.

임시 터널은 새로 실행할 때마다 공개 도메인이 바뀔 수 있습니다.
따라서 PC를 재시작한 뒤에는 예전에 사용하던 터널 URL을 재사용하지 말고,
새로 생성된 URL을 다시 공유해야 합니다.

## Flask response contract

The Java app sends JSON like this:

```json
{
  "gender": "boy",
  "user_emotion": "smile",
  "background": "city",
  "glasses": "none",
  "prompt": "positive prompt from the browser"
}
```

The Colab Flask server should return JSON like this:

```json
{
  "success": true,
  "image_base64": "iVBORw0KGgoAAA...",
  "prompt": "positive prompt used by the model",
  "seed": 123456
}
```

`image_base64` may also be a data URL such as `data:image/png;base64,...`.

For failures, return:

```json
{
  "success": false,
  "message": "Reason shown to the user"
}
```

## Colab Flask cell

Run this after the notebook has loaded the model and defined `generate_character(...)`.

```python
!pip install -q flask flask-cors pyngrok

from flask import Flask, request, jsonify
from flask_cors import CORS
from pyngrok import ngrok
from io import BytesIO
import base64
import threading

NGROK_TOKEN = "본인_NGROK_TOKEN"
ngrok.set_auth_token(NGROK_TOKEN)

app = Flask(__name__)
CORS(app)

def normalize_options(data):
    gender_map = {
        "boy": "남자",
        "girl": "여자",
    }
    emotion_map = {
        "focus": "보통",
        "curious": "신남",
        "smile": "행복",
        "normal": "보통",
    }
    background_map = {
        "city": "도시",
        "countryside": "공원",
        "futureCity": "미래도시",
    }
    glasses_map = {
        "wear": "안경착용",
        "none": "안경미착용",
    }
    return {
        "gender": gender_map.get(data.get("gender"), data.get("gender", "남자")),
        "user_emotion": emotion_map.get(data.get("user_emotion"), data.get("user_emotion", "보통")),
        "background": background_map.get(data.get("background"), data.get("background", "도시")),
        "glasses": glasses_map.get(data.get("glasses"), data.get("glasses", "안경미착용")),
    }

@app.post("/generate")
def generate():
    data = request.get_json(force=True) or {}
    options = normalize_options(data)

    image, seed, prompt_result = generate_character(
        gender=options["gender"],
        user_emotion=options["user_emotion"],
        background=options["background"],
        glasses=options["glasses"],
        width=1024,
        height=1024,
        steps=30,
        guidance_scale=6.0,
    )

    buffer = BytesIO()
    image.save(buffer, format="PNG")
    image_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

    return jsonify({
        "success": True,
        "image_base64": image_base64,
        "prompt": prompt_result.get("positive_prompt", data.get("prompt", "")),
        "seed": seed,
    })

def run_flask():
    app.run(host="0.0.0.0", port=5000)

threading.Thread(target=run_flask, daemon=True).start()
public_url = ngrok.connect(5000).public_url
print("AI_IMAGE_API_URL=" + public_url + "/generate")
```

Copy the printed `AI_IMAGE_API_URL` value into the Java runtime environment, restart the Java server, and try character generation again.
