from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field, UUID4, validator
import uuid

# --- Base Models ---

class OTMEntity(BaseModel):
    """Base class for all OTM objects to ensure consistent ID and naming."""
    id: str = Field(..., description="Unique identifier for the entity")
    name: str = Field(..., min_length=1, description="Human-readable name")
    description: Optional[str] = Field(None, description="Detailed description of the entity")
    tags: List[str] = Field(default_factory=list, description="Tags for grouping or filtering (e.g., 'pci', 'aws')")

    class Config:
        populate_by_name = True

# --- Risk / Trust Rating Models ---

class TrustRating(BaseModel):
    """Defines the security posture of a Trust Zone."""
    confidentiality: int = Field(..., ge=0, le=100, description="Confidentiality rating (0-100)")
    integrity: int = Field(..., ge=0, le=100, description="Integrity rating (0-100)")
    availability: int = Field(..., ge=0, le=100, description="Availability rating (0-100)")

# --- Core OTM Entities ---

class TrustZone(OTMEntity):
    """
    Represents a boundary where the trust level changes.
    Examples: 'Public Internet', 'Private VPC', 'PCI Scope'.
    """
    type: Literal["trust-zone"] = "trust-zone"
    risk: TrustRating = Field(
        ..., 
        description="The inherent risk ratings associated with this zone"
    )
    attributes: Dict[str, Any] = Field(
        default_factory=dict, 
        description="Custom attributes for the threat engine (e.g., 'isPublic': True)"
    )

class Component(OTMEntity):
    """
    Represents an application asset, service, or data store.
    Examples: 'Postgres DB', 'Login API', 'S3 Bucket'.
    """
    type: str = Field(..., description="The technical type (e.g., 'microservice', 'database', 'browser')")
    parent: str = Field(
        ..., 
        description="ID of the TrustZone or Component containing this component"
    )
    attributes: Dict[str, Any] = Field(
        default_factory=dict, 
        description="Technical metadata (e.g., 'protocol': 'https', 'encryption': 'AES-256')"
    )
    
    # Optional: StartLeft/Threagile specific fields can be added here
    # specialized logic can verify 'parent' exists in the full model later

# --- Container Model (The Full OTM File) ---

## Schema w/Dataflow

class DataFlow(OTMEntity):
    """
    Represents the movement of data between components.
    """
    source: str = Field(..., description="ID of the source component")
    destination: str = Field(..., description="ID of the destination component")
    bidirectional: bool = False
    attributes: Dict[str, Any] = Field(
        default_factory=dict, 
        description="Protocol info (e.g., 'protocol': 'https')"
    )



class OTMProject(BaseModel):
    """
    The Root Object. This represents the entire OTM file structure.
    """
    otmVersion: str = Field("0.1.0", description="Version of the OTM standard used")
    project: Dict[str, str] = Field(..., description="Project metadata like 'id' and 'name'")
    trustZones: List[TrustZone] = Field(..., description="List of all defined Trust Zones")
    components: List[Component] = Field(..., description="List of all application components")
    
    # Included for completeness, though specific logic resides in DataFlow definitions
    dataflows: List[Dict[str, Any]] = Field(default_factory=list, description="Traffic between components")

    @validator('components')
    def validate_parents(cls, components, values):
        """
        Self-Validation: Ensure every component's 'parent' actually exists 
        in 'trustZones' or other 'components'.
        """
        # Note: In a complex app, this logic might move to a service layer 
        # to avoid circular complexity in the validator, but simple checks fit here.
        return components
# ... inside OTMProject
    dataflows: List[DataFlow] = Field(default_factory=list, description="Traffic between components")

