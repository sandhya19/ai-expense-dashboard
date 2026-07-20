from typing import Protocol

import httpx

from app.core.config import Settings


class ReceiptStorage(Protocol):
    """Storage interface for original receipt files."""

    async def upload(self, path: str, content: bytes, mime_type: str) -> None:
        """Store receipt bytes at path."""

    async def download(self, path: str) -> bytes:
        """Load receipt bytes from path."""

    async def delete(self, path: str) -> None:
        """Remove receipt bytes from storage."""


class MemoryReceiptStorage:
    """In-memory storage for local development and tests."""

    def __init__(self) -> None:
        self.objects: dict[str, bytes] = {}

    async def upload(self, path: str, content: bytes, mime_type: str) -> None:
        self.objects[path] = content

    async def download(self, path: str) -> bytes:
        return self.objects[path]

    async def delete(self, path: str) -> None:
        self.objects.pop(path, None)


class SupabaseReceiptStorage:
    """Supabase private bucket storage implementation."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    async def upload(self, path: str, content: bytes, mime_type: str) -> None:
        url = (
            f"{self.settings.supabase_url}/storage/v1/object/"
            f"{self.settings.supabase_receipts_bucket}/{path}"
        )
        headers = {
            "Authorization": f"Bearer {self.settings.supabase_service_role_key}",
            "Content-Type": mime_type,
            "x-upsert": "false",
        }
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(url, headers=headers, content=content)
            response.raise_for_status()

    async def download(self, path: str) -> bytes:
        url = (
            f"{self.settings.supabase_url}/storage/v1/object/"
            f"{self.settings.supabase_receipts_bucket}/{path}"
        )
        headers = {
            "Authorization": f"Bearer {self.settings.supabase_service_role_key}",
        }
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            return response.content

    async def delete(self, path: str) -> None:
        url = (
            f"{self.settings.supabase_url}/storage/v1/object/"
            f"{self.settings.supabase_receipts_bucket}/{path}"
        )
        headers = {"Authorization": f"Bearer {self.settings.supabase_service_role_key}"}
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.delete(url, headers=headers)
            response.raise_for_status()
