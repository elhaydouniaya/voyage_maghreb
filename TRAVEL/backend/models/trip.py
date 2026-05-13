from backend.database import Base
from sqlalchemy import Column, String, DateTime, Integer, Boolean, Enum as SAEnum, Text, ForeignKey, NUMERIC
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum


class TripType(str, enum.Enum):
    DESERT = "DESERT"
    CULTURE = "CULTURE"
    AVENTURE = "AVENTURE"
    FAMILLE = "FAMILLE"
    LUXE = "LUXE"
    NATURE = "NATURE"
    RELIGIEUX = "RELIGIEUX"
    HISTORIQUE = "HISTORIQUE"


class TripStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    FULL = "FULL"
    CLOSED = "CLOSED"
    CANCELLED = "CANCELLED"


class PhysicalLevel(str, enum.Enum):
    EASY = "EASY"
    MEDIUM = "MEDIUM"
    SPORT = "SPORT"
    EXPERT = "EXPERT"


class GroupTrip(Base):
    __tablename__ = "GroupTrip"

    id = Column(String, primary_key=True)
    agencyId = Column(String, ForeignKey("Agency.id"))
    title = Column(String)
    slug = Column(String, unique=True)
    destination = Column(String)
    description = Column(Text)
    coverImage = Column(String)
    startDate = Column(DateTime)
    endDate = Column(DateTime)
    durationDays = Column(Integer)
    totalPrice = Column(NUMERIC(10, 2))
    depositAmount = Column(NUMERIC(10, 2))
    currency = Column(String, default="EUR")
    totalSpots = Column(Integer)
    bookedSpots = Column(Integer, default=0)
    tripType = Column(SAEnum(TripType, name="TripType"))
    physicalLevel = Column(SAEnum(PhysicalLevel, name="PhysicalLevel"), nullable=True)
    status = Column(SAEnum(TripStatus, name="TripStatus"), default=TripStatus.DRAFT)
    isPublic = Column(Boolean, default=True)
    cancelledAt = Column(DateTime, nullable=True)
    cancelReason = Column(String, nullable=True)
    createdAt = Column(DateTime, server_default=func.now())
    updatedAt = Column(DateTime, onupdate=func.now())

    agency = relationship("Agency", back_populates="trips")
    bookings = relationship("Booking", back_populates="groupTrip")
