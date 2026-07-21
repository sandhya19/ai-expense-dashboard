"""Durable receipt-processing worker run by the FastAPI service."""

import asyncio
import contextlib
import logging

from app.models.receipts import ProcessingStatus, ReceiptProcessingJob
from app.services.processing import ReceiptProcessingService
from app.services.storage import ReceiptStorage
from app.services.supabase import ReceiptRepository

logger = logging.getLogger(__name__)


class ReceiptProcessingWorker:
    """Claims persisted jobs so work survives request completion and restarts."""

    def __init__(
        self,
        repository: ReceiptRepository,
        storage: ReceiptStorage,
        processor: ReceiptProcessingService,
        poll_seconds: float,
        lock_seconds: int,
    ) -> None:
        self.repository = repository
        self.storage = storage
        self.processor = processor
        self.poll_seconds = poll_seconds
        self.lock_seconds = lock_seconds
        self._task: asyncio.Task[None] | None = None

    def start(self) -> None:
        self._task = asyncio.create_task(self._run(), name="receipt-processing-worker")

    async def stop(self) -> None:
        if self._task is None:
            return
        self._task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await self._task

    async def run_once(self) -> bool:
        job = await self.repository.claim_processing_job(self.lock_seconds)
        if job is None:
            return False

        try:
            receipt = await self.repository.get(job.receipt_id)
            if receipt is None:
                await self.repository.complete_processing_job(job.id)
                return True
            content = await self.storage.download(receipt.storage_path)
            updated = await self.processor.process(receipt, content)
            if updated.processing_status == ProcessingStatus.failed:
                await self._retry(job, updated.error_message or "Receipt processing failed")
            else:
                await self.repository.complete_processing_job(job.id)
        except Exception as exc:
            logger.exception("receipt_job_failed job_id=%s receipt_id=%s", job.id, job.receipt_id)
            await self._retry(job, str(exc) or "Receipt processing failed")
        return True

    async def _retry(self, job: ReceiptProcessingJob, error: str) -> None:
        # The repository keeps retry state durable; the receipt returns to queued
        # unless this was its final allowed attempt.
        if job.attempt_count < job.max_attempts:
            await self.repository.update(
                job.receipt_id,
                {
                    "processing_status": ProcessingStatus.uploaded,
                    "status": "processing",
                    "error_message": error[:1000],
                },
            )
        await self.repository.retry_processing_job(job, error)

    async def _run(self) -> None:
        while True:
            try:
                did_process = await self.run_once()
            except Exception:
                logger.exception("receipt_worker_iteration_failed")
                did_process = False
            if not did_process:
                await asyncio.sleep(self.poll_seconds)
