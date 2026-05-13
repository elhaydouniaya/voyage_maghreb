from backend.database import Base
from sqlalchemy import Column, String, DateTime, Integer, Enum as SAEnum, Text, ForeignKey, NUMERIC
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum


class BookingStatus(str, enum.Enum):
    PENDING_PAYMENT = "PENDING_PAYMENT"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"
    REFUNDED = "REFUNDED"
    NO_SHOW = "NO_SHOW"


class Booking(Base):
    __tablename__ = "Booking"

    id = Column(String, primary_key=True)
    groupTripId = Column(String, ForeignKey("GroupTrip.id"))
    agencyId = Column(String, ForeignKey("Agency.id"))
    userId = Column(String, ForeignKey("User.id"))
    travelRequestId = Column(String, nullable=True)
    clientName = Column(String)
    clientEmail = Column(String)
    clientPhone = Column(String, nullable=True)
    clientCountry = Column(String, nullable=True)
    numberOfSeats = Column(Integer, default=1)
    depositPaid = Column(NUMERIC(10, 2))
    totalAmount = Column(NUMERIC(10, 2))
    confirmationCode = Column(String, unique=True)
    cancellationToken = Column(String, unique=True)
    status = Column(SAEnum(BookingStatus, name="BookingStatus"), default=BookingStatus.PENDING_PAYMENT)
    cancellationReason = Column(String, nullable=True)
    cancelledAt = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    createdAt = Column(DateTime, server_default=func.now())
    updatedAt = Column(DateTime, onupdate=func.now())

    user = relationship("User", back_populates="bookings")
    agency = relationship("Agency", back_populates="bookings")
    groupTrip = relationship("GroupTrip", back_populates="bookings")
