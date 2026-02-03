from typing import Optional, List, Generic, TypeVar
from pydantic import BaseModel
from datetime import datetime

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    """Standard API response wrapper"""
    data: T
    success: bool = True
    message: Optional[str] = None


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated response wrapper"""
    data: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int
    
    @classmethod
    def create(cls, data: List[T], total: int, page: int, page_size: int):
        total_pages = (total + page_size - 1) // page_size if page_size > 0 else 0
        return cls(
            data=data,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )


class ErrorResponse(BaseModel):
    """Error response"""
    success: bool = False
    message: str
    detail: Optional[str] = None
