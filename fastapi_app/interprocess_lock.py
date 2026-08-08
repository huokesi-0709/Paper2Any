from __future__ import annotations

import asyncio
import errno
import os
import re
from contextlib import asynccontextmanager
from dataclasses import dataclass
from pathlib import Path
from typing import AsyncIterator

if os.name == "nt":
    import msvcrt
else:
    import fcntl

from dataflow_agent.utils import get_project_root

PROJECT_ROOT = get_project_root()
LOCK_ROOT = (PROJECT_ROOT / "outputs" / ".locks").resolve()


@dataclass(frozen=True)
class _HeldLockSlot:
    fd: int


class AsyncInterProcessSemaphore:
    """A small file-lock based semaphore that works across uvicorn workers."""

    def __init__(self, name: str, limit: int = 1, poll_interval: float = 0.2) -> None:
        safe_name = re.sub(r"[^A-Za-z0-9._-]+", "_", (name or "").strip()).strip("._")
        self._name = safe_name or "lock"
        self._limit = max(1, int(limit))
        self._poll_interval = max(0.05, float(poll_interval))

    def _slot_path(self, index: int) -> Path:
        return LOCK_ROOT / f"{self._name}.{index}.lock"

    @staticmethod
    def _lock(fd: int) -> None:
        if os.name == "nt":
            # msvcrt locks a byte range rather than the whole file.  Ensure the
            # first byte exists, then always use that byte as the lock region.
            if os.fstat(fd).st_size == 0:
                os.write(fd, b"\0")
            os.lseek(fd, 0, os.SEEK_SET)
            msvcrt.locking(fd, msvcrt.LK_NBLCK, 1)
            return

        fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)

    @staticmethod
    def _unlock(fd: int) -> None:
        if os.name == "nt":
            os.lseek(fd, 0, os.SEEK_SET)
            msvcrt.locking(fd, msvcrt.LK_UNLCK, 1)
            return

        fcntl.flock(fd, fcntl.LOCK_UN)

    def _try_acquire_once(self) -> _HeldLockSlot | None:
        LOCK_ROOT.mkdir(parents=True, exist_ok=True)
        for index in range(self._limit):
            fd = os.open(self._slot_path(index), os.O_CREAT | os.O_RDWR, 0o666)
            try:
                self._lock(fd)
            except OSError as exc:
                os.close(fd)
                if exc.errno in (errno.EACCES, errno.EAGAIN):
                    continue
                raise

            try:
                payload = f"pid={os.getpid()} slot={index}\n".encode("utf-8")
                os.lseek(fd, 0, os.SEEK_SET)
                os.write(fd, payload)
                os.ftruncate(fd, len(payload))
            except BaseException:
                try:
                    self._unlock(fd)
                finally:
                    os.close(fd)
                raise
            return _HeldLockSlot(fd=fd)
        return None

    async def acquire(self) -> _HeldLockSlot:
        while True:
            held = self._try_acquire_once()
            if held is not None:
                return held
            await asyncio.sleep(self._poll_interval)

    @staticmethod
    def release(held: _HeldLockSlot) -> None:
        try:
            AsyncInterProcessSemaphore._unlock(held.fd)
        finally:
            os.close(held.fd)

    @asynccontextmanager
    async def hold(self) -> AsyncIterator[None]:
        held = await self.acquire()
        try:
            yield
        finally:
            self.release(held)
