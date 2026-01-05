from typing import List, Dict, Any
import logging
from app.domain.otm.schema import OTMProject, TrustZone, Component, DataFlow, TrustRating

logger = logging.getLogger(__name__)

class DiagramMapper:
    """
    Translates raw React Flow JSON export into a structured OTM Project.
    """

    @staticmethod
    def to_otm(project_id: str, project_name: str, nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> OTMProject:
        
        trust_zones = []
        components = []
        dataflows = []

        # 1. Process Nodes
        for node in nodes:
            # React Flow Data
            node_id = node.get("id")
            node_type = node.get("type")
            data = node.get("data", {})
            parent_id = node.get("parentNode", None) # React Flow nesting

            # Basic Label Fallback
            label = data.get("label", "Unnamed Entity")

            if node_type == "otmTrustZone":
                # Map to Trust Zone
                # Default risk if not provided by UI
                risk_data = data.get("risk", {"confidentiality": 10, "integrity": 10, "availability": 10})
                
                tz = TrustZone(
                    id=node_id,
                    name=label,
                    description=data.get("description"),
                    risk=TrustRating(**risk_data),
                    attributes=data.get("attributes", {})
                )
                trust_zones.append(tz)

            elif node_type == "otmComponent":
                # Map to Component
                # Ensure we have a valid OTM component type (default to 'generic-client' if missing)
                comp_type = data.get("otmType", "generic-client")
                
                # If no parent is drawn in UI, default to a root TrustZone (e.g., "Internet") or handle error
                # For resilience, we map generic parents if missing
                final_parent = parent_id if parent_id else "default-trust-zone"

                comp = Component(
                    id=node_id,
                    name=label,
                    type=comp_type,
                    parent=final_parent,
                    tags=data.get("tags", []),
                    attributes=data.get("attributes", {})
                )
                components.append(comp)

        # 2. Process Edges (DataFlows)
        for edge in edges:
            edge_id = edge.get("id")
            source = edge.get("source")
            target = edge.get("target")
            data = edge.get("data", {})

            # React Flow puts label at root, but sometimes we might store it in data
            label = edge.get("label") or data.get("label") or f"Flow {source} -> {target}"

            df = DataFlow(
                id=edge_id,
                name=label,
                source=source,
                destination=target,
                bidirectional=data.get("bidirectional", False),
                attributes=data.get("attributes", {})
            )
            dataflows.append(df)

        # 3. Construct Final OTM
        # Add a default trust zone if orphans exist (optional safety net)
        if not any(tz.id == "default-trust-zone" for tz in trust_zones):
             trust_zones.append(TrustZone(
                 id="default-trust-zone", 
                 name="Default Zone", 
                 risk=TrustRating(confidentiality=0, integrity=0, availability=0)
            ))

        return OTMProject(
            otmVersion="0.1.0",
            project={"id": project_id, "name": project_name},
            trustZones=trust_zones,
            components=components,
            dataflows=dataflows
        )
