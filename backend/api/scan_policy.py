class ScanAuthorizationError(ValueError):
    """Raised when a target has not completed ownership verification."""


def require_verified_website(verification_status: str) -> None:
    if verification_status != "VERIFIED":
        raise ScanAuthorizationError("A website must be verified before a scan can start")
