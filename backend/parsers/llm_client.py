import json

import requests
from flask import current_app

from parsers.prompts import (
    EXTRACTION_PROMPT,
    build_metadata_prompt,
)


class LlmClient:
    def _chat_json(self, prompt: str, image_b64: str) -> dict:
        response = requests.post(
            f"{current_app.config['OLLAMA_BASE_URL']}/api/chat",
            json={
                "model": current_app.config["OLLAMA_MODEL"],
                "stream": False,
                "think": False,
                "format": "json",
                "options": {
                    "num_ctx": current_app.config["OLLAMA_NUM_CTX"],
                    "num_predict": current_app.config["OLLAMA_NUM_PREDICT"],
                },
                "messages": [
                    {
                        "role": "user",
                        "content": prompt,
                        "images": [image_b64],
                    }
                ],
            },
            timeout=current_app.config["OLLAMA_TIMEOUT_SECONDS"],
        )
        try:
            response.raise_for_status()
        except requests.HTTPError as exc:
            raise RuntimeError(f"Ollama request failed: {response.text}") from exc

        content = response.json()["message"].get("content", "").strip()
        if not content:
            raise RuntimeError("Ollama returned an empty JSON response")

        return json.loads(content)

    def extract_transactions(self, image_b64: str) -> dict:
        return self._chat_json(EXTRACTION_PROMPT, image_b64)

    def extract_account_statement_period(
        self, image_b64: str, account_candidates: list[dict]
    ) -> dict:
        return self._chat_json(
            build_metadata_prompt(account_candidates),
            image_b64,
        )
