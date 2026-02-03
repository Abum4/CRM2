import uuid
from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Text, Table
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.document import AccessType


# Association table for client access
client_access = Table(
    "client_access",
    Base.metadata,
    Column("client_id", UUID(as_uuid=True), ForeignKey("clients.id"), primary_key=True),
    Column("user_id", UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True),
)


class Client(Base):
    __tablename__ = "clients"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_name = Column(String(255), nullable=False)
    inn = Column(String(50), nullable=False)
    director_name = Column(String(255), nullable=False)
    note = Column(Text, nullable=True)
    access_type = Column(Enum(AccessType), default=AccessType.PUBLIC, nullable=False)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    owner = relationship("User", back_populates="owned_clients")
    company = relationship("Company", back_populates="clients")
    access_users = relationship("User", secondary=client_access)
    
    # Related items
    declarations = relationship("Declaration", back_populates="client")
    certificates = relationship("Certificate", back_populates="client")
    documents = relationship("Document", back_populates="client")
    folders = relationship("Folder", back_populates="client")
    
    def __repr__(self):
        return f"<Client {self.company_name}>"
