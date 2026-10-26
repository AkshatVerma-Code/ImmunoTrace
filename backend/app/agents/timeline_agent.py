from datetime import date, datetime


def build_timeline(reviewed_documents: list) -> list[dict]:
    events = []
    for document in reviewed_documents:
        data = document.extracted_data.structured_data if document.extracted_data else {}
        events.append({"date": data.get("document_date"), "category": document.category,
                       "source": {"document_id": document.id, "name": document.original_filename},
                       "laboratory_results": data.get("laboratory_results", []),
                       "medication_mentions": data.get("medication_mentions", [])})
    def sort_key(event):
        raw = event["date"]
        parsed = None
        if isinstance(raw, str):
            for pattern in ("%Y-%m-%d", "%Y/%m/%d", "%d/%m/%Y", "%d-%m-%Y", "%d/%m/%y", "%d-%m-%y", "%d %B %Y", "%d %b %Y"):
                try:
                    parsed = datetime.strptime(raw.strip(), pattern).date()
                    break
                except ValueError:
                    continue
        return (parsed is None, parsed or date.max, event["source"]["document_id"])
    return sorted(events, key=sort_key)
