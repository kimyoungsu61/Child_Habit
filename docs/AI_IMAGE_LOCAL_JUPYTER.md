# AI image generation with local Jupyter Flask

This branch connects the Java Servlet app to a local Jupyter Notebook image model.

## Runtime flow

```text
JSP/JS character screen
-> POST /api/child/character/generate
-> Java AiImageService
-> POST http://127.0.0.1:5000/generate
-> Jupyter Flask runs generate_character(...)
-> Flask returns image_base64
-> Java stores PNG under /media/generated/{uuid}.png
-> Browser previews the returned imageUrl
-> /api/child/setup stores character_image_url in Oracle
```

## Java configuration

Default Flask endpoint:

```text
http://127.0.0.1:5000/generate
```

Override it with either a JVM system property or environment variable:

```text
AI_IMAGE_API_URL=http://127.0.0.1:5000/generate
AI_IMAGE_API_TOKEN=optional-token
```

## Flask response contract

The Java app expects JSON like this:

```json
{
  "success": true,
  "image_base64": "iVBORw0KGgoAAA...",
  "prompt": "positive prompt used by the model",
  "seed": 123456
}
```

`image_base64` may also be a data URL such as `data:image/png;base64,...`.

## Jupyter Flask cell

Run this after the notebook has loaded the model and defined `generate_character(...)`.

```python
from flask import Flask, request, jsonify
from io import BytesIO
import base64

app = Flask(__name__)

def normalize_options(data):
    gender_map = {
        "boy": "남자",
        "girl": "여자"
    }
    emotion_map = {
        "focus": "보통",
        "curious": "신남",
        "smile": "행복"
    }
    background_map = {
        "city": "도시",
        "countryside": "공원",
        "futureCity": "미래도시"
    }
    glasses_map = {
        "wear": "안경착용",
        "none": "안경미착용"
    }
    return {
        "gender": gender_map.get(data.get("gender"), data.get("gender", "남자")),
        "user_emotion": emotion_map.get(data.get("user_emotion"), data.get("user_emotion", "보통")),
        "background": background_map.get(data.get("background"), data.get("background", "도시")),
        "glasses": glasses_map.get(data.get("glasses"), data.get("glasses", "안경미착용"))
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
        guidance_scale=6.0
    )

    buffer = BytesIO()
    image.save(buffer, format="PNG")
    image_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

    return jsonify({
        "success": True,
        "image_base64": image_base64,
        "prompt": prompt_result.get("positive_prompt", data.get("prompt", "")),
        "seed": seed
    })

app.run(host="127.0.0.1", port=5000)
```

If the notebook dictionary keys are mojibake in the current file, keep the same key strings used by the running notebook or replace them with normal Korean labels consistently.
