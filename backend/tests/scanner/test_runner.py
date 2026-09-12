import asyncio
from typing import Any
import pytest

from backend.scanner.runner import run_scan_job, cancel_job_in_memory


class MockResponse:
    def __init__(self, data: Any) -> None:
        self.data = data


class MockTable:
    def __init__(self, initial_rows: list[dict[str, Any]] | None = None) -> None:
        self.rows: list[dict[str, Any]] = [dict(r) for r in (initial_rows or [])]
        self._filters: list[tuple[str, Any]] = []
        self._pending_update: dict[str, Any] | None = None

    def select(self, *columns: str) -> "MockTable":
        return self

    def insert(self, record: dict[str, Any]) -> "MockTable":
        new_row = dict(record)
        if "id" not in new_row:
            new_row["id"] = f"id-{len(self.rows) + 1}"
        self.rows.append(new_row)
        self._last_inserted = [new_row]
        return self

    def update(self, values: dict[str, Any]) -> "MockTable":
        self._pending_update = dict(values)
        return self

    def eq(self, column: str, value: Any) -> "MockTable":
        self._filters.append((column, value))
        return self

    def in_(self, column: str, values: list[Any]) -> "MockTable":
        self._filters.append((column, set(values)))
        return self

    def neq(self, column: str, value: Any) -> "MockTable":
        self._filters.append((f"!{column}", value))
        return self

    def order(self, column: str, desc: bool = False) -> "MockTable":
        return self

    def execute(self) -> MockResponse:
        filtered = self.rows
        for col, val in self._filters:
            if col.startswith("!"):
                real_col = col[1:]
                filtered = [r for r in filtered if r.get(real_col) != val]
            elif isinstance(val, set):
                filtered = [r for r in filtered if r.get(col) in val]
            else:
                filtered = [r for r in filtered if r.get(col) == val]

        if self._pending_update is not None:
            for r in filtered:
                r.update(self._pending_update)
            result_data = [dict(r) for r in filtered]
            self._pending_update = None
            self._filters = []
            return MockResponse(result_data)

        if hasattr(self, "_last_inserted"):
            res = MockResponse(list(self._last_inserted))
            del self._last_inserted
            self._filters = []
            return res

        result_data = [dict(r) for r in filtered]
        self._filters = []
        return MockResponse(result_data)


class MockDatabase:
    def __init__(self, tables: dict[str, list[dict[str, Any]]] | None = None) -> None:
        self._tables: dict[str, MockTable] = {}
        if tables:
            for name, rows in tables.items():
                self._tables[name] = MockTable(rows)

    def table(self, name: str) -> MockTable:
        if name not in self._tables:
            self._tables[name] = MockTable([])
        return self._tables[name]


@pytest.mark.asyncio
async def test_run_scan_job_advances_to_completion() -> None:
    scan_id = "scan-123"
    website_id = "web-123"
    db = MockDatabase({
        "scan_jobs": [{
            "id": scan_id,
            "website_id": website_id,
            "user_id": "user-1",
            "status": "PENDING",
            "current_stage": "VALIDATING_TARGET",
            "progress": 0,
            "finished_at": None,
        }],
        "websites": [{
            "id": website_id,
            "user_id": "user-1",
            "url": "https://example.com",
            "verification_status": "VERIFIED",
            "last_score": None,
        }],
    })

    async def mock_resolver(host: str) -> list[str]:
        return ["93.184.216.34"]

    await run_scan_job(
        scan_id=scan_id,
        target_url="https://example.com",
        website_id=website_id,
        database=db,
        resolver=mock_resolver,
        delay_seconds=0.01,
    )

    scans = db.table("scan_jobs").rows
    assert len(scans) == 1
    assert scans[0]["status"] == "COMPLETED"
    assert scans[0]["progress"] == 100
    assert scans[0]["current_stage"] == "COMPLETE"
    assert scans[0]["finished_at"] is not None
    assert scans[0]["score"] is not None

    websites = db.table("websites").rows
    assert websites[0]["last_score"] == scans[0]["score"]


@pytest.mark.asyncio
async def test_run_scan_job_stops_if_cancelled_before_run() -> None:
    scan_id = "scan-cancel-pre"
    website_id = "web-123"
    db = MockDatabase({
        "scan_jobs": [{
            "id": scan_id,
            "website_id": website_id,
            "user_id": "user-1",
            "status": "CANCELLED",
            "current_stage": "VALIDATING_TARGET",
            "progress": 0,
            "finished_at": "2026-09-12T04:00:00+00:00",
        }],
    })

    await run_scan_job(
        scan_id=scan_id,
        target_url="https://example.com",
        website_id=website_id,
        database=db,
        delay_seconds=0.01,
    )

    scans = db.table("scan_jobs").rows
    assert scans[0]["status"] == "CANCELLED"
    assert scans[0]["progress"] == 0


@pytest.mark.asyncio
async def test_run_scan_job_handles_in_flight_cancellation() -> None:
    scan_id = "scan-cancel-mid"
    website_id = "web-123"
    db = MockDatabase({
        "scan_jobs": [{
            "id": scan_id,
            "website_id": website_id,
            "user_id": "user-1",
            "status": "PENDING",
            "current_stage": "VALIDATING_TARGET",
            "progress": 0,
            "finished_at": None,
        }],
    })

    async def mock_resolver(host: str) -> list[str]:
        return ["93.184.216.34"]

    # Trigger cancellation via cancel_job_in_memory right before or during
    cancel_job_in_memory(scan_id)

    await run_scan_job(
        scan_id=scan_id,
        target_url="https://example.com",
        website_id=website_id,
        database=db,
        resolver=mock_resolver,
        delay_seconds=0.01,
    )

    scans = db.table("scan_jobs").rows
    assert scans[0]["status"] == "CANCELLED"
    assert scans[0]["finished_at"] is not None


@pytest.mark.asyncio
async def test_run_scan_job_fails_on_ssrf_resolution() -> None:
    scan_id = "scan-ssrf"
    website_id = "web-123"
    db = MockDatabase({
        "scan_jobs": [{
            "id": scan_id,
            "website_id": website_id,
            "user_id": "user-1",
            "status": "PENDING",
            "current_stage": "VALIDATING_TARGET",
            "progress": 0,
            "finished_at": None,
        }],
    })

    async def mock_resolver(host: str) -> list[str]:
        return ["127.0.0.1"]

    await run_scan_job(
        scan_id=scan_id,
        target_url="https://localhost",
        website_id=website_id,
        database=db,
        resolver=mock_resolver,
        delay_seconds=0.01,
        allow_local=False,
    )

    scans = db.table("scan_jobs").rows
    assert scans[0]["status"] == "FAILED"
    assert scans[0]["error_code"] == "SSRF_VALIDATION_FAILED"
    assert "public network validation" in scans[0]["error_message_safe"]
    assert scans[0]["finished_at"] is not None
