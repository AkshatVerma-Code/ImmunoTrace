from app.services.summary import build_summary
from app.agents.timeline_agent import build_timeline


def summarize(reviewed_documents: list) -> dict:
    """Build a source-linked summary without inferring diagnoses or missing facts."""
    summary = build_summary(reviewed_documents)
    summary["timeline"] = build_timeline(reviewed_documents)
    return summary
