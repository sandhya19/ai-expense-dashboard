import logging
from decimal import Decimal

from app.dspy_pipeline.pipeline import ReceiptExtractionPipeline
from app.models.receipts import ProcessingStatus, ReceiptItemCreate, ReceiptRecord
from app.providers.embeddings import EmbeddingProvider
from app.providers.ocr import OCRProvider
from app.services.line_item_refinement import LineItemRefiner
from app.services.supabase import ReceiptRepository

logger = logging.getLogger(__name__)


def confidence_percent(*scores: float) -> int:
    """Convert module confidence scores into a dashboard percentage."""
    valid_scores = [score for score in scores if score > 0]

    if not valid_scores:
        return 0

    return round((sum(valid_scores) / len(valid_scores)) * 100)


def line_items_match_total(items: list[ReceiptItemCreate], total: Decimal | None) -> bool:
    """Return whether extracted line items reconcile to the receipt total."""
    if total is None or not items:
        return False

    item_total = sum((item.total for item in items if item.total is not None), Decimal("0"))
    return abs(item_total - total) <= Decimal("0.01")


class ReceiptProcessingService:
    """Coordinates OCR, extraction, embeddings, and receipt updates."""

    def __init__(
        self,
        repository: ReceiptRepository,
        ocr_provider: OCRProvider,
        embedding_provider: EmbeddingProvider,
        pipeline: ReceiptExtractionPipeline,
        line_item_refiner: LineItemRefiner | None = None,
    ) -> None:
        self.repository = repository
        self.ocr_provider = ocr_provider
        self.embedding_provider = embedding_provider
        self.pipeline = pipeline
        self.line_item_refiner = line_item_refiner

    async def process(self, receipt: ReceiptRecord, content: bytes) -> ReceiptRecord:
        await self.repository.update(receipt.id, {"processing_status": ProcessingStatus.processing})
        try:
            ocr = await self.ocr_provider.extract_text(content, receipt.mime_type)
            if ocr.error:
                raise RuntimeError(ocr.error)
            extraction = self.pipeline.run(ocr.raw_text)
            embedding = await self.embedding_provider.embed_text(ocr.raw_text)

            merchant = extraction.merchant.merchant_name or receipt.merchant
            transaction_date = extraction.transaction_date.transaction_date or receipt.receipt_date
            total = (
                extraction.total.amount
                if extraction.total.amount is not None
                else receipt.total
            )
            currency = extraction.currency.currency or receipt.currency
            category = extraction.category.category or receipt.category
            confidence = confidence_percent(
                extraction.merchant.confidence,
                extraction.transaction_date.confidence,
                extraction.items.confidence,
                extraction.total.confidence,
                extraction.currency.confidence,
                extraction.category.confidence,
            )
            items = [
                ReceiptItemCreate(
                    receipt_id=receipt.id,
                    user_id=receipt.user_id,
                    description=item.description,
                    quantity=item.quantity,
                    unit_price=item.unit_price,
                    total=item.total,
                )
                for item in extraction.items.items
            ]
            if not line_items_match_total(items, total) and self.line_item_refiner is not None:
                refined_items = await self.line_item_refiner.refine(ocr.raw_text, total)
                if refined_items is not None:
                    refined_candidates = [
                        ReceiptItemCreate(
                            receipt_id=receipt.id,
                            user_id=receipt.user_id,
                            description=item.description,
                            quantity=item.quantity,
                            unit_price=item.unit_price,
                            total=item.total,
                        )
                        for item in refined_items
                    ]
                    if line_items_match_total(refined_candidates, total):
                        items = refined_candidates
                    else:
                        logger.info("line_item_refinement_rejected receipt_id=%s", receipt.id)
            await self.repository.replace_items(receipt.id, items)
            dashboard_status = "completed" if line_items_match_total(items, total) else "review"

            processed_receipt = await self.repository.update(
                receipt.id,
                {
                    "processing_status": ProcessingStatus.completed,
                    "status": dashboard_status,
                    "raw_ocr_text": ocr.raw_text,
                    "merchant_name": extraction.merchant.merchant_name,
                    "merchant": merchant,
                    "transaction_date": extraction.transaction_date.transaction_date,
                    "receipt_date": transaction_date,
                    "subtotal": extraction.subtotal.amount,
                    "tax": extraction.tax.amount,
                    "total": total,
                    "currency": currency,
                    "category": category,
                    "confidence": confidence,
                    "ai_summary": extraction.summary.summary,
                    "embedding": embedding.vector,
                    "ocr_provider": ocr.provider_name,
                    "error_message": None,
                },
            )
            try:
                await self.repository.persist_intelligence(processed_receipt)
            except Exception:
                logger.exception("intelligence_persistence_failed receipt_id=%s", receipt.id)
            return processed_receipt
        except Exception as exc:
            logger.exception("receipt_processing_failed receipt_id=%s", receipt.id)
            return await self.repository.update(
                receipt.id,
                {
                    "processing_status": ProcessingStatus.failed,
                    "status": "failed",
                    "error_message": str(exc),
                    "ocr_provider": self.ocr_provider.name,
                },
            )
