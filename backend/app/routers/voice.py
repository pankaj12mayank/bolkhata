
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional

from ..database import get_db
from .. import models, schemas
from ..security import get_current_shop
from ..services.settings_service import get_settings
from ..services.voice_service import transcribe_with_whisper, transcribe_generic
from ..services.parse_service import local_parse, claude_parse, generic_ai_parse, parse

router = APIRouter(prefix="/api/voice", tags=["voice"])

def _get_ai_creds(s):
    # Prefer generic, fallback to legacy
    provider = getattr(s, 'ai_provider', 'local') or 'local'
    base_url = getattr(s, 'ai_base_url', '') or ''
    api_key = getattr(s, 'ai_api_key', '') or ''
    model = getattr(s, 'ai_model', '') or ''
    # fallback to legacy openai/anthropic if generic empty
    if provider == 'local' and (s.openai_api_key or s.anthropic_api_key):
        if s.openai_api_key:
            provider = 'openai'
            api_key = s.openai_api_key
            base_url = 'https://api.openai.com/v1'
            model = 'gpt-4o-mini'
        elif s.anthropic_api_key:
            provider = 'anthropic'
            api_key = s.anthropic_api_key
            base_url = 'https://api.anthropic.com'
            model = s.claude_model
    return provider, base_url, api_key, model

@router.post("/transcribe", response_model=schemas.VoiceTranscribeOut)
async def transcribe(
    file: UploadFile = File(...),
    language: str = Form("Hinglish"),
    shop: models.Shop = Depends(get_current_shop),
    db: Session = Depends(get_db),
):
    s = get_settings(db)
    lang_hint = language or shop.language or s.default_language
    # If STT provider is browser, tell frontend to use Web Speech (free)
    if getattr(s, 'stt_provider', 'browser') == 'browser':
        raise HTTPException(status_code=400, detail="STT Browser Free mode hai — frontend me Web Speech API use karein (Chrome free, koi key nahi). OpenAI Whisper ke liye Admin -> Settings -> STT provider = openai karein.")
    # Use generic STT
    data = await file.read()
    if len(data) == 0:
        raise HTTPException(status_code=400, detail="Audio khali hai")
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Audio bahut bada — 10MB se kam bhejein")
    stt_provider = getattr(s, 'stt_provider', 'openai')
    stt_key = getattr(s, 'stt_api_key', '') or s.openai_api_key
    stt_url = getattr(s, 'stt_base_url', '') or ''
    stt_model = getattr(s, 'stt_model', '') or s.whisper_model
    text = await transcribe_with_whisper(data, file.filename or "audio.webm", stt_key, stt_model, lang_hint, stt_url)
    if not text:
        raise HTTPException(status_code=502, detail="Transcription fail — dobara try karein ya manual entry karein")
    return {"text": text, "language": lang_hint}

@router.post("/parse", response_model=schemas.VoiceParseOut)
async def parse_text(
    payload: schemas.VoiceParseIn,
    shop: models.Shop = Depends(get_current_shop),
    db: Session = Depends(get_db),
):
    s = get_settings(db)
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text khali hai")
    lang = payload.language or shop.language or s.default_language

    provider, base_url, api_key, model = _get_ai_creds(s)
    ai_result = None
    if provider != "local" and api_key:
        if provider == "anthropic":
            ai_result = await claude_parse(text, api_key, model or s.claude_model, lang)
        else:
            ai_result = await generic_ai_parse(text, api_key, model, lang, provider, base_url)
    result = parse(text, lang, ai_result)
    if result["amount"] <= 0:
        raise HTTPException(status_code=422, detail="Amount samajh nahi aaya — jaise 'Ramesh ko 500 udhaar diya' boliye")
    return result

@router.post("/transcribe-and-parse", response_model=schemas.VoiceParseOut)
async def transcribe_and_parse(
    file: UploadFile = File(...),
    language: str = Form("Hinglish"),
    shop: models.Shop = Depends(get_current_shop),
    db: Session = Depends(get_db),
):
    s = get_settings(db)
    lang_hint = language or shop.language or s.default_language

    # STT
    stt_provider = getattr(s, 'stt_provider', 'browser')
    if stt_provider == 'browser':
        raise HTTPException(status_code=400, detail="Browser Free STT hai — frontend Web Speech use karein")
    data = await file.read()
    if len(data) == 0:
        raise HTTPException(status_code=400, detail="Audio khali")
    stt_key = getattr(s, 'stt_api_key', '') or s.openai_api_key
    stt_url = getattr(s, 'stt_base_url', '') or ''
    stt_model = getattr(s, 'stt_model', '') or s.whisper_model
    text = await transcribe_with_whisper(data, file.filename or "audio.webm", stt_key, stt_model, lang_hint, stt_url)
    if not text:
        raise HTTPException(status_code=502, detail="Transcription fail")

    provider, base_url, api_key, model = _get_ai_creds(s)
    ai_result = None
    if provider != "local" and api_key:
        if provider == "anthropic":
            ai_result = await claude_parse(text, api_key, model or s.claude_model, lang_hint)
        else:
            ai_result = await generic_ai_parse(text, api_key, model, lang_hint, provider, base_url)
    result = parse(text, lang_hint, ai_result)
    if result["amount"] <= 0:
        raise HTTPException(status_code=422, detail=f"Text samajh aaya: '{text}' par amount nahi mila")
    result["raw_text"] = text
    return result
