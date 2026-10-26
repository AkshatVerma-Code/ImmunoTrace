from app.services.document_processing import structure_document


def prepare_review(text: str, filename: str, category: str | None = None) -> dict:
    """Use transparent deterministic extraction to propose fields for user review."""
    detected_category, fields = structure_document(text, filename, category)
    fields["category"] = detected_category
    return fields
