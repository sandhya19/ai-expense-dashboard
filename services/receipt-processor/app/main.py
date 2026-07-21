from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.deps import get_line_item_refiner, get_ocr_provider, get_repository, get_storage
from app.api.routes import router
from app.core.config import get_settings
from app.core.logging import configure_logging
from app.dspy_pipeline.pipeline import ReceiptExtractionPipeline
from app.providers.embeddings import MockEmbeddingProvider
from app.services.jobs import ReceiptProcessingWorker
from app.services.processing import ReceiptProcessingService


def create_app() -> FastAPI:
    """Create the FastAPI app with configured routes."""
    settings = get_settings()
    configure_logging(settings.log_level)
    @asynccontextmanager
    async def lifespan(_: FastAPI) -> AsyncIterator[None]:
        worker: ReceiptProcessingWorker | None = None
        if settings.async_worker_enabled:
            repository = get_repository(settings)
            storage = get_storage(settings)
            processor = ReceiptProcessingService(
                repository=repository,
                ocr_provider=get_ocr_provider(settings),
                embedding_provider=MockEmbeddingProvider(),
                pipeline=ReceiptExtractionPipeline(),
                line_item_refiner=get_line_item_refiner(settings),
            )
            worker = ReceiptProcessingWorker(
                repository, storage, processor, settings.async_worker_poll_seconds,
                settings.async_worker_lock_seconds,
            )
            worker.start()
        yield
        if worker is not None:
            await worker.stop()

    app = FastAPI(title="Receipt Processor", version=settings.app_version, lifespan=lifespan)
    app.include_router(router)
    return app


app = create_app()
