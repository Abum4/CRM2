from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from app.database import get_db
from app.models import User, Company, Request, RequestType, RequestStatus, UserRole
from app.schemas import ApiResponse, RequestResponse
from app.api.deps import get_current_user, require_admin
from app.services.notification import create_notification

router = APIRouter(prefix="/requests", tags=["Requests"])


def request_to_response(req: Request) -> RequestResponse:
    """Convert request model to response schema."""
    return RequestResponse(
        id=req.id,
        type=req.type,
        status=req.status,
        user_id=req.user_id,
        user_name=req.user.full_name if req.user else None,
        company_id=req.company_id,
        company_name=req.company.name if req.company else None,
        target_company_id=req.target_company_id,
        note=req.note,
        created_at=req.created_at,
        updated_at=req.updated_at
    )


@router.get("", response_model=ApiResponse[list[RequestResponse]])
async def get_requests(
    request_type: RequestType = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get pending requests for current user's company or admin."""
    query = select(Request).where(Request.status == RequestStatus.PENDING)
    
    if current_user.role == UserRole.ADMIN:
        # Admin can see all requests
        pass
    elif current_user.role == UserRole.DIRECTOR:
        # Director can see join requests for their company
        query = query.where(Request.company_id == current_user.company_id)
    else:
        # Regular users can only see their own requests
        query = query.where(Request.user_id == current_user.id)
    
    if request_type:
        query = query.where(Request.type == request_type)
    
    result = await db.execute(query.order_by(Request.created_at.desc()))
    requests = result.scalars().all()
    
    # Load related data
    responses = []
    for req in requests:
        if req.user_id:
            result = await db.execute(select(User).where(User.id == req.user_id))
            req.user = result.scalar_one_or_none()
        if req.company_id:
            result = await db.execute(select(Company).where(Company.id == req.company_id))
            req.company = result.scalar_one_or_none()
        responses.append(request_to_response(req))
    
    return ApiResponse(data=responses, success=True)


@router.get("/admin", response_model=ApiResponse[list[RequestResponse]])
async def get_admin_requests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin())
):
    """Get all pending requests (admin only)."""
    result = await db.execute(
        select(Request)
        .where(Request.status == RequestStatus.PENDING)
        .order_by(Request.created_at.desc())
    )
    requests = result.scalars().all()
    
    # Load related data
    responses = []
    for req in requests:
        if req.user_id:
            result = await db.execute(select(User).where(User.id == req.user_id))
            req.user = result.scalar_one_or_none()
        if req.company_id:
            result = await db.execute(select(Company).where(Company.id == req.company_id))
            req.company = result.scalar_one_or_none()
        responses.append(request_to_response(req))
    
    return ApiResponse(data=responses, success=True)


@router.post("/{request_id}/accept", response_model=ApiResponse[RequestResponse])
async def accept_request(
    request_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Accept a request."""
    result = await db.execute(select(Request).where(Request.id == request_id))
    req = result.scalar_one_or_none()
    
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Запрос не найден"
        )
    
    # Check permissions
    can_accept = False
    if current_user.role == UserRole.ADMIN:
        can_accept = True
    elif current_user.role == UserRole.DIRECTOR and req.company_id == current_user.company_id:
        if req.type == RequestType.EMPLOYEE_JOIN:
            can_accept = True
    
    if not can_accept:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав"
        )
    
    req.status = RequestStatus.ACCEPTED
    
    # Handle different request types
    if req.type == RequestType.COMPANY_REGISTRATION:
        # Assign user as director
        if req.user_id:
            result = await db.execute(select(User).where(User.id == req.user_id))
            user = result.scalar_one_or_none()
            if user:
                user.role = UserRole.DIRECTOR
                
                # Update company director
                if req.company_id:
                    result = await db.execute(select(Company).where(Company.id == req.company_id))
                    company = result.scalar_one_or_none()
                    if company:
                        company.director_id = user.id
    
    elif req.type == RequestType.EMPLOYEE_JOIN:
        # Add user to company
        if req.user_id and req.company_id:
            result = await db.execute(select(User).where(User.id == req.user_id))
            user = result.scalar_one_or_none()
            if user:
                user.company_id = req.company_id
                user.role = UserRole.EMPLOYEE
    
    # Notify user
    if req.user_id:
        type_names = {
            RequestType.COMPANY_REGISTRATION: "Регистрация компании",
            RequestType.EMPLOYEE_JOIN: "Вступление в компанию",
            RequestType.PARTNERSHIP: "Партнерство"
        }
        await create_notification(
            db=db,
            user_id=req.user_id,
            title="Запрос одобрен",
            message=f"{type_names.get(req.type, req.type)} - ваш запрос одобрен",
            notification_type="success"
        )
    
    await db.commit()
    await db.refresh(req)
    
    # Load related data
    if req.user_id:
        result = await db.execute(select(User).where(User.id == req.user_id))
        req.user = result.scalar_one_or_none()
    if req.company_id:
        result = await db.execute(select(Company).where(Company.id == req.company_id))
        req.company = result.scalar_one_or_none()
    
    return ApiResponse(data=request_to_response(req), success=True)


@router.post("/{request_id}/reject", response_model=ApiResponse[RequestResponse])
async def reject_request(
    request_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Reject a request."""
    result = await db.execute(select(Request).where(Request.id == request_id))
    req = result.scalar_one_or_none()
    
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Запрос не найден"
        )
    
    # Check permissions
    can_reject = False
    if current_user.role == UserRole.ADMIN:
        can_reject = True
    elif current_user.role == UserRole.DIRECTOR and req.company_id == current_user.company_id:
        if req.type == RequestType.EMPLOYEE_JOIN:
            can_reject = True
    
    if not can_reject:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав"
        )
    
    req.status = RequestStatus.REJECTED
    
    # Handle company registration rejection
    if req.type == RequestType.COMPANY_REGISTRATION:
        # Remove user from company
        if req.user_id:
            result = await db.execute(select(User).where(User.id == req.user_id))
            user = result.scalar_one_or_none()
            if user:
                user.company_id = None
        
        # Delete company
        if req.company_id:
            result = await db.execute(select(Company).where(Company.id == req.company_id))
            company = result.scalar_one_or_none()
            if company:
                await db.delete(company)
    
    # Notify user
    if req.user_id:
        type_names = {
            RequestType.COMPANY_REGISTRATION: "Регистрация компании",
            RequestType.EMPLOYEE_JOIN: "Вступление в компанию",
            RequestType.PARTNERSHIP: "Партнерство"
        }
        await create_notification(
            db=db,
            user_id=req.user_id,
            title="Запрос отклонен",
            message=f"{type_names.get(req.type, req.type)} - ваш запрос отклонен",
            notification_type="error"
        )
    
    await db.commit()
    await db.refresh(req)
    
    # Load related data
    if req.user_id:
        result = await db.execute(select(User).where(User.id == req.user_id))
        req.user = result.scalar_one_or_none()
    if req.company_id:
        result = await db.execute(select(Company).where(Company.id == req.company_id))
        req.company = result.scalar_one_or_none()
    
    return ApiResponse(data=request_to_response(req), success=True)
