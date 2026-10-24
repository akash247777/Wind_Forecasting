from fastapi import APIRouter
from typing import Dict, Any

from backend.app.services.ai_service import ai_service
from backend.app.models import AiBriefingRequest, AiBriefingResponse

router = APIRouter(prefix="/copilot", tags=["copilot"])

@router.post("/briefing", response_model=AiBriefingResponse)
def generate_market_briefing(payload: AiBriefingRequest):
    """
    Generate an AI executive market briefing and procurement recommendation
    using Gemini AI (with fallback), specifically addressing forecast errors and risk buffers.
    """
    return ai_service.generate_briefing(
        date=payload.date or "January 2026",
        metrics=payload.metrics,
        user_prompt=payload.prompt
    )
