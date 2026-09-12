from dataclasses import dataclass
from enum import StrEnum


class ScanStatus(StrEnum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class ScanJobTransitionError(ValueError):
    """Raised when a scan lifecycle transition would violate a safety invariant."""


@dataclass(slots=True)
class ScanJob:
    id: str
    status: ScanStatus = ScanStatus.PENDING
    current_stage: str = "VALIDATING_TARGET"
    progress: int = 0

    @classmethod
    def create(cls, scan_id: str) -> "ScanJob":
        return cls(id=scan_id)

    def start(self) -> None:
        if self.status is not ScanStatus.PENDING:
            raise ScanJobTransitionError("Only pending scans can start")
        self.status = ScanStatus.RUNNING

    def advance(self, stage: str, progress: int) -> None:
        if self.status is not ScanStatus.RUNNING:
            raise ScanJobTransitionError("Only running scans can advance")
        if not self.progress <= progress <= 100:
            raise ScanJobTransitionError("Scan progress must be monotonic and within 0-100")
        self.current_stage = stage
        self.progress = progress

    def cancel(self) -> None:
        if self.status not in {ScanStatus.PENDING, ScanStatus.RUNNING}:
            raise ScanJobTransitionError("Only active scans can be cancelled")
        self.status = ScanStatus.CANCELLED

    def fail(self) -> None:
        if self.status not in {ScanStatus.PENDING, ScanStatus.RUNNING}:
            raise ScanJobTransitionError("Only active scans can fail")
        self.status = ScanStatus.FAILED

    def complete(self) -> None:
        if self.status is not ScanStatus.RUNNING:
            raise ScanJobTransitionError("Only running scans can complete")
        self.status = ScanStatus.COMPLETED
        self.current_stage = "COMPLETE"
        self.progress = 100

