from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from uuid import UUID

from app.database import get_db
from app.models import User, Company, Request, RequestType, RequestStatus, UserRole
from app.schemas import (
    ApiResponse, PaginatedResponse, CompanyCreate, CompanyResponse, CompanyJoinRequest,
    SendMessageRequest
)
from app.api.deps import get_current_user, require_admin
from app.services.notification import create_notification

router = APIRouter(prefix="/companies", tags=["Companies"])


@router.post("/register", response_model=ApiResponse[CompanyResponse])
async def register_company(
    request: CompanyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Register a new company."""
    # Check if user already has a company
    if current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Вы уже состоите в компании"
        )
    
    # Check if INN already exists
    result = await db.execute(select(Company).where(Company.inn == request.inn))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Компания с таким ИНН уже существует"
        )
    
    # Create company
    company = Company(
        name=request.name,
        inn=request.inn,
        activity_type=current_user.activity_type,
        director_id=None  # Will be assigned by admin
    )
    db.add(company)
    await db.flush()
    
    # Assign user to company
    current_user.company_id = company.id
    
    # Create request for admin approval
    admin_request = Request(
        type=RequestType.COMPANY_REGISTRATION,
        status=RequestStatus.PENDING,
        user_id=current_user.id,
        company_id=company.id,
        note=f"{current_user.full_name} хочет зарегистрировать компанию {company.name}"
    )
    db.add(admin_request)
    
    await db.commit()
    await db.refresh(company)
    
    return ApiResponse(data=CompanyResponse.model_validate(company), success=True)


@router.post("/join", response_model=ApiResponse[CompanyResponse])
async def join_company(
    request: CompanyJoinRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Request to join an existing company."""
    # Check if user already has a company
    if current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Вы уже состоите в компании"
        )
    
    # Find company by INN
    result = await db.execute(select(Company).where(Company.inn == request.inn))
    company = result.scalar_one_or_none()
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Компания с таким ИНН не найдена. Проверьте правильность ИНН."
        )
    
    # Check activity type matches
    if company.activity_type != current_user.activity_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Тип деятельности не совпадает с типом компании"
        )
    
    # Create join request
    # If company has director, send to director; otherwise to admin
    target_user_id = company.director_id
    
    join_request = Request(
        type=RequestType.EMPLOYEE_JOIN,
        status=RequestStatus.PENDING,
        user_id=current_user.id,
        company_id=company.id,
        note=f"{current_user.full_name} хочет войти в компанию {company.name}"
    )
    db.add(join_request)
    
    # Create notification for director or admin
    if target_user_id:
        await create_notification(
            db=db,
            user_id=target_user_id,
            title="Запрос на вступление",
            message=f"{current_user.full_name} хочет войти в вашу компанию",
            notification_type="info",
            link="/requests"
        )
    
    await db.commit()
    await db.refresh(company)
    
    return ApiResponse(
        data=CompanyResponse.model_validate(company),
        success=True,
        message="Запрос на вступление отправлен"
    )


@router.get("/find", response_model=ApiResponse[CompanyResponse | None])
async def find_company_by_inn(
    inn: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Find a company by INN."""
    result = await db.execute(select(Company).where(Company.inn == inn))
    company = result.scalar_one_or_none()
    
    return ApiResponse(
        data=CompanyResponse.model_validate(company) if company else None,
        success=True
    )


@router.get("/{company_id}", response_model=ApiResponse[CompanyResponse])
async def get_company(
    company_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get company by ID."""
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalar_one_or_none()
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Компания не найдена"
        )
    
    return ApiResponse(data=CompanyResponse.model_validate(company), success=True)


@router.get("", response_model=PaginatedResponse[CompanyResponse])
async def get_all_companies(
    page: int = 1,
    page_size: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin())
):
    """Get all companies (admin only)."""
    count_result = await db.execute(select(func.count(Company.id)))
    total = count_result.scalar()
    
    offset = (page - 1) * page_size
    result = await db.execute(
        select(Company)
        .order_by(Company.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    companies = result.scalars().all()
    
    return PaginatedResponse.create(
        data=[CompanyResponse.model_validate(c) for c in companies],
        total=total,
        page=page,
        page_size=page_size
    )


@router.post("/{company_id}/block", response_model=ApiResponse[CompanyResponse])
async def block_company(
    company_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin())
):
    """Block a company (admin only)."""
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalar_one_or_none()
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Компания не найдена"
        )
    
    company.is_blocked = True
    await db.commit()
    await db.refresh(company)
    
    return ApiResponse(data=CompanyResponse.model_validate(company), success=True)


@router.post("/{company_id}/unblock", response_model=ApiResponse[CompanyResponse])
async def unblock_company(
    company_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin())
):
    """Unblock a company (admin only)."""
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalar_one_or_none()
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Компания не найдена"
        )
    
    company.is_blocked = False
    await db.commit()
    await db.refresh(company)
    
    return ApiResponse(data=CompanyResponse.model_validate(company), success=True)


@router.delete("/{company_id}", response_model=ApiResponse[None])
async def delete_company(
    company_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin())
):
    """Delete a company (admin only)."""
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalar_one_or_none()
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Компания не найдена"
        )
    
    # Remove all users from company
    result = await db.execute(select(User).where(User.company_id == company_id))
    users = result.scalars().all()
    for user in users:
        user.company_id = None
    
    await db.delete(company)
    await db.commit()
    
    return ApiResponse(data=None, success=True, message="Компания удалена")


@router.post("/{company_id}/message", response_model=ApiResponse[None])
async def send_message_to_company(
    company_id: UUID,
    request: SendMessageRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin())
):
    """Send message to company director (admin only)."""
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalar_one_or_none()
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Компания не найдена"
        )
    
    if company.director_id:
        await create_notification(
            db=db,
            user_id=company.director_id,
            title="Сообщение от администратора",
            message=request.message,
            notification_type="info"
        )
    
    await db.commit()
    
    return ApiResponse(data=None, success=True, message="Сообщение отправлено")
