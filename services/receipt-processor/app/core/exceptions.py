class ReceiptProcessorError(Exception):
    """Base exception for expected service errors."""


class ExternalProviderError(ReceiptProcessorError):
    """Raised when an external provider fails permanently."""


class TemporaryProviderError(ReceiptProcessorError):
    """Raised when an external provider may succeed on retry."""
