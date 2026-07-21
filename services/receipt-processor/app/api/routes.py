from fastapi import APIRouter, Depends, File, Response, UploadFile, status

from app.api.deps import get_current_user, get_receipt_service
from app.core.config import Settings, get_settings
from app.models.auth import AuthenticatedUser
from app.models.receipts import HealthResponse, ReceiptResponse
from app.services.receipts import ReceiptService

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health(settings: Settings = Depends(get_settings)) -> HealthResponse:
    return HealthResponse(version=settings.app_version)


@router.post("/v1/receipts", response_model=ReceiptResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_receipt(
    file: UploadFile = File(...),
    user: AuthenticatedUser = Depends(get_current_user),
    service: ReceiptService = Depends(get_receipt_service),
) -> ReceiptResponse:
    receipt = await service.create_from_upload(user, file)
    return ReceiptResponse(receipt=receipt)


@router.get("/v1/receipts/{receipt_id}", response_model=ReceiptResponse)
async def get_receipt(
    receipt_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
    service: ReceiptService = Depends(get_receipt_service),
) -> ReceiptResponse:
    receipt = await service.get_for_user(receipt_id, user)
    return ReceiptResponse(receipt=receipt)


@router.post("/v1/receipts/{receipt_id}/reprocess", response_model=ReceiptResponse)
async def reprocess_receipt(
    receipt_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
    service: ReceiptService = Depends(get_receipt_service),
) -> ReceiptResponse:
    receipt = await service.reprocess_for_user(receipt_id, user)
    return ReceiptResponse(receipt=receipt)


@router.delete("/v1/receipts/{receipt_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_receipt(
    receipt_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
    service: ReceiptService = Depends(get_receipt_service),
) -> Response:
    await service.delete_for_user(receipt_id, user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
