from __future__ import annotations

import asyncio
import subprocess
import sys
from pathlib import Path

from fastapi_app import interprocess_lock


def test_lock_can_be_acquired_and_released(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setattr(interprocess_lock, "LOCK_ROOT", tmp_path)
    semaphore = interprocess_lock.AsyncInterProcessSemaphore("basic")

    held = semaphore._try_acquire_once()
    assert held is not None
    semaphore.release(held)

    reacquired = semaphore._try_acquire_once()
    assert reacquired is not None
    semaphore.release(reacquired)


def test_lock_excludes_another_process(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setattr(interprocess_lock, "LOCK_ROOT", tmp_path)
    semaphore = interprocess_lock.AsyncInterProcessSemaphore("cross-process")
    held = semaphore._try_acquire_once()
    assert held is not None

    child_code = """
import pathlib
import sys
from fastapi_app import interprocess_lock

interprocess_lock.LOCK_ROOT = pathlib.Path(sys.argv[1])
semaphore = interprocess_lock.AsyncInterProcessSemaphore("cross-process")
held = semaphore._try_acquire_once()
print("acquired" if held is not None else "blocked")
if held is not None:
    semaphore.release(held)
"""
    try:
        result = subprocess.run(
            [sys.executable, "-c", child_code, str(tmp_path)],
            check=True,
            capture_output=True,
            text=True,
        )
    finally:
        semaphore.release(held)

    assert result.stdout.strip() == "blocked"


def test_async_context_manager_releases_lock(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setattr(interprocess_lock, "LOCK_ROOT", tmp_path)
    semaphore = interprocess_lock.AsyncInterProcessSemaphore("context")

    async def exercise() -> None:
        async with semaphore.hold():
            assert semaphore._try_acquire_once() is None

        reacquired = semaphore._try_acquire_once()
        assert reacquired is not None
        semaphore.release(reacquired)

    asyncio.run(exercise())
