def test_register_cookie_me_and_logout(client):
    response = client.post("/api/auth/register", json={"username": "reader_one", "password": "a-long-test-password"})
    assert response.status_code == 201
    cookie = response.headers.get("set-cookie", "").lower()
    assert "httponly" in cookie
    assert "samesite=lax" in cookie
    assert client.get("/api/auth/me").json()["user"]["username"] == "reader_one"
    assert client.post("/api/auth/logout").status_code == 204
    assert client.get("/api/auth/me").status_code == 401


def test_registration_rejects_short_password(client):
    response = client.post("/api/auth/register", json={"username": "reader_two", "password": "short"})
    assert response.status_code == 422


def test_cross_origin_api_preflight_allows_frontend_origin(client):
    response = client.options("/api/documents/1/review", headers={
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "PATCH",
        "Access-Control-Request-Headers": "content-type",
    })
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
