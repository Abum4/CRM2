# Schemas package
from app.schemas.common import ApiResponse, PaginatedResponse, ErrorResponse
from app.schemas.user import (
    UserBase, UserCreate, UserUpdate, UserResponse, UserWithRoleResponse,
    UserLoginRequest, UserRegisterRequest, AdminLoginRequest,
    TokenResponse, AdminTokenResponse,
    ForgotPasswordRequest, ResetPasswordRequest, ChangePasswordRequest,
    AssignRoleRequest, RemoveUserRequest, SendMessageRequest
)
from app.schemas.company import (
    CompanyBase, CompanyCreate, CompanyUpdate, CompanyResponse, CompanyJoinRequest
)
from app.schemas.declaration import (
    VehicleBase, VehicleCreate, VehicleResponse,
    DeclarationBase, DeclarationCreate, DeclarationUpdate, DeclarationResponse,
    DeclarationRedirectRequest, DeclarationGroupCreate, DeclarationGroupResponse,
    DeclarationGroupAddRemove, DeclarationFilters
)
from app.schemas.certificate import (
    CertificateActionResponse, CertificateBase, CertificateCreate, CertificateUpdate,
    CertificateResponse, CertificateRedirectRequest, CertificateStatusUpdateRequest,
    CertificateFillNumberRequest, CertificateAttachPaymentRequest, CertificateFilters
)
from app.schemas.task import (
    TaskStatusChangeResponse, TaskBase, TaskCreate, TaskUpdate, TaskResponse,
    TaskStatusUpdateRequest, TaskFilters
)
from app.schemas.document import (
    FolderBase, FolderCreate, FolderUpdate, FolderResponse,
    DocumentBase, DocumentResponse
)
from app.schemas.client import ClientBase, ClientCreate, ClientUpdate, ClientResponse
from app.schemas.partnership import PartnershipRequestCreate, PartnershipResponse
from app.schemas.request import RequestResponse
from app.schemas.notification import NotificationResponse
from app.schemas.dashboard import DashboardStats, AdminStats, DashboardFilters, GrowthDataPoint

__all__ = [
    # Common
    "ApiResponse", "PaginatedResponse", "ErrorResponse",
    # User
    "UserBase", "UserCreate", "UserUpdate", "UserResponse", "UserWithRoleResponse",
    "UserLoginRequest", "UserRegisterRequest", "AdminLoginRequest",
    "TokenResponse", "AdminTokenResponse",
    "ForgotPasswordRequest", "ResetPasswordRequest", "ChangePasswordRequest",
    "AssignRoleRequest", "RemoveUserRequest", "SendMessageRequest",
    # Company
    "CompanyBase", "CompanyCreate", "CompanyUpdate", "CompanyResponse", "CompanyJoinRequest",
    # Declaration
    "VehicleBase", "VehicleCreate", "VehicleResponse",
    "DeclarationBase", "DeclarationCreate", "DeclarationUpdate", "DeclarationResponse",
    "DeclarationRedirectRequest", "DeclarationGroupCreate", "DeclarationGroupResponse",
    "DeclarationGroupAddRemove", "DeclarationFilters",
    # Certificate
    "CertificateActionResponse", "CertificateBase", "CertificateCreate", "CertificateUpdate",
    "CertificateResponse", "CertificateRedirectRequest", "CertificateStatusUpdateRequest",
    "CertificateFillNumberRequest", "CertificateAttachPaymentRequest", "CertificateFilters",
    # Task
    "TaskStatusChangeResponse", "TaskBase", "TaskCreate", "TaskUpdate", "TaskResponse",
    "TaskStatusUpdateRequest", "TaskFilters",
    # Document
    "FolderBase", "FolderCreate", "FolderUpdate", "FolderResponse",
    "DocumentBase", "DocumentResponse",
    # Client
    "ClientBase", "ClientCreate", "ClientUpdate", "ClientResponse",
    # Partnership
    "PartnershipRequestCreate", "PartnershipResponse",
    # Request
    "RequestResponse",
    # Notification
    "NotificationResponse",
    # Dashboard
    "DashboardStats", "AdminStats", "DashboardFilters", "GrowthDataPoint",
]
