from typing import List, Optional
from datetime import datetime
from app.domain.otm.schema import OTMProject
from app.domain.analysis.schema import AnalysisReport, Threat
from app.domain.analysis.rule_schema import RuleDefinition
from app.services.rules.catalog import ACTIVE_RULES, GenericRule

class AnalysisService:
    @staticmethod
    def analyze(project: OTMProject, custom_rules: Optional[List[RuleDefinition]] = None) -> AnalysisReport:
        all_threats: List[Threat] = []
        
        # Start with active hardcoded rules
        rules_to_run = list(ACTIVE_RULES)
        
        # Add dynamic rules if provided
        if custom_rules:
            for rule_def in custom_rules:
                try:
                    rules_to_run.append(GenericRule(rule_def))
                except Exception as e:
                    print(f"Failed to instantiate custom rule {rule_def.id}: {e}")

        for rule in rules_to_run:
            try:
                threats = rule.check(project)
                all_threats.extend(threats)
            except Exception as e:
                print(f"Error running rule {rule.id}: {e}")
                # Continue with other rules
        
        # Calculate summary
        summary = {
            "total": len(all_threats),
            "critical": len([t for t in all_threats if t.severity == "critical"]),
            "high": len([t for t in all_threats if t.severity == "high"]),
            "medium": len([t for t in all_threats if t.severity == "medium"]),
            "low": len([t for t in all_threats if t.severity == "low"]),
        }

        return AnalysisReport(
            projectId=project.project.get("id", "unknown"),
            timestamp=datetime.utcnow().isoformat(),
            threats=all_threats,
            summary=summary
        )
