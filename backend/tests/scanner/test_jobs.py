import pytest

from backend.scanner.jobs import ScanJob, ScanJobTransitionError, ScanStatus


def test_job_advances_through_monotonic_stages() -> None:
    job = ScanJob.create("scan-1")

    job.start()
    job.advance("CRAWLING", 12)
    job.advance("HEADERS", 30)

    assert job.status is ScanStatus.RUNNING
    assert job.current_stage == "HEADERS"
    assert job.progress == 30


def test_cancelled_job_cannot_advance() -> None:
    job = ScanJob.create("scan-1")
    job.start()
    job.cancel()

    with pytest.raises(ScanJobTransitionError):
        job.advance("CRAWLING", 12)


def test_job_can_fail() -> None:
    job = ScanJob.create("scan-1")
    job.start()
    job.fail()
    assert job.status is ScanStatus.FAILED


def test_completed_job_cannot_fail() -> None:
    job = ScanJob.create("scan-1")
    job.start()
    job.complete()

    with pytest.raises(ScanJobTransitionError):
        job.fail()

