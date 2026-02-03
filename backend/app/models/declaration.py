import uuid
from datetime import datetime, date
from enum import Enum as PyEnum
from sqlalchemy import Column, String, Date, DateTime, ForeignKey, Enum, Text, Table
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class DeclarationMode(str, PyEnum):
    EK_10 = "ЭК/10"
    EK_11 = "ЭК/11"
    EK_12 = "ЭК/12"
    IM_40 = "ИМ/40"
    IM_41 = "ИМ/41"
    IM_42 = "ИМ/42"
    IM_51 = "ИМ/51"
    EK_51 = "ЭК/51"
    EK_61 = "ЭК/61"
    IM_61 = "ИМ/61"
    IM_70 = "ИМ/70"
    IM_71 = "ИМ/71"
    EK_71 = "ЭК/71"
    IM_72 = "ИМ/72"
    EK_72 = "ЭК/72"
    IM_73 = "ИМ/73"
    EK_73 = "ЭК/73"
    IM_74 = "ИМ/74"
    EK_74 = "ЭК/74"
    IM_75 = "ИМ/75"
    EK_75 = "ЭК/75"
    IM_76 = "ИМ/76"
    TR_80 = "ТР/80"
    ND_40 = "НД/40"
    PR_40 = "ПР/40"
    PE_40 = "ПЕ/40"
    VD_40 = "ВД/40"
    VD_10 = "ВД/10"
    VD_74 = "ВД/74"


class VehicleType(str, PyEnum):
    MARINE = "10"      # МОРСКОЙ
    RAILWAY = "20"     # ЖД
    AUTO = "30"        # АВТО
    AIR = "40"         # АВИА
    PIPELINE = "71"    # ТРУБОПРОВОД
    POWERLINE = "72"   # ЛЭП
    RIVER = "80"       # РЕЧНОЙ
    SELF_PROPELLED = "90"  # САМОХОД


# Association tables
declaration_documents = Table(
    "declaration_documents",
    Base.metadata,
    Column("declaration_id", UUID(as_uuid=True), ForeignKey("declarations.id"), primary_key=True),
    Column("document_id", UUID(as_uuid=True), ForeignKey("documents.id"), primary_key=True),
)

declaration_folders = Table(
    "declaration_folders",
    Base.metadata,
    Column("declaration_id", UUID(as_uuid=True), ForeignKey("declarations.id"), primary_key=True),
    Column("folder_id", UUID(as_uuid=True), ForeignKey("folders.id"), primary_key=True),
)


class Declaration(Base):
    __tablename__ = "declarations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    post_number = Column(String(5), nullable=False)  # 5 digits
    date = Column(Date, nullable=False)
    declaration_number = Column(String(7), nullable=False)  # 7 digits
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=False)
    mode = Column(Enum(DeclarationMode), nullable=False)
    note = Column(Text, nullable=True)
    group_id = Column(UUID(as_uuid=True), ForeignKey("declaration_groups.id"), nullable=True)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    client = relationship("Client", back_populates="declarations")
    owner = relationship("User", back_populates="owned_declarations", foreign_keys=[owner_id])
    company = relationship("Company", back_populates="declarations")
    group = relationship("DeclarationGroup", back_populates="declarations")
    vehicles = relationship("Vehicle", back_populates="declaration", cascade="all, delete-orphan")
    attached_documents = relationship("Document", secondary=declaration_documents)
    attached_folders = relationship("Folder", secondary=declaration_folders)
    linked_certificates = relationship("Certificate", secondary="certificate_declarations", back_populates="linked_declarations")
    linked_tasks = relationship("Task", secondary="task_declarations", back_populates="attached_declarations")
    
    @property
    def formatted_number(self) -> str:
        """Generate formatted declaration number: XXXXX/DD.MM.YYYY/XXXXXXX"""
        date_str = self.date.strftime("%d.%m.%Y")
        return f"{self.post_number}/{date_str}/{self.declaration_number}"
    
    def __repr__(self):
        return f"<Declaration {self.formatted_number}>"


class Vehicle(Base):
    __tablename__ = "vehicles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    declaration_id = Column(UUID(as_uuid=True), ForeignKey("declarations.id"), nullable=False)
    number = Column(String(50), nullable=False)
    type = Column(Enum(VehicleType), nullable=False)
    
    declaration = relationship("Declaration", back_populates="vehicles")
    
    def __repr__(self):
        return f"<Vehicle {self.number} ({self.type})>"


class DeclarationGroup(Base):
    __tablename__ = "declaration_groups"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    company = relationship("Company", back_populates="declaration_groups")
    declarations = relationship("Declaration", back_populates="group")
    
    def __repr__(self):
        return f"<DeclarationGroup {self.name}>"
