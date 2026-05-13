from backend.database import Base
from sqlalchemy import Column, String, DateTime, Enum as SAEnum, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum


class AgencyStatus(str, enum.Enum):
    PENDING = "PENDING"
    UNDER_REVIEW = "UNDER_REVIEW"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"
    SUSPENDED = "SUSPENDED"


class Agency(Base):
    __tablename__ = "Agency"

    id = Column(String, primary_key=True)
    userId = Column(String, ForeignKey("User.id", ondelete="CASCADE"), unique=True)
    name = Column(String)
    managerName = Column(String)
    email = Column(String, unique=True)
    phoneNumber = Column(String)
    country = Column(String)
    city = Column(String)
    description = Column(Text)
    siret = Column(String, unique=True)
    verificationStatus = Column(SAEnum(AgencyStatus, name="AgencyStatus"), default=AgencyStatus.PENDING)
    verificationNote = Column(Text, nullable=True)
    verifiedAt = Column(DateTime, nullable=True)
    verifiedByUserId = Column(String, nullable=True)
    createdAt = Column(DateTime, server_default=func.now())
    updatedAt = Column(DateTime, onupdate=func.now())

    user = relationship("User", back_populates="agency")
    trips = relationship("GroupTrip", back_populates="agency")
    bookings = relationship("Booking", back_populates="agency")
