from pydantic import BaseModel, Field
from typing import List, Optional, Literal

class Threat(BaseModel):
    id: str = Field(..., description="Unique ID of the identified threat instance")
    ruleId: str = Field(..., description="ID of the rule that triggered this threat")
    title: str = Field(..., description="Short title of the threat")
    description: str = Field(..., description="Detailed description")
    severity: Literal["low", "medium", "high", "critical"] = "medium"
    status: Literal["open", "mitigated", "accepted"] = "open"
    componentId: Optional[str] = Field(None, description="ID of the specific component affected")
    mitigation: Optional[str] = Field(None, description="Suggested mitigation")

class AnalysisReport(BaseModel):
    projectId: str
    timestamp: str
    threats: List[Threat]
    summary: dict
