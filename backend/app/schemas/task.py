from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime, date
from uuid import UUID
from app.models.task import TaskPriority, TaskStatus


class TaskStatusChangeResponse(BaseModel):
    id: UUID
    task_id: UUID
    from_status: TaskStatus
    to_status: TaskStatus
    changed_by: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True


class TaskBase(BaseModel):
    target_company_id: UUID
    target_employee_id: UUID
    name: str = Field(..., min_length=1, max_length=255)
    note: Optional[str] = None
    priority: TaskPriority
    status: TaskStatus
    deadline: date


class TaskCreate(TaskBase):
    attached_document_ids: List[UUID] = Field(default_factory=list)
    attached_declaration_ids: List[UUID] = Field(default_factory=list)
    attached_certificate_ids: List[UUID] = Field(default_factory=list)


class TaskUpdate(BaseModel):
    target_company_id: Optional[UUID] = None
    target_employee_id: Optional[UUID] = None
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    note: Optional[str] = None
    priority: Optional[TaskPriority] = None
    deadline: Optional[date] = None
    attached_document_ids: Optional[List[UUID]] = None
    attached_declaration_ids: Optional[List[UUID]] = None
    attached_certificate_ids: Optional[List[UUID]] = None


class TaskResponse(TaskBase):
    id: UUID
    created_by_user_id: UUID
    created_by_company_id: UUID
    attached_document_ids: List[UUID] = []
    attached_declaration_ids: List[UUID] = []
    attached_certificate_ids: List[UUID] = []
    status_history: List[TaskStatusChangeResponse] = []
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class TaskStatusUpdateRequest(BaseModel):
    status: TaskStatus


class TaskFilters(BaseModel):
    search: Optional[str] = None
    priority: Optional[TaskPriority] = None
    status: Optional[TaskStatus] = None
    target_employee_id: Optional[UUID] = None
    owner_type: Optional[str] = None  # 'mine', 'all', 'employee'
