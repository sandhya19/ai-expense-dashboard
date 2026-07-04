from fastapi import FastAPI

from app.api.routes import router
from app.core.config import get_settings
from app.core.logging import configure_logging


def create_app() -> FastAPI:
    """Create the FastAPI app with configured routes."""
    settings = get_settings()
    configure_logging(settings.log_level)
    app = FastAPI(title="Receipt Processor", version=settings.app_version)
    app.include_router(router)
    return app


app = create_app()
