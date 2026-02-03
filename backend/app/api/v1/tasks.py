from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from uuid import UUID
from typing import Optional
from datetime import date

from app.database import get_db
from app.models import (
    User, Task, TaskStatusChange, TaskPriority, TaskStatus,
    Document, Declaration, Certificate, UserRole
)
from app.schemas import (
    ApiResponse, PaginatedResponse,
    TaskCreate, TaskUpdate, TaskResponse,
    TaskStatusUpdateRequest, TaskStatusChangeResponse
)
from app.api.deps import get_current_user
from app.services.notification import create_notification

router = APIRouter(prefix="/tasks", tags=["Tasks"])


def task_to_response(task: Task) -> TaskResponse:
    """Convert task model to response schema."""
    return TaskResponse(
        id=task.id,
        target_company_id=task.target_company_id,
        target_employee_id=task.target_employee_id,
        name=task.name,
        note=task.note,
        priority=task.priority,
        status=task.status,
        deadline=task.deadline,
        created_by_user_id=task.created_by_user_id,
        created_by_company_id=task.created_by_company_id,
        attached_document_ids=[d.id for d in task.attached_documents] if task.attached_documents else [],
        attached_declaration_ids=[d.id for d in task.attached_declarations] if task.attached_declarations else [],
        attached_certificate_ids=[c.id for c in task.attached_certificates] if task.attached_certificates else [],
        status_history=[
            TaskStatusChangeResponse(
                id=s.id,
                task_id=s.task_id,
                from_status=s.from_status,
                to_status=s.to_status,
                changed_by=s.changed_by_id,
                created_at=s.created_at
            ) for s in task.status_history
        ] if task.status_history else [],
        created_at=task.created_at,
        updated_at=task.updated_at
    )


@router.post("", response_model=ApiResponse[TaskResponse])
async def create_task(
    data: TaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new task."""
    if not current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Необходимо быть в компании"
        )
    
    # Verify target employee exists
    result = await db.execute(select(User).where(User.id == data.target_employee_id))
    target_employee = result.scalar_one_or_none()
    if not target_employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Сотрудник не найден"
        )
    
    # Create task
    task = Task(
        target_company_id=data.target_company_id,
        target_employee_id=data.target_employee_id,
        name=data.name,
        note=data.note,
        priority=data.priority,
        status=data.status,
        deadline=data.deadline,
        created_by_user_id=current_user.id,
        created_by_company_id=current_user.company_id
    )
    db.add(task)
    await db.flush()
    
    # Attach documents
    if data.attached_document_ids:
        result = await db.execute(
            select(Document).where(Document.id.in_(data.attached_document_ids))
        )
        documents = result.scalars().all()
        task.attached_documents = list(documents)
    
    # Attach declarations
    if data.attached_declaration_ids:
        result = await db.execute(
            select(Declaration).where(Declaration.id.in_(data.attached_declaration_ids))
        )
        declarations = result.scalars().all()
        task.attached_declarations = list(declarations)
    
    # Attach certificates
    if data.attached_certificate_ids:
        result = await db.execute(
            select(Certificate).where(Certificate.id.in_(data.attached_certificate_ids))
        )
        certificates = result.scalars().all()
        task.attached_certificates = list(certificates)
    
    # Create initial status
    status_change = TaskStatusChange(
        task_id=task.id,
        from_status=TaskStatus.NEW,
        to_status=data.status,
        changed_by_id=current_user.id
    )
    db.add(status_change)
    
    # Notify target employee
    if target_employee.id != current_user.id:
        await create_notification(
            db=db,
            user_id=target_employee.id,
            title="Новая задача",
            message=f"Вам назначена задача: {data.name}",
            notification_type="info",
            link="/tasks"
        )
    
    await db.commit()
    
    # Reload with relationships
    result = await db.execute(
        select(Task)
        .options(
            selectinload(Task.attached_documents),
            selectinload(Task.attached_declarations),
            selectinload(Task.attached_certificates),
            selectinload(Task.status_history)
        )
        .where(Task.id == task.id)
    )
    task = result.scalar_one()
    
    return ApiResponse(data=task_to_response(task), success=True)


@router.get("", response_model=PaginatedResponse[TaskResponse])
async def get_tasks(
    page: int = 1,
    page_size: int = 20,
    search: Optional[str] = None,
    priority: Optional[TaskPriority] = None,
    task_status: Optional[TaskStatus] = None,
    target_employee_id: Optional[UUID] = None,
    owner_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get tasks with filters."""
    if not current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Необходимо быть в компании"
        )
    
    # Base query - directors can see all, employees only their own
    query = select(Task)
    
    if current_user.role in [UserRole.DIRECTOR, UserRole.SENIOR, UserRole.ADMIN]:
        # Can see all tasks in company
        query = query.where(
            (Task.created_by_company_id == current_user.company_id) |
            (Task.target_company_id == current_user.company_id)
        )
    else:
        # Only own tasks
        query = query.where(
            (Task.target_employee_id == current_user.id) |
            (Task.created_by_user_id == current_user.id)
        )
    
    # Apply filters
    if owner_type == "mine":
        query = query.where(
            (Task.target_employee_id == current_user.id) |
            (Task.created_by_user_id == current_user.id)
        )
    elif owner_type == "employee" and target_employee_id:
        query = query.where(Task.target_employee_id == target_employee_id)
    
    if search:
        query = query.where(Task.name.ilike(f"%{search}%"))
    
    if priority:
        query = query.where(Task.priority == priority)
    
    if task_status:
        query = query.where(Task.status == task_status)
    
    # Count
    count_query = select(func.count()).select_from(query.subquery())
    count_result = await db.execute(count_query)
    total = count_result.scalar()
    
    # Get paginated results
    offset = (page - 1) * page_size
    result = await db.execute(
        query
        .options(
            selectinload(Task.attached_documents),
            selectinload(Task.attached_declarations),
            selectinload(Task.attached_certificates),
            selectinload(Task.status_history)
        )
        .order_by(Task.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    tasks = result.scalars().all()
    
    return PaginatedResponse.create(
        data=[task_to_response(t) for t in tasks],
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{task_id}", response_model=ApiResponse[TaskResponse])
async def get_task(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get task by ID."""
    result = await db.execute(
        select(Task)
        .options(
            selectinload(Task.attached_documents),
            selectinload(Task.attached_declarations),
            selectinload(Task.attached_certificates),
            selectinload(Task.status_history)
        )
        .where(Task.id == task_id)
    )
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Задача не найдена"
        )
    
    # Check access
    has_access = (
        task.target_employee_id == current_user.id or
        task.created_by_user_id == current_user.id or
        current_user.role in [UserRole.DIRECTOR, UserRole.SENIOR, UserRole.ADMIN]
    )
    
    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Нет доступа к этой задаче"
        )
    
    return ApiResponse(data=task_to_response(task), success=True)


@router.put("/{task_id}", response_model=ApiResponse[TaskResponse])
async def update_task(
    task_id: UUID,
    data: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a task."""
    result = await db.execute(
        select(Task)
        .options(
            selectinload(Task.attached_documents),
            selectinload(Task.attached_declarations),
            selectinload(Task.attached_certificates),
            selectinload(Task.status_history)
        )
        .where(Task.id == task_id)
    )
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Задача не найдена"
        )
    
    # Update fields
    update_dict = data.model_dump(exclude_unset=True, exclude={"attached_document_ids", "attached_declaration_ids", "attached_certificate_ids"})
    for key, value in update_dict.items():
        setattr(task, key, value)
    
    await db.commit()
    await db.refresh(task)
    
    return ApiResponse(data=task_to_response(task), success=True)


@router.delete("/{task_id}", response_model=ApiResponse[None])
async def delete_task(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a task."""
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Задача не найдена"
        )
    
    # Only creator or director can delete
    if task.created_by_user_id != current_user.id and current_user.role not in [UserRole.DIRECTOR, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Нет прав для удаления"
        )
    
    await db.delete(task)
    await db.commit()
    
    return ApiResponse(data=None, success=True, message="Задача удалена")


@router.post("/{task_id}/status", response_model=ApiResponse[TaskResponse])
async def update_task_status(
    task_id: UUID,
    data: TaskStatusUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update task status."""
    result = await db.execute(
        select(Task)
        .options(
            selectinload(Task.attached_documents),
            selectinload(Task.attached_declarations),
            selectinload(Task.attached_certificates),
            selectinload(Task.status_history)
        )
        .where(Task.id == task_id)
    )
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Задача не найдена"
        )
    
    old_status = task.status
    task.status = data.status
    
    # Create status change record
    status_change = TaskStatusChange(
        task_id=task.id,
        from_status=old_status,
        to_status=data.status,
        changed_by_id=current_user.id
    )
    db.add(status_change)
    
    # Notify if status changed
    notify_user_id = None
    if task.target_employee_id != current_user.id:
        notify_user_id = task.target_employee_id
    elif task.created_by_user_id != current_user.id:
        notify_user_id = task.created_by_user_id
    
    if notify_user_id:
        status_names = {
            TaskStatus.NEW: "Новая",
            TaskStatus.IN_PROGRESS: "В работе",
            TaskStatus.WAITING: "Ожидание",
            TaskStatus.ON_REVIEW: "На проверке",
            TaskStatus.COMPLETED: "Завершена",
            TaskStatus.CANCELLED: "Отменена",
            TaskStatus.FROZEN: "Заморожена"
        }
        await create_notification(
            db=db,
            user_id=notify_user_id,
            title="Статус задачи изменен",
            message=f"Задача '{task.name}' - {status_names.get(data.status, data.status)}",
            notification_type="info",
            link=f"/tasks"
        )
    
    await db.commit()
    await db.refresh(task)
    
    return ApiResponse(data=task_to_response(task), success=True)
