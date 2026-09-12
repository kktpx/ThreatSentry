from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.core.config import Settings, get_settings
from backend.api.routers.websites import router as websites_router
from backend.api.routers.scans import router as scans_router
from backend.api.routers.findings import router as findings_router
from backend.api.routers.model import router as model_router


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    app = FastAPI(title="ThreatSentry API", version="0.1.0")
    development_origin_pattern = (
        r"^http://(?:localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|"
        r"10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}):3000$"
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.allowed_origins),
        allow_origin_regex=development_origin_pattern if settings.app_env == "development" else None,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"] if settings.app_env == "development" else ["Authorization", "Content-Type", "X-Request-Id"],
    )
    app.include_router(websites_router)
    app.include_router(scans_router)
    app.include_router(findings_router)
    app.include_router(model_router)

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request, exc: Exception):
        import logging
        from fastapi.responses import JSONResponse
        logging.getLogger(__name__).exception("Unhandled exception on %s: %s", request.url.path, exc)
        return JSONResponse(
            status_code=500,
            content={"detail": "An internal server error occurred."},
            headers={
                "Access-Control-Allow-Origin": request.headers.get("origin", "*"),
                "Access-Control-Allow-Credentials": "true",
            }
        )


    @app.get("/health")
    async def health() -> dict[str, object]:
        from backend.ml.loader import get_ml_predictor
        predictor = get_ml_predictor()
        return {
            "status": "ok",
            "service": "threatsentry-api",
            "model": {
                "status": "ready" if predictor.is_ready else "heuristic",
                "version": predictor.version,
            },
        }

    return app


app = create_app()
