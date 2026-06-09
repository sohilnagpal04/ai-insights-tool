import anthropic
import json
from typing import Generator


INSIGHTS_SYSTEM = """You are a senior business intelligence analyst. 
Analyse the dataset summary provided and respond ONLY with a valid JSON object.
No markdown, no backticks, no preamble — raw JSON only.

The JSON must have exactly these keys:
- "executive_summary": 2-3 sentence plain-English summary of what the data shows
- "insights": list of exactly 3 objects, each with "title" (short label) and "detail" (1-2 sentences)
- "anomalies": 1-2 sentence description of anomalies found, or "No significant anomalies detected." if none
- "recommendation": single strategic recommendation in 1-2 sentences

Use clear, non-technical language suitable for a business owner."""


CHAT_SYSTEM = """You are a helpful data analyst assistant. 
The user has uploaded a CSV dataset and you have been given a statistical summary of it.
Answer the user's questions about their data clearly and concisely.
Reference specific numbers from the summary when relevant.
Keep answers under 150 words unless a detailed breakdown is explicitly requested."""


def stream_insights(summary: dict, api_key: str) -> Generator[str, None, None]:
    """Stream Claude's JSON insights response chunk by chunk."""
    client = anthropic.Anthropic(api_key=api_key)

    with client.messages.stream(
        model="claude-opus-4-20250514",
        max_tokens=1024,
        system=INSIGHTS_SYSTEM,
        messages=[
            {
                "role": "user",
                "content": f"Dataset summary:\n{json.dumps(summary, indent=2, default=str)}"
            }
        ],
    ) as stream:
        for text in stream.text_stream:
            yield text


def stream_chat(
    user_message: str,
    history: list,
    summary_str: str,
    api_key: str,
) -> Generator[str, None, None]:
    """Stream a conversational response about the dataset."""
    client = anthropic.Anthropic(api_key=api_key)

    # Build message history — inject summary into first user message
    messages = []
    for i, msg in enumerate(history):
        role = msg["role"]
        content = msg["content"]
        if i == 0 and role == "user":
            content = f"Dataset summary for context:\n{summary_str}\n\nUser question: {content}"
        messages.append({"role": role, "content": content})

    with client.messages.stream(
        model="claude-opus-4-20250514",
        max_tokens=512,
        system=CHAT_SYSTEM,
        messages=messages,
    ) as stream:
        for text in stream.text_stream:
            yield text
