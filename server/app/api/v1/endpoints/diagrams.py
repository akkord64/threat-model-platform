from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from app.services.mapper_service import DiagramMapper
from app.services.github_service import GitHubService
from app.services.startleft_service import StartleftService
from app.services.analysis_service import AnalysisService
from app.domain.otm.schema import OTMProject
from app.domain.analysis.schema import AnalysisReport
from app.domain.analysis.rule_schema import RuleDefinition, AnalysisRequest

router = APIRouter()
# Initialize services
github_service = GitHubService()

# --- Request Models ---
class DiagramExportRequest(BaseModel):
    projectId: str
    projectName: str
    nodes: List[Dict[str, Any]]  # Raw React Flow Nodes
    edges: List[Dict[str, Any]]  # Raw React Flow Edges

class GitHubSaveRequest(DiagramExportRequest):
    commitMessage: str = "Update OTM Model"
    filename: str = "threat-model.otm"

class IaCImportRequest(BaseModel):
    iacType: str
    content: str
    mapping: Optional[str] = None

class GitHubFileRequest(BaseModel):
    repo: str
    path: str
    token: str
    content: Optional[str] = None
    message: Optional[str] = "Update via Threat Model Platform"

# --- Endpoints ---
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

@router.post("/analyze", response_model=AnalysisReport)
async def analyze_diagram(payload: AnalysisRequest):
    """
    Parses the diagram into OTM and runs the threat analysis engine.
    Now supports custom rules.
    """
    try:
        # 1. Map to OTM
        otm_model = DiagramMapper.to_otm(
            project_id=payload.projectId,
            project_name=payload.projectName,
            nodes=payload.nodes,
            edges=payload.edges
        )
        
        # 2. Run Analysis
        report = AnalysisService.analyze(otm_model, custom_rules=payload.customRules)
        return report
    except Exception as e:
        print(f"Analysis Error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to analyze diagram: {str(e)}")

@router.post("/save-to-github")
async def save_to_github(payload: GitHubSaveRequest):
    """
    Converts the diagram to OTM and pushes it to the configured GitHub repository.
    """
    try:
        # 1. Map to OTM
        otm_model = DiagramMapper.to_otm(
            project_id=payload.projectId,
            project_name=payload.projectName,
            nodes=payload.nodes,
            edges=payload.edges
        )
        
        # 2. Serialize OTM
        otm_json = otm_model.model_dump_json(indent=2, by_alias=True)
        
        # 3. Push to GitHub
        result = github_service.save_otm(payload.filename, otm_json, payload.commitMessage)
        return result
    except Exception as e:
        print(f"GitHub Save Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to save to GitHub: {str(e)}")

@router.post("/import-iac", response_model=OTMProject)
async def import_iac(payload: IaCImportRequest):
    """
    Uses Startleft to convert IaC (Terraform, etc.) into OTM, which can then be visualized.
    """
    try:
        otm_dict = StartleftService.parse_iac(payload.iacType, payload.content, payload.mapping)
        # Parse into our Pydantic model to validate and ensure structure
        return OTMProject(**otm_dict)
    except Exception as e:
        print(f"IaC Import Error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to import IaC: {str(e)}")

@router.post("/github/fetch-file")
def fetch_github_file(payload: GitHubFileRequest):
    """
    Fetches a file from a remote GitHub repository using a dynamic token.
    """
    print(f"Received fetch request: Repo={payload.repo}, Path={payload.path}")
    try:
        content = github_service.fetch_file_content(payload.repo, payload.path, payload.token)
        print("Fetch successful, returning content.")
        return {"content": content}
    except Exception as e:
        print(f"GitHub Fetch Error in Endpoint: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/github/push-file")
def push_github_file(payload: GitHubFileRequest):
    """
    Pushes a file to a remote GitHub repository using a dynamic token.
    """
    try:
        if not payload.content:
            raise HTTPException(status_code=400, detail="Content is required for push")
            
        result = github_service.push_file_content(
            payload.repo, 
            payload.path, 
            payload.content, 
            payload.message or "Update template", 
            payload.token
        )
        return result
    except Exception as e:
        print(f"GitHub Push Error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

