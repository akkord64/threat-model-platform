from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any

from app.services.mapper_service import DiagramMapper
from app.domain.otm.schema import OTMProject

router = APIRouter()

# --- Request Model ---
class DiagramExportRequest(BaseModel):
    projectId: str
    projectName: str
    nodes: List[Dict[str, Any]]  # Raw React Flow Nodes
    edges: List[Dict[str, Any]]  # Raw React Flow Edges

# --- Endpoint ---
@router.post("/parse", response_model=OTMProject)
async def parse_diagram(payload: DiagramExportRequest):
    """
    Receives a raw diagram, parses it into OTM, and returns the structured model.
    Used for validation before saving.
    """
    try:
        otm_model = DiagramMapper.to_otm(
            project_id=payload.projectId,
            project_name=payload.projectName,
            nodes=payload.nodes,
            edges=payload.edges
        )
        return otm_model
    except Exception as e:
        # Log the specific error for debugging
        print(f"Mapping Error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to map diagram to OTM: {str(e)}")
