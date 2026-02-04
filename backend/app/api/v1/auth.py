from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from app.database import get_db
from app.models import User, Company, Request, RequestType, RequestStatus, UserRole
from app.schemas import (
    ApiResponse, UserLoginRequest, UserRegisterRequest, AdminLoginRequest,
    TokenResponse, AdminTokenResponse, UserWithRoleResponse, ForgotPasswordRequest,
    ResetPasswordRequest
)
from app.utils.security import (
    verify_password, get_password_hash, create_access_token,
    verify_admin_code
)
from app.api.deps import get_current_user
from app.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=ApiResponse[TokenResponse])
async def login(
    request: UserLoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """User login."""
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль"
        )
    
    if user.is_blocked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Вы были заблокированы. Свяжитесь с директором фирмы."
        )
    
    # Check if company is blocked
    if user.company_id:
        result = await db.execute(select(Company).where(Company.id == user.company_id))
        company = result.scalar_one_or_none()
        if company and company.is_blocked:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Ваша компания заблокирована."
            )
    
    token = create_access_token({"sub": str(user.id)})
    
    return ApiResponse(
        data=TokenResponse(
            user=UserWithRoleResponse.model_validate(user),
            token=token
        ),
        success=True
    )


@router.post("/register", response_model=ApiResponse[TokenResponse])
async def register(
    request: UserRegisterRequest,
    db: AsyncSession = Depends(get_db)
):
    """User registration."""
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == request.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким email уже существует"
        )
    
    # Create user
    user = User(
        email=request.email,
        password_hash=get_password_hash(request.password),
        full_name=request.full_name,
        phone=request.phone,
        activity_type=request.activity_type,
        role=UserRole.EMPLOYEE
    )
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    token = create_access_token({"sub": str(user.id)})
    
    return ApiResponse(
        data=TokenResponse(
            user=UserWithRoleResponse.model_validate(user),
            token=token
        ),
        success=True
    )


@router.post("/logout", response_model=ApiResponse[None])
async def logout(
    current_user: User = Depends(get_current_user)
):
    """User logout."""
    # Token invalidation would be handled client-side
    # For server-side, we'd need a token blacklist (not implemented)
    return ApiResponse(data=None, success=True, message="Вы успешно вышли")


@router.get("/me", response_model=ApiResponse[UserWithRoleResponse])
async def get_me(
    current_user: User = Depends(get_current_user)
):
    """Get current user info."""
    return ApiResponse(
        data=UserWithRoleResponse.model_validate(current_user),
        success=True
    )


@router.post("/forgot-password", response_model=ApiResponse[None])
async def forgot_password(
    request: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    """Send password reset email."""
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()
    
    # Always return success to prevent email enumeration
    # In production, send actual reset email here
    return ApiResponse(
        data=None,
        success=True,
        message="Если email существует, инструкции отправлены"
    )


@router.post("/reset-password", response_model=ApiResponse[None])
async def reset_password(
    request: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    """Reset password with token."""
    # In production, verify the reset token and get user
    # For now, this is a placeholder
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Функция сброса пароля требует настройки email"
    )


@router.get("/admin/login")
async def admin_login_info():
    """Info about admin login endpoint."""
    return {
        "message": "Admin login endpoint",
        "method": "POST",
        "required_fields": ["login", "password", "code"]
    }


@router.post("/admin/login", response_model=ApiResponse[AdminTokenResponse])
async def admin_login(
    request: AdminLoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """Admin login with code."""
    import logging
    logger = logging.getLogger(__name__)
    
    # Debug logging
    logger.info(f"Admin login attempt - login: '{request.login}'")
    logger.info(f"Expected login: '{settings.ADMIN_LOGIN}', Expected password length: {len(settings.ADMIN_PASSWORD)}")
    
    # Verify credentials
    if request.login != settings.ADMIN_LOGIN or request.password != settings.ADMIN_PASSWORD:
        logger.warning(f"Login failed - login match: {request.login == settings.ADMIN_LOGIN}, password match: {request.password == settings.ADMIN_PASSWORD}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный логин или пароль"
        )
    
    # Verify admin code
    if not verify_admin_code(request.code):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный или истекший код администратора"
        )
    
    # Find or create admin user
    # Use .com instead of .local because Pydantic email validation rejects .local
    admin_email = f"{settings.ADMIN_LOGIN}@admin.com"
    result = await db.execute(
        select(User).where(User.email == admin_email)
    )
    admin_user = result.scalar_one_or_none()
    
    if not admin_user:
        admin_user = User(
            email=admin_email,
            password_hash=get_password_hash(settings.ADMIN_PASSWORD),
            full_name="Администратор",
            phone="0000000000",
            activity_type="declarant",
            role=UserRole.ADMIN
        )
        db.add(admin_user)
        await db.commit()
        await db.refresh(admin_user)
    
    token = create_access_token({"sub": str(admin_user.id), "is_admin": True})
    
    return ApiResponse(
        data=AdminTokenResponse(token=token),
        success=True
    )
