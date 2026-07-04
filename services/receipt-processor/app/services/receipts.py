from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status

from app.models.auth import AuthenticatedUser
from app.models.receipts import FileValidationResult, ReceiptCreate, ReceiptRecord
from app.services.processing import ReceiptProcessingService
from app.services.storage import ReceiptStorage
from app.services.supabase import ReceiptRepository

ALLOWED_MIME_TYPES = {
    "image/jpeg": {".jpg", ".jpeg"},
    "image/png": {".png"},
    "application/pdf": {".pdf"},
}


class ReceiptService:
    """Application service for receipt upload and lookup."""

    def __init__(
        self,
        repository: ReceiptRepository,
        storage: ReceiptStorage,
        processor: ReceiptProcessingService,
        max_upload_bytes: int,
    ) -> None:
        self.repository = repository
        self.storage = storage
        self.processor = processor
        self.max_upload_bytes = max_upload_bytes

    async def create_from_upload(self, user: AuthenticatedUser, file: UploadFile) -> ReceiptRecord:
        validated = await self._validate_upload(file)
        receipt_id = str(uuid4())
        now = datetime.now(UTC)
        filename = self._safe_filename(validated.filename)
        storage_path = f"{user.user_id}/{now:%Y}/{now:%m}/{receipt_id}/{filename}"
        await self.storage.upload(storage_path, validated.content, validated.mime_type)
        receipt = await self.repository.create(
            ReceiptCreate(
                id=receipt_id,
                user_id=user.user_id,
                original_filename=filename,
                storage_path=storage_path,
                mime_type=validated.mime_type,
                file_size=validated.size,
            )
        )
        return await self.processor.process(receipt, validated.content)

    async def get_for_user(self, receipt_id: str, user: AuthenticatedUser) -> ReceiptRecord:
        receipt = await self.repository.get(receipt_id)
        if receipt is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Receipt not found")
        if receipt.user_id != user.user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Receipt access denied",
            )
        return receipt

    async def _validate_upload(self, file: UploadFile) -> FileValidationResult:
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Filename is required",
            )
        content = await file.read()
        if not content:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File is empty")
        if len(content) > self.max_upload_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="File is too large",
            )
        mime_type = file.content_type or ""
        extension = Path(file.filename).suffix.lower()
        allowed_extensions = ALLOWED_MIME_TYPES.get(mime_type)
        if not allowed_extensions:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="Unsupported file type",
            )
        if extension not in allowed_extensions:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="Unsupported file extension",
            )
        return FileValidationResult(filename=file.filename, mime_type=mime_type, content=content)

    def _safe_filename(self, filename: str) -> str:
        return "".join(char if char.isalnum() or char in "._-" else "-" for char in filename)
