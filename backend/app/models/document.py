import uuid
from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Enum, Table
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class AccessType(str, PyEnum):
    PRIVATE = "private"
    PUBLIC = "public"
    SELECTED = "selected"


# Association table for folder access
folder_access = Table(
    "folder_access",
    Base.metadata,
    Column("folder_id", UUID(as_uuid=True), ForeignKey("folders.id"), primary_key=True),
    Column("user_id", UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True),
)


class Folder(Base):
    __tablename__ = "folders"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("folders.id"), nullable=True)
    access_type = Column(Enum(AccessType), default=AccessType.PUBLIC, nullable=False)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=True)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    parent = relationship("Folder", remote_side=[id], backref="children")
    owner = relationship("User", back_populates="owned_folders")
    company = relationship("Company", back_populates="folders")
    client = relationship("Client", back_populates="folders")
    documents = relationship("Document", back_populates="folder")
    access_users = relationship("User", secondary=folder_access)
    
    def __repr__(self):
        return f"<Folder {self.name}>"


class Document(Base):
    __tablename__ = "documents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    file_url = Column(String(500), nullable=False)
    file_type = Column(String(100), nullable=False)
    file_size = Column(Integer, nullable=False)  # in bytes
    folder_id = Column(UUID(as_uuid=True), ForeignKey("folders.id"), nullable=True)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=True)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    folder = relationship("Folder", back_populates="documents")
    owner = relationship("User", back_populates="owned_documents")
    company = relationship("Company", back_populates="documents")
    client = relationship("Client", back_populates="documents")
    
    def __repr__(self):
        return f"<Document {self.name}>"
