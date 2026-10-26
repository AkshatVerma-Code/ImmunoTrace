from app.services.ai_provider import configured, generate


def respond(question: str, preferences: list[str]) -> tuple[str, str]:
    if configured():
        reply = generate(
            "You are a general movement education assistant. Give beginner-friendly activity ideas and avoid diagnosis or clinical exercise prescriptions. Respect user-stated preferences. Encourage professional advice for medical conditions, symptoms, pregnancy, injuries, or activity restrictions.",
            f"User request: {question[:1200]}\nStated activity preferences or limitations: {', '.join(preferences) or 'none provided'}",
        )
        return reply, "provider"
    preference = f" I’ll take into account what you shared: {', '.join(preferences)}." if preferences else " You can share what kinds of movement you enjoy or any limitations."
    reply = ("A gentle place to start could be a comfortable 10-minute walk, a few minutes of easy mobility or stretching, or short movement breaks during the day. Begin at a pace that feels manageable and build gradually." + preference + " Stop if you feel pain, dizziness, unusual shortness of breath, or feel unwell. Ask a qualified professional about activity with medical conditions or restrictions. This reply is from local demo mode.")
    return reply, "demo"
