import uuid
from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import Column, String, Date, DateTime, ForeignKey, Enum, Text, Boolean, Table
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class CertificateStatus(str, PyEnum):
    IN_PROGRESS = "in_progress"
    AWAITING_PAYMENT = "awaiting_payment"
    ON_REVIEW = "on_review"
    COMPLETED = "completed"
    REJECTED = "rejected"


# Association tables
certificate_documents = Table(
    "certificate_documents",
    Base.metadata,
    Column("certificate_id", UUID(as_uuid=True), ForeignKey("certificates.id"), primary_key=True),
    Column("document_id", UUID(as_uuid=True), ForeignKey("documents.id"), primary_key=True),
)

certificate_folders = Table(
    "certificate_folders",
    Base.metadata,
    Column("certificate_id", UUID(as_uuid=True), ForeignKey("certificates.id"), primary_key=True),
    Column("folder_id", UUID(as_uuid=True), ForeignKey("folders.id"), primary_key=True),
)

certificate_declarations = Table(
    "certificate_declarations",
    Base.metadata,
    Column("certificate_id", UUID(as_uuid=True), ForeignKey("certificates.id"), primary_key=True),
    Column("declaration_id", UUID(as_uuid=True), ForeignKey("declarations.id"), primary_key=True),
)

certificate_payment_files = Table(
    "certificate_payment_files",
    Base.metadata,
    Column("certificate_id", UUID(as_uuid=True), ForeignKey("certificates.id"), primary_key=True),
    Column("document_id", UUID(as_uuid=True), ForeignKey("documents.id"), primary_key=True),
)


class Certificate(Base):
    __tablename__ = "certificates"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    certifier_company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=True)  # null means "for self"
    type = Column(String(255), nullable=False)
    deadline = Column(Date, nullable=False)
    number = Column(String(100), nullable=True)
    number_to_be_filled_by_certifier = Column(Boolean, default=False, nullable=False)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=False)
    note = Column(Text, nullable=True)
    sent_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(Enum(CertificateStatus), default=CertificateStatus.IN_PROGRESS, nullable=False)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    assigned_to_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    # For certifiers: source declarant info
    declarant_company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    certifier_company = relationship("Company", foreign_keys=[certifier_company_id])
    client = relationship("Client", back_populates="certificates")
    owner = relationship("User", back_populates="owned_certificates", foreign_keys=[owner_id])
    assigned_to = relationship("User", back_populates="assigned_certificates", foreign_keys=[assigned_to_id])
    company = relationship("Company", back_populates="certificates", foreign_keys=[company_id])
    declarant_company = relationship("Company", foreign_keys=[declarant_company_id])
    
    attached_documents = relationship("Document", secondary=certificate_documents)
    attached_folders = relationship("Folder", secondary=certificate_folders)
    linked_declarations = relationship("Declaration", secondary=certificate_declarations, back_populates="linked_certificates")
    payment_files = relationship("Document", secondary=certificate_payment_files)
    
    actions = relationship("CertificateAction", back_populates="certificate", cascade="all, delete-orphan", order_by="CertificateAction.created_at")
    linked_tasks = relationship("Task", secondary="task_certificates", back_populates="attached_certificates")
    
    def __repr__(self):
        return f"<Certificate {self.number or 'No number'} ({self.status})>"


class CertificateAction(Base):
    __tablename__ = "certificate_actions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    certificate_id = Column(UUID(as_uuid=True), ForeignKey("certificates.id"), nullable=False)
    action = Column(String(255), nullable=False)
    note = Column(Text, nullable=True)
    performed_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    certificate = relationship("Certificate", back_populates="actions")
    performed_by = relationship("User")
    attached_files = relationship("Document", secondary="certificate_action_files")
    
    def __repr__(self):
        return f"<CertificateAction {self.action}>"


certificate_action_files = Table(
    "certificate_action_files",
    Base.metadata,
    Column("action_id", UUID(as_uuid=True), ForeignKey("certificate_actions.id"), primary_key=True),
    Column("document_id", UUID(as_uuid=True), ForeignKey("documents.id"), primary_key=True),
)
