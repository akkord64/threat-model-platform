from typing import List, Literal, Optional, Any, Union, Dict
from pydantic import BaseModel, Field

# --- Rule Definition Schema ---

class RuleCriteria(BaseModel):
    field: str = Field(..., description="Field to check (e.g., 'type', 'attributes.encrypted')")
    operator: Literal["equals", "not_equals", "contains", "not_contains", "missing", "exists"] = "equals"
    value: Optional[Any] = None

class RuleDefinition(BaseModel):
    id: str
    title: str
    severity: Literal["low", "medium", "high", "critical"]
    description: str
    mitigation: Optional[str] = None
    target: Literal["component", "trustZone"] = "component"
    criteria: List[RuleCriteria]

class AnalysisRequest(BaseModel):
    projectId: str
    projectName: str
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    customRules: Optional[List[RuleDefinition]] = None
