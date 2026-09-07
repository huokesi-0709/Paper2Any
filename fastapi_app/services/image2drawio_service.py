from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any

from fastapi import UploadFile, HTTPException
from dataflow_agent.state import Paper2DrawioRequest, Paper2DrawioState
from fastapi_app.config.settings import settings
from dataflow_agent.logger import get_logger
from dataflow_agent.utils import get_project_root
from dataflow_agent.workflow import run_workflow
from fastapi_app.interprocess_lock import AsyncInterProcessSemaphore

log = get_logger(__name__)

PROJECT_ROOT = get_project_root()
BASE_OUTPUT_DIR = (PROJECT_ROOT / "outputs").resolve()

VISUAL_WORKFLOW_LIMITER = AsyncInterProcessSemaphore("sam3_visual_workflows", limit=1)


class Image2DrawioService:
    def __init__(self) -> None:
        pass

    def _create_run_dir(self, email: Optional[str], task_type: str) -> Path:
        ts = int(datetime.utcnow().timestamp())
        code = email or "default"
        run_dir = BASE_OUTPUT_DIR / code / task_type / str(ts)
        (run_dir / "input").mkdir(parents=True, exist_ok=True)
        return run_dir

    async def generate_drawio(
        self,
        image_file: UploadFile,
        chat_api_url: Optional[str],
        api_key: Optional[str],
        email: Optional[str],
        model: str,
        gen_fig_model: str,
        vlm_model: str,
        language: str,
    ) -> Dict[str, Any]:
        if image_file is None:
            raise HTTPException(status_code=400, detail="image_file is required")

        run_dir = self._create_run_dir(email, "image2drawio")
        input_dir = run_dir / "input"

        original_name = image_file.filename or "uploaded.png"
        ext = Path(original_name).suffix or ".png"
        input_path = input_dir / f"input{ext}"
        content_bytes = await image_file.read()
        input_path.write_bytes(content_bytes)
        abs_img_path = input_path.resolve()

        # Build request for the visual paper2drawio workflow
        req = Paper2DrawioRequest(
            input_type="PDF",
            chat_api_url=settings.PAPER2DRAWIO_OCR_API_URL,
            api_key=settings.PAPER2DRAWIO_OCR_API_KEY,
            chat_api_key=settings.PAPER2DRAWIO_OCR_API_KEY,
            model=model,
            vlm_model=vlm_model,
            language=language,
        )

        state = Paper2DrawioState(request=req, messages=[])
        state.paper_file = str(abs_img_path)
        state.text_content = str(abs_img_path)
        state.result_path = str(run_dir)

        async with VISUAL_WORKFLOW_LIMITER.hold():
            final_state = await run_workflow("paper2drawio_visual", state)

        drawio_xml = final_state.get("drawio_xml", "") if isinstance(final_state, dict) else getattr(final_state, "drawio_xml", "")
        drawio_path = (
            final_state.get("output_xml_path", "")
            if isinstance(final_state, dict)
            else getattr(final_state, "output_xml_path", "")
        )
        if not drawio_path:
            drawio_path = final_state.get("drawio_output_path", "") if isinstance(final_state, dict) else getattr(final_state, "drawio_output_path", "")

        temp_data = final_state.get("temp_data", {}) if isinstance(final_state, dict) else getattr(final_state, "temp_data", {})
        temp_data = temp_data or {}
        elements = temp_data.get("drawio_elements", []) or []
        image_count = sum(1 for item in elements if item.get("kind") == "image")
        image_prompts = temp_data.get("sam3_segment_hints", []) or []
        fallback_used = bool(temp_data.get("visual_fallback_used"))
        visual_output_missing = bool(image_prompts) and image_count == 0
        success = bool(drawio_xml) and not visual_output_missing
        error = "视觉元素转换失败，未能保留原图中的图标或图片。" if visual_output_missing else None
        quality_warning = (
            "未能拆分复杂图标，已使用保真背景并保留可编辑文字"
            if fallback_used and success
            else None
        )

        return {
            "success": success,
            "xml_content": drawio_xml,
            "file_path": str(drawio_path) if drawio_path else "",
            "error": error,
            "fallback_used": fallback_used,
            "quality_warning": quality_warning,
        }
