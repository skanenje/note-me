# backend-services/prompt-enhancer/app/api/endpoints.py
from fastapi import APIRouter, HTTPException
from app.models import EnhanceRequest, EnhanceResponse
from app.loader import list_frameworks, get_framework
from app.enhancer import enhance_prompt

router = APIRouter()

@router.get("/api/frameworks")
async def get_frameworks_list():
    """List all available frameworks."""
    frameworks = list_frameworks()
    return {"frameworks": frameworks}

@router.get("/api/frameworks/{framework_id}")
async def get_framework_details(framework_id: str):
    """Get details of a specific framework."""
    framework = get_framework(framework_id)
    if not framework:
        raise HTTPException(status_code=404, detail=f"Framework '{framework_id}' not found")
    return framework

@router.post("/api/enhance")
async def enhance(request: EnhanceRequest) -> EnhanceResponse:
    """Enhance a prompt using the specified framework."""
    try:
        result = enhance_prompt(
            prompt=request.prompt,
            framework_id=request.framework_id,
            fields=request.fields,
            explain=request.explain
        )
        
        return EnhanceResponse(
            selected_framework=result["selected_framework"],
            enhanced_prompt=result["enhanced_prompt"],
            quality=result["quality"],
            explain=result.get("explain", [])
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
