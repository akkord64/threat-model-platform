from typing import List, Any
from app.domain.otm.schema import OTMProject, Component, TrustZone
from app.domain.analysis.schema import Threat
from app.domain.analysis.rule_schema import RuleDefinition
import uuid

class ThreatRule:
    id: str
    title: str
    severity: str

    def check(self, project: OTMProject) -> List[Threat]:
        raise NotImplementedError

# --- Generic Data-Driven Rule ---

class GenericRule(ThreatRule):
    def __init__(self, definition: RuleDefinition):
        self.definition = definition
        self.id = definition.id
        self.title = definition.title
        self.severity = definition.severity

    def _get_field_value(self, obj: Any, field_path: str) -> Any:
        """Helper to access nested fields like 'attributes.encrypted'"""
        current = obj
        for part in field_path.split('.'):
            if isinstance(current, dict):
                current = current.get(part)
            elif hasattr(current, part):
                current = getattr(current, part)
            else:
                return None
        return current

    def _match_criteria(self, obj: Any) -> bool:
        """Returns True if ALL criteria match"""
        for crit in self.definition.criteria:
            val = self._get_field_value(obj, crit.field)
            
            if crit.operator == "equals":
                # specific check for boolean strings
                if isinstance(crit.value, bool) and isinstance(val, str):
                     if str(val).lower() != str(crit.value).lower(): return False
                elif val != crit.value:
                    return False
            elif crit.operator == "not_equals":
                if val == crit.value: return False
            elif crit.operator == "contains":
                if not val or crit.value not in val: return False
            elif crit.operator == "not_contains":
                if val and crit.value in val: return False
            elif crit.operator == "missing":
                if val is not None and val != "": return False
            elif crit.operator == "exists":
                if val is None or val == "": return False
        
        return True

    def check(self, project: OTMProject) -> List[Threat]:
        threats = []
        targets = project.components if self.definition.target == "component" else project.trustZones
        
        for item in targets:
            if self._match_criteria(item):
                threats.append(Threat(
                    id=str(uuid.uuid4()),
                    ruleId=self.id,
                    title=self.title,
                    description=self.definition.description.replace("{name}", item.name),
                    severity=self.severity,
                    componentId=item.id,
                    mitigation=self.definition.mitigation
                ))
        return threats

# --- Hardcoded Logic Rules (Legacy/Complex) ---

class UnencryptedStorageRule(ThreatRule):
    id = "RULE-001"
    title = "Unencrypted Data Storage"
    severity = "high"

    def check(self, project: OTMProject) -> List[Threat]:
        threats = []
        for comp in project.components:
            if comp.type in ["database", "storage", "s3"]:
                # Check attributes (case-insensitive keys for MVP)
                attrs = {k.lower(): v for k, v in comp.attributes.items()}
                encrypted = attrs.get("encrypted")
                
                # Check if encrypted is explicitly True or "true"
                is_encrypted = str(encrypted).lower() == "true"
                
                if not is_encrypted:
                    threats.append(Threat(
                        id=str(uuid.uuid4()),
                        ruleId=self.id,
                        title=self.title,
                        description=f"Component '{comp.name}' ({comp.type}) does not appear to have encryption enabled.",
                        severity=self.severity,
                        componentId=comp.id,
                        mitigation="Enable server-side encryption for this data store."
                    ))
        return threats

class HighRiskPublicZoneRule(ThreatRule):
    id = "RULE-002"
    title = "High Risk Public Zone"
    severity = "medium"

    def check(self, project: OTMProject) -> List[Threat]:
        threats = []
        for tz in project.trustZones:
            # Simple heuristic: if name contains "public" or "internet" and risk is low?
            # Or if risk is explicitly high.
            # Let's say: If Integrity or Confidentiality is < 50 (meaning low trust/high risk of breach? 
            # Wait, usually Risk is high (100) or Trust is high (100)?
            # Let's assume the Rating is "Trust Rating". So 0 = Untrusted (High Risk), 100 = Trusted.
            
            # Rule: Any zone with Trust Rating < 20 is considered "Untrusted/Public".
            # If we have sensitive components in it, flag it.
            
            # For this simple rule, let's just flag the Zone itself if it has very low trust.
            if tz.risk.confidentiality < 20 or tz.risk.integrity < 20:
                 threats.append(Threat(
                        id=str(uuid.uuid4()),
                        ruleId=self.id,
                        title=self.title,
                        description=f"Trust Zone '{tz.name}' has very low trust ratings. Ensure strict boundaries.",
                        severity=self.severity,
                        componentId=tz.id,
                        mitigation="Verify that this zone is intentionally untrusted (e.g. Public Internet) and all ingress is filtered."
                    ))
        return threats

class MissingOwnerRule(ThreatRule):
    id = "RULE-003"
    title = "Missing Component Owner"
    severity = "low"

    def check(self, project: OTMProject) -> List[Threat]:
        threats = []
        for comp in project.components:
            # Check tags
            has_owner = any(tag.startswith("owner:") for tag in comp.tags)
            
            if not has_owner:
                 threats.append(Threat(
                        id=str(uuid.uuid4()),
                        ruleId=self.id,
                        title=self.title,
                        description=f"Component '{comp.name}' is missing an 'owner:...' tag.",
                        severity=self.severity,
                        componentId=comp.id,
                        mitigation="Add an 'owner:team-name' tag to facilitate incident response."
                    ))
        return threats

# --- Catalog ---
ACTIVE_RULES = [
    UnencryptedStorageRule(),
    HighRiskPublicZoneRule(),
    MissingOwnerRule()
]
