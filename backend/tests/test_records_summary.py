import pymupdf


def create_account(client, username):
    response = client.post("/api/auth/register", json={"username": username, "password": "synthetic-test-password"})
    assert response.status_code == 201


def synthetic_pdf():
    document = pymupdf.open()
    page = document.new_page()
    page.insert_text((70, 70), "Laboratory report\nGlucose: 92 mg/dL\nCollected 12 Aug 2025")
    content = document.tobytes()
    document.close()
    return content


def test_upload_review_summary_and_private_scope(client):
    create_account(client, "record_owner")
    upload = client.post("/api/documents", data={"category": "laboratory_report"}, files={
        "file": ("synthetic-report.pdf", synthetic_pdf(), "application/pdf")
    })
    assert upload.status_code == 201
    document = upload.json()
    assert document["status"] == "needs_review"
    assert "Glucose: 92 mg/dL" in document["extracted_text"]

    fields = {**document["structured_data"], "patient_name": "Synthetic Person"}
    reviewed = client.patch(f"/api/documents/{document['id']}/review", json=fields)
    assert reviewed.status_code == 200
    assert reviewed.json()["status"] == "reviewed"

    summary = client.post("/api/summary/regenerate").json()["content"]
    assert summary["timeline"][0]["source"]["document_id"] == document["id"]
    assert summary["timeline"][0]["laboratory_results"][0]["value"] == "92"
    assert client.get("/api/summary/download").content.startswith(b"%PDF")

    conversation = client.post("/api/assistant/records/conversations").json()
    chat = client.post(f"/api/assistant/conversations/{conversation['id']}/messages", json={
        "content": "What glucose results are in my uploaded records?"
    }).json()
    assert chat["reply"]["mode"] == "demo"
    assert chat["reply"]["citations"][0]["document_id"] == document["id"]

    client.post("/api/auth/logout")
    create_account(client, "other_reader")
    assert client.get(f"/api/documents/{document['id']}").status_code == 404
    assert client.get(f"/api/assistant/conversations/{conversation['id']}").status_code == 404
    assert client.get("/api/dashboard").json()["total_documents"] == 0

    owner_login = client.post("/api/auth/login", json={"username": "record_owner", "password": "synthetic-test-password"})
    assert owner_login.status_code == 200
    assert client.delete("/api/profile").status_code == 204
    assert client.get("/api/auth/me").status_code == 401
