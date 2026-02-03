from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime, date
from uuid import UUID
from app.models.certificate import CertificateStatus


class CertificateActionResponse(BaseModel):
    id: UUID
    certificate_id: UUID
    action: str
    note: Optional[str] = None
    attached_file_ids: List[UUID] = []
    performed_by: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True


class CertificateBase(BaseModel):
    certifier_company_id: Optional[UUID] = None  # None means "for self"
    type: str = Field(..., min_length=1, max_length=255)
    deadline: date
    number: Optional[str] = None
    number_to_be_filled_by_certifier: bool = False
    client_id: UUID
    note: Optional[str] = None


class CertificateCreate(CertificateBase):
    linked_declaration_ids: List[UUID] = Field(default_factory=list)
    attached_document_ids: List[UUID] = Field(default_factory=list)
    attached_folder_ids: List[UUID] = Field(default_factory=list)


class CertificateUpdate(BaseModel):
    certifier_company_id: Optional[UUID] = None
    type: Optional[str] = Field(None, min_length=1, max_length=255)
    deadline: Optional[date] = None
    number: Optional[str] = None
    client_id: Optional[UUID] = None
    note: Optional[str] = None
    linked_declaration_ids: Optional[List[UUID]] = None
    attached_document_ids: Optional[List[UUID]] = None
    attached_folder_ids: Optional[List[UUID]] = None


class CertificateResponse(CertificateBase):
    id: UUID
    sent_date: datetime
    status: CertificateStatus
    owner_id: UUID
    assigned_to_id: Optional[UUID] = None
    company_id: UUID
    certifier_company_name: Optional[str] = None
    certifier_name: Optional[str] = None
    declarant_company_id: Optional[UUID] = None
    declarant_company_name: Optional[str] = None
    declarant_name: Optional[str] = None
    linked_declaration_ids: List[UUID] = []
    attached_document_ids: List[UUID] = []
    attached_folder_ids: List[UUID] = []
    actions: List[CertificateActionResponse] = []
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class CertificateRedirectRequest(BaseModel):
    to_user_id: UUID


class CertificateStatusUpdateRequest(BaseModel):
    status: CertificateStatus
    note: Optional[str] = None
    file_ids: Optional[List[UUID]] = None


class CertificateFillNumberRequest(BaseModel):
    number: str = Field(..., min_length=1, max_length=100)


class CertificateAttachPaymentRequest(BaseModel):
    file_ids: List[UUID] = Field(..., min_length=1)


class CertificateFilters(BaseModel):
    search: Optional[str] = None
    certifier_company_id: Optional[UUID] = None
    number: Optional[str] = None
    client_id: Optional[UUID] = None
    status: Optional[CertificateStatus] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    owner_id: Optional[UUID] = None
    owner_type: Optional[str] = None  # 'mine', 'all', 'employee'
