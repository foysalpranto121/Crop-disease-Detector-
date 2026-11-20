"""End-to-end API tests with the real ONNX model and a temporary SQLite database."""

import io
import json
from pathlib import Path

import numpy as np
import pytest
from PIL import Image, ImageFilter

from conftest import FIXTURES

EXPECTED = {
    "apple_scab": "Apple Scab",
    "corn_common_rust": "Corn (Maize) with Common Rust",
    "grape_black_rot": "Grape with Black Rot",
    "pepper_bacterial_spot": "Bell Pepper with Bacterial Spot",
    "potato_late_blight": "Potato with Late Blight",
    "squash_powdery_mildew": "Squash with Powdery Mildew",
    "tomato_early_blight": "Tomato with Early Blight",
    "tomato_healthy": "Healthy Tomato Plant",
}


def jpeg_bytes(img: Image.Image) -> bytes:
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=90)
    return buf.getvalue()


def upload(client, data: bytes, name="leaf.jpg", mime="image/jpeg", headers=None):
    return client.post("/api/predict", files={"file": (name, data, mime)}, headers=headers or {})


# ---------- health & library ----------
def test_health(client):
    body = client.get("/api/health").json()
    assert body["status"] == "ok" and body["num_classes"] == 38 and body["chat"] is False


def test_crops_and_diseases(client):
    crops = client.get("/api/crops").json()
    assert len(crops) == 17
    assert all(c["supported"] for c in crops)
    assert [c["key"] for c in crops[:3]] == ["rice", "wheat", "jute"]  # Bangladesh crops first
    counts = {c["key"]: c["disease_count"] for c in crops}
    assert counts["tomato"] == 9 and counts["rice"] == 7 and counts["wheat"] == 7 and counts["jute"] == 17 and counts["soybean"] == 5

    diseases = client.get("/api/diseases").json()
    assert len(diseases) == 77
    assert len(client.get("/api/diseases?crop=potato").json()) == 3

    d = client.get("/api/diseases/30").json()
    assert d["class_label"] == "Tomato with Early Blight"
    assert {t["type"] for t in d["treatments"]} == {"chemical", "organic", "preventive"}
    assert d["name"]["bn"]  # bilingual
    assert client.get("/api/diseases/999").status_code == 404


def test_every_disease_photo_exists(client):
    public = Path(__file__).parents[2] / "frontend" / "public"
    for d in client.get("/api/diseases").json():
        if ":" not in d["class_label"]:  # every PlantVillage class has 3 real photos
            assert len(d["images"]) == 3, d["class_label"]
        for url in d["images"]:
            assert (public / url.lstrip("/")).is_file(), url


MODEL_DIR = Path(__file__).parents[1] / "model"
SEED = json.loads((Path(__file__).parents[1] / "app" / "seed" / "diseases.json").read_text(encoding="utf-8"))


def test_model_labels_match_database():
    labels = json.loads((MODEL_DIR / "labels.json").read_text(encoding="utf-8"))
    main = [d for d in SEED if ":" not in d["class_label"]]
    assert [d["class_label"] for d in sorted(main, key=lambda d: d["id"])] == labels
    assert [d["id"] for d in sorted(main, key=lambda d: d["id"])] == list(range(1, 39))


@pytest.mark.parametrize("model,crop,count", [("rice", "rice", 8), ("india", "wheat", 8), ("soybean", "soybean", 6), ("jute", "jute", 17)])
def test_specialist_labels_have_disease_rows(model, crop, count):
    labels = json.loads((MODEL_DIR / model / "labels.json").read_text(encoding="utf-8"))
    rows = {d["class_label"]: d["crop_key"] for d in SEED if d["class_label"].startswith(f"{model}:")}
    assert len(rows) == count
    assert all(rows[k] == crop for k in rows)
    assert set(rows) <= {f"{model}:{label}" for label in labels}


def test_health_lists_crop_models(client):
    models = client.get("/api/health").json()["crop_models"]
    assert set(models) == {"rice", "wheat", "soybean", "jute"}


@pytest.mark.parametrize("crop", ["rice", "wheat", "soybean", "jute", "potato"])
def test_predict_with_crop_stays_in_that_crop(client, crop):
    res = client.post("/api/predict", files={"file": ("leaf.jpg", (FIXTURES / "potato_late_blight.jpg").read_bytes(), "image/jpeg")}, data={"crop": crop})
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["status"] in {"ok", "low_confidence"}
    assert body["disease"]["crop"]["key"] == crop
    assert body["top_k"] and all(k["crop"] == body["disease"]["crop"]["name"] for k in body["top_k"])


def test_predict_unknown_crop(client):
    res = client.post("/api/predict", files={"file": ("leaf.jpg", (FIXTURES / "apple_scab.jpg").read_bytes(), "image/jpeg")}, data={"crop": "banana"})
    assert res.status_code == 422 and res.json()["detail"]["reason"] == "UNSUPPORTED_CROP"


# ---------- diagnosis ----------
@pytest.mark.parametrize("stem,label", EXPECTED.items())
def test_predict_sample_leaves(client, stem, label):
    res = upload(client, (FIXTURES / f"{stem}.jpg").read_bytes(), name=f"{stem}.jpg")
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["disease"]["class_label"] == label
    assert body["status"] in {"ok", "low_confidence"}
    assert len(body["top_k"]) == 3 and body["top_k"][0]["disease_id"] == body["disease"]["id"]
    assert all(k["image"].startswith("/diseases/") for k in body["top_k"])
    assert body["image_url"].startswith("/api/images/")
    assert body["latency_ms"] < 5000


def test_saved_image_has_no_exif(client):
    img = Image.open(FIXTURES / "tomato_healthy.jpg")
    exif = Image.Exif()
    exif[0x010F] = "SecretPhoneMaker"  # Make tag
    buf = io.BytesIO()
    img.save(buf, "JPEG", exif=exif)
    body = upload(client, buf.getvalue()).json()
    stored = client.get(body["image_url"])
    assert stored.status_code == 200
    assert b"SecretPhoneMaker" not in stored.content


@pytest.mark.parametrize(
    "make,reason",
    [
        (lambda: b"not an image at all", "UNSUPPORTED_FORMAT"),
        (lambda: jpeg_bytes(Image.new("RGB", (40, 40), (40, 160, 60))), "TOO_SMALL"),
        (lambda: jpeg_bytes(Image.new("RGB", (300, 300), (5, 5, 5))), "TOO_DARK"),
        (lambda: jpeg_bytes(Image.open(FIXTURES / "apple_scab.jpg").filter(ImageFilter.GaussianBlur(8))), "TOO_BLURRY"),
    ],
)
def test_predict_rejects_bad_photos(client, make, reason):
    res = upload(client, make())
    assert res.status_code == 422
    assert res.json()["detail"]["reason"] == reason


def test_predict_not_a_leaf(client):
    rng = np.random.default_rng(1)
    sky = (np.array([90, 160, 230]) + rng.normal(0, 10, (300, 300, 3))).clip(0, 255).astype("uint8")
    body = upload(client, jpeg_bytes(Image.fromarray(sky))).json()
    assert body["status"] == "not_a_leaf" and body["disease"] is None and body["top_k"] == []


def test_image_route_blocks_path_tricks(client):
    assert client.get("/api/images/..%2Fapp.db").status_code == 404
    assert client.get("/api/images/notarealimage.jpg").status_code == 404


# ---------- auth ----------
def test_register_login_me(client):
    reg = client.post("/api/auth/register", json={"name": "Karim", "email": "Karim@Example.com", "password": "secret1", "role": "farmer", "country": "Bangladesh", "district": "Rajshahi"})
    assert reg.status_code == 200, reg.text
    assert reg.json()["user"]["email"] == "karim@example.com"
    assert client.post("/api/auth/register", json={"name": "K2", "email": "karim@example.com", "password": "secret1"}).json()["detail"]["reason"] == "EMAIL_TAKEN"
    assert client.post("/api/auth/login", json={"email": "karim@example.com", "password": "wrong!"}).status_code == 401
    token = client.post("/api/auth/login", json={"email": "KARIM@example.com", "password": "secret1"}).json()["token"]
    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"}).json()
    assert me["name"] == "Karim" and me["district"] == "Rajshahi"
    assert client.get("/api/auth/me").status_code == 401
    assert client.get("/api/auth/me", headers={"Authorization": "Bearer garbage"}).status_code == 401


def test_register_validation(client):
    res = client.post("/api/auth/register", json={"name": "x", "email": "bad", "password": "1"})
    assert res.status_code == 422 and res.json()["detail"]["reason"] == "INVALID_INPUT"


# ---------- history, privacy, feedback ----------
def test_history_and_privacy(client, farmer_headers, admin_headers):
    mine = upload(client, (FIXTURES / "grape_black_rot.jpg").read_bytes(), headers=farmer_headers).json()
    history = client.get("/api/history", headers=farmer_headers).json()
    assert history[0]["id"] == mine["id"]

    # Other users (and guests) can't open a farmer's private scan; admins can.
    other = client.post("/api/auth/register", json={"name": "Other", "email": "other@example.com", "password": "secret1"}).json()["token"]
    assert client.get(f"/api/history/{mine['id']}", headers={"Authorization": f"Bearer {other}"}).status_code == 404
    assert client.get(f"/api/history/{mine['id']}").status_code == 404
    assert client.get(f"/api/history/{mine['id']}", headers=admin_headers).status_code == 200

    assert client.delete(f"/api/history/{mine['id']}", headers={"Authorization": f"Bearer {other}"}).status_code == 404
    assert client.delete(f"/api/history/{mine['id']}", headers=farmer_headers).status_code == 204
    assert client.get(f"/api/history/{mine['id']}", headers=farmer_headers).status_code == 404


def test_guest_result_and_feedback(client):
    guest = upload(client, (FIXTURES / "corn_common_rust.jpg").read_bytes()).json()
    assert client.get(f"/api/history/{guest['id']}").status_code == 200
    assert client.post(f"/api/predictions/{guest['id']}/feedback", json={"is_correct": False, "comment": "Looks like blight"}).json() == {"ok": True}
    assert client.get(f"/api/history/{guest['id']}").json()["feedback"] == {"is_correct": False}
    assert client.get("/api/history").status_code == 401


# ---------- admin ----------
def test_admin_requires_admin(client, farmer_headers):
    assert client.get("/api/admin/stats").status_code == 401
    assert client.get("/api/admin/stats", headers=farmer_headers).status_code == 403


def test_admin_dashboard_and_editing(client, admin_headers):
    stats = client.get("/api/admin/stats", headers=admin_headers).json()
    assert stats["total_scans"] >= 1 and len(stats["scans_per_day"]) == 7
    assert client.get("/api/admin/predictions", headers=admin_headers).status_code == 200
    assert any(f["comment"] == "Looks like blight" for f in client.get("/api/admin/feedback", headers=admin_headers).json())

    upd = client.put("/api/admin/diseases/30", headers=admin_headers, json={"name": {"en": "Early Blight (edited)", "bn": "আগাম ধসা"}})
    assert upd.json()["name"]["en"] == "Early Blight (edited)"

    t = client.post("/api/admin/diseases/30/treatments", headers=admin_headers, json={"type": "organic", "remedy": {"en": "Neem spray", "bn": "নিম স্প্রে"}}).json()
    assert client.put(f"/api/admin/treatments/{t['id']}", headers=admin_headers, json={"type": "organic", "remedy": {"en": "Neem oil spray", "bn": "নিম তেল"}}).json()["remedy"]["en"] == "Neem oil spray"
    assert client.delete(f"/api/admin/treatments/{t['id']}", headers=admin_headers).status_code == 204
    assert all(x["id"] != t["id"] for x in client.get("/api/diseases/30").json()["treatments"])


# ---------- chat ----------
def test_chat_without_key_and_validation(client):
    ok_body = {"messages": [{"role": "user", "content": "How to treat late blight?"}], "lang": "bn"}
    res = client.post("/api/chat", json=ok_body)
    assert res.status_code == 503 and res.json()["detail"]["reason"] == "AI_NOT_CONFIGURED"
    bad = client.post("/api/chat", json={"messages": [{"role": "assistant", "content": "hi"}]})
    assert bad.status_code == 422 and bad.json()["detail"]["reason"] == "INVALID_INPUT"


def test_unknown_api_route_is_json_404(client):
    res = client.get("/api/nope")
    assert res.status_code == 404 and res.json()["detail"]["reason"] == "NOT_FOUND"
