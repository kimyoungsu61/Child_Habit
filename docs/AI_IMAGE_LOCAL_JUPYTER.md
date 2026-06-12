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
