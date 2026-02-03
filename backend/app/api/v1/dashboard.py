from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from datetime import date, datetime, timedelta
from typing import Optional

from app.database import get_db
from app.models import (
    User, Company, Task, TaskStatus, Declaration, Certificate, 
    CertificateStatus, Request, RequestStatus, UserRole
)
from app.schemas import ApiResponse, DashboardStats, AdminStats, GrowthDataPoint
from app.api.deps import get_current_user, require_admin

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("", response_model=ApiResponse[DashboardStats])
async def get_dashboard_stats(
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    employee_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get dashboard statistics for current user."""
    if not current_user.company_id:
        return ApiResponse(data=DashboardStats(), success=True)
    
    # Base filters
    task_filter = Task.target_employee_id == current_user.id
    
    # Override for directors
    if current_user.role in [UserRole.DIRECTOR, UserRole.SENIOR]:
        if employee_id and employee_id != "all":
            task_filter = Task.target_employee_id == employee_id
        else:
            task_filter = (Task.created_by_company_id == current_user.company_id) | (Task.target_company_id == current_user.company_id)
    
    # Active tasks (not completed/cancelled)
    result = await db.execute(
        select(func.count(Task.id)).where(
            task_filter,
            Task.status.notin_([TaskStatus.COMPLETED, TaskStatus.CANCELLED])
        )
    )
    active_tasks = result.scalar() or 0
    
    # Completed tasks
    result = await db.execute(
        select(func.count(Task.id)).where(
            task_filter,
            Task.status == TaskStatus.COMPLETED
        )
    )
    completed_tasks = result.scalar() or 0
    
    # Overdue tasks
    today = date.today()
    result = await db.execute(
        select(func.count(Task.id)).where(
            task_filter,
            Task.deadline < today,
            Task.status.notin_([TaskStatus.COMPLETED, TaskStatus.CANCELLED])
        )
    )
    overdue_tasks = result.scalar() or 0
    
    # Declarations (for declarants)
    sent_declarations = None
    if current_user.activity_type == "declarant":
        decl_filter = Declaration.company_id == current_user.company_id
        if employee_id and employee_id != "all":
            decl_filter = Declaration.owner_id == employee_id
        elif current_user.role == UserRole.EMPLOYEE:
            decl_filter = Declaration.owner_id == current_user.id
        
        result = await db.execute(
            select(func.count(Declaration.id)).where(decl_filter)
        )
        sent_declarations = result.scalar() or 0
    
    # Certificates
    cert_filter = (Certificate.company_id == current_user.company_id) | (Certificate.certifier_company_id == current_user.company_id)
    
    # Active certificates
    result = await db.execute(
        select(func.count(Certificate.id)).where(
            cert_filter,
            Certificate.status.notin_([CertificateStatus.COMPLETED, CertificateStatus.REJECTED])
        )
    )
    active_certificates = result.scalar() or 0
    
    # Completed certificates
    result = await db.execute(
        select(func.count(Certificate.id)).where(
            cert_filter,
            Certificate.status == CertificateStatus.COMPLETED
        )
    )
    completed_certificates = result.scalar() or 0
    
    # Overdue certificates
    result = await db.execute(
        select(func.count(Certificate.id)).where(
            cert_filter,
            Certificate.deadline < today,
            Certificate.status.notin_([CertificateStatus.COMPLETED, CertificateStatus.REJECTED])
        )
    )
    overdue_certificates = result.scalar() or 0
    
    return ApiResponse(
        data=DashboardStats(
            active_tasks=active_tasks,
            completed_tasks=completed_tasks,
            overdue_tasks=overdue_tasks,
            sent_declarations=sent_declarations,
            active_certificates=active_certificates,
            completed_certificates=completed_certificates,
            overdue_certificates=overdue_certificates
        ),
        success=True
    )


@router.get("/admin", response_model=ApiResponse[AdminStats])
async def get_admin_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin())
):
    """Get admin dashboard statistics."""
    # Total companies
    result = await db.execute(select(func.count(Company.id)))
    total_companies = result.scalar() or 0
    
    # Total users
    result = await db.execute(select(func.count(User.id)))
    total_users = result.scalar() or 0
    
    # Active requests
    result = await db.execute(
        select(func.count(Request.id)).where(Request.status == RequestStatus.PENDING)
    )
    active_requests = result.scalar() or 0
    
    # Growth data (last 30 days)
    growth_data = []
    end_date = datetime.utcnow().date()
    start_date = end_date - timedelta(days=30)
    
    for i in range(31):
        check_date = start_date + timedelta(days=i)
        
        # Companies created up to this date
        result = await db.execute(
            select(func.count(Company.id)).where(
                func.date(Company.created_at) <= check_date
            )
        )
        companies_count = result.scalar() or 0
        
        # Users created up to this date
        result = await db.execute(
            select(func.count(User.id)).where(
                func.date(User.created_at) <= check_date
            )
        )
        users_count = result.scalar() or 0
        
        growth_data.append(GrowthDataPoint(
            date=check_date.isoformat(),
            companies=companies_count,
            users=users_count
        ))
    
    return ApiResponse(
        data=AdminStats(
            total_companies=total_companies,
            total_users=total_users,
            active_requests=active_requests,
            growth_data=growth_data
        ),
        success=True
    )
