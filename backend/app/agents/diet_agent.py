from app.services.ai_provider import configured, generate


def respond(question: str, preferences: list[str]) -> tuple[str, str]:
    if configured():
        reply = generate(
            "You are a general nutrition education assistant. Offer practical, non-clinical meal ideas. Do not diagnose or prescribe disease-specific diets. Ask about preferences or budget when useful. Encourage a clinician or registered dietitian for medical dietary needs.",
            f"User request: {question[:1200]}\nStated food preferences: {', '.join(preferences) or 'none provided'}",
        )
        return reply, "provider"
    preference = f" I’ll keep your stated preference in mind: {', '.join(preferences)}." if preferences else " Tell me any food preferences or budget and I can adapt the ideas."
    reply = ("Here are a few general meal ideas: oats with fruit and nuts; rice or whole grains with beans, vegetables, and a protein you enjoy; or a simple egg, tofu, or chickpea wrap with vegetables." + preference + " These are broad food ideas, not a treatment plan. For a medical diet or food-related symptoms, check with a qualified professional. This reply is from local demo mode.")
    return reply, "demo"
