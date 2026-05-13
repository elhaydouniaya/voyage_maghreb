from backend.database import Base
from sqlalchemy import Column, String, DateTime, Boolean, Enum as SAEnum, Text, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum


class Role(str, enum.Enum):
    CLIENT = "CLIENT"
    AGENCY = "AGENCY"
    ADMIN = "ADMIN"


class User(Base):
    __tablename__ = "User"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=True)
    email = Column(String, unique=True, nullable=True)
    emailVerified = Column(DateTime, nullable=True)
    image = Column(String, nullable=True)
    passwordHash = Column(String, nullable=True)
    role = Column(SAEnum(Role, name="Role"), default=Role.CLIENT)
    createdAt = Column(DateTime, server_default=func.now())
    updatedAt = Column(DateTime, onupdate=func.now())

    agency = relationship("Agency", back_populates="user", uselist=False)
    bookings = relationship("Booking", back_populates="user")
