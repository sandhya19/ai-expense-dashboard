from fastapi import Depends, Header, HTTPException, status

from app.core.config import Settings, get_settings
from app.core.security import SupabaseAuthTokenVerifier, TokenVerifier
from app.dspy_pipeline.pipeline import ReceiptExtractionPipeline
from app.models.auth import AuthenticatedUser
from app.providers.embeddings import MockEmbeddingProvider
from app.providers.ocr import OCRProvider, create_ocr_provider
from app.services.processing import ReceiptProcessingService
from app.services.receipts import ReceiptService
from app.services.storage import MemoryReceiptStorage, ReceiptStorage, SupabaseReceiptStorage
from app.services.supabase import (
    MemoryReceiptRepository,
    ReceiptRepository,
    SupabaseReceiptRepository,
)

_memory_repository = MemoryReceiptRepository()
_memory_storage = MemoryReceiptStorage()


def get_token_verifier(settings: Settings = Depends(get_settings)) -> TokenVerifier:
    return SupabaseAuthTokenVerifier(settings)


async def get_current_user(
    authorization: str | None = Header(default=None),
    verifier: TokenVerifier = Depends(get_token_verifier),
) -> AuthenticatedUser:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication",
        )
    return await verifier.verify(authorization.removeprefix("Bearer ").strip())


def get_repository(settings: Settings = Depends(get_settings)) -> ReceiptRepository:
    if settings.repository_backend == "supabase":
        return SupabaseReceiptRepository(settings)
    return _memory_repository


def get_storage(settings: Settings = Depends(get_settings)) -> ReceiptStorage:
    if settings.storage_backend == "supabase":
        return SupabaseReceiptStorage(settings)
    return _memory_storage


def get_ocr_provider(settings: Settings = Depends(get_settings)) -> OCRProvider:
    return create_ocr_provider(settings)


def get_processing_service(
    repository: ReceiptRepository = Depends(get_repository),
    ocr_provider: OCRProvider = Depends(get_ocr_provider),
) -> ReceiptProcessingService:
    return ReceiptProcessingService(
        repository=repository,
        ocr_provider=ocr_provider,
        embedding_provider=MockEmbeddingProvider(),
        pipeline=ReceiptExtractionPipeline(),
    )


def get_receipt_service(
    repository: ReceiptRepository = Depends(get_repository),
    storage: ReceiptStorage = Depends(get_storage),
    processor: ReceiptProcessingService = Depends(get_processing_service),
    settings: Settings = Depends(get_settings),
) -> ReceiptService:
    return ReceiptService(repository, storage, processor, settings.max_upload_bytes)
