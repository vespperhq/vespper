import os
import asyncio
import aiofiles
from storage.base import BaseStorage


class AsyncFileStorage(BaseStorage):
    def __init__(self, directory):
        self.directory = directory

    async def save(self, data, file_path):
        full_path = os.path.join(self.directory, file_path)

        await asyncio.to_thread(os.makedirs, os.path.dirname(full_path), exist_ok=True)
        async with aiofiles.open(full_path, "wb") as f:
            await f.write(data)

    async def load(self, file_path):
        full_path = os.path.join(self.directory, file_path)
        async with aiofiles.open(full_path, "rb") as f:
            return await f.read()

    async def delete(self, file_path):
        full_path = os.path.join(self.directory, file_path)
        await asyncio.to_thread(os.remove, full_path)

    async def list(self, directory_path):
        full_path = os.path.join(self.directory, directory_path)
        return await asyncio.to_thread(os.listdir, full_path)

    async def exists(self, file_path):
        full_path = os.path.join(self.directory, file_path)
        return await asyncio.to_thread(os.path.exists, full_path)
