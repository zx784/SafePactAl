from abc import ABC, abstractmethod
from typing import Generic, Optional, TypeVar

T = TypeVar("T")


class BaseRepository(ABC, Generic[T]):
    """Abstract CRUD interface. Swap in-memory store for Redis/DB by subclassing."""

    @abstractmethod
    def get(self, id: str) -> Optional[T]:
        ...

    @abstractmethod
    def create(self, entity: T) -> T:
        ...

    @abstractmethod
    def update(self, id: str, **kwargs) -> Optional[T]:
        ...

    @abstractmethod
    def delete(self, id: str) -> bool:
        ...

    @abstractmethod
    def exists(self, id: str) -> bool:
        ...
