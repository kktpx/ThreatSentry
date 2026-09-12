from backend.api.websites import create_website_record


def test_create_website_record_normalizes_target_and_creates_ownership_token() -> None:
    record = create_website_record("Example", "HTTPS://Example.COM:443/login#ignore")

    assert record["name"] == "Example"
    assert record["url"] == "https://example.com/login"
    assert record["normalized_origin"] == "https://example.com"
    assert record["verification_status"] == "UNVERIFIED"
    assert len(record["verification_token"]) >= 32
