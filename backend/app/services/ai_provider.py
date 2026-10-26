import json
import urllib.error
import urllib.request

from app.core.config import settings


def configured() -> bool:
    return bool(settings.gemini_api_key)


def generate(system_prompt: str, user_prompt: str) -> str:
    return generate_with_parts(system_prompt, [{"text": user_prompt}])


def generate_with_parts(system_prompt: str, user_parts: list[dict]) -> str:
    if not configured():
        raise RuntimeError("No external AI provider is configured.")
    base = settings.gemini_base_url.rstrip("/")
    endpoint = f"{base}/models/{settings.gemini_model}:generateContent"
    payload = json.dumps({
        "system_instruction": {"parts": [{"text": system_prompt}]},
        "contents": [{"role": "user", "parts": user_parts}],
    }).encode()
    request = urllib.request.Request(endpoint, data=payload, headers={
        "x-goog-api-key": settings.gemini_api_key, "Content-Type": "application/json",
    }, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=45) as response:
            result = json.loads(response.read())
        parts = result["candidates"][0]["content"]["parts"]
        text = "\n".join(str(part["text"]) for part in parts if part.get("text"))
        if not text.strip():
            raise RuntimeError("Gemini returned no readable text. The request may have been blocked by a safety filter.")
        return text.strip()
    except urllib.error.HTTPError as error:
        messages = {
            400: "Gemini rejected the request. Check the image size and configured model.",
            401: "Gemini rejected the API key. Check GEMINI_API_KEY in the project .env file.",
            403: "Gemini denied access. Check the API key restrictions and that the Gemini API is enabled for its project.",
            404: "Gemini could not find the configured model. Check GEMINI_MODEL in .env.",
            429: "Gemini quota or rate limit reached. Check the API usage limits and billing for this key.",
        }
        if error.code in messages:
            message = messages[error.code]
        elif error.code >= 500:
            message = "Gemini is temporarily unavailable. Try the extraction again shortly."
        else:
            message = f"Gemini request failed with HTTP {error.code}."
        raise RuntimeError(message) from error
    except TimeoutError as error:
        raise RuntimeError("Gemini did not respond before the request timed out. Try again.") from error
    except RuntimeError:
        raise
    except urllib.error.URLError as error:
        raise RuntimeError("Could not connect to Gemini. Check the internet connection and try again.") from error
    except (KeyError, IndexError, TypeError, json.JSONDecodeError) as error:
        raise RuntimeError("The configured AI provider could not generate a response.") from error
