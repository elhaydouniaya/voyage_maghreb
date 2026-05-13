from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal
from enum import Enum


class BookingStatus(str, Enum):
    PENDING_PAYMENT = "PENDING_PAYMENT"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"
    REFUNDED = "REFUNDED"
    NO_SHOW = "NO_SHOW"


class BookingOut(BaseModel):
    id: str
    groupTripId: str
    agencyId: str
    userId: str
    clientName: str
    clientEmail: str
    clientPhone: Optional[str] = None
    numberOfSeats: int
    depositPaid: Decimal
    totalAmount: Decimal
    confirmationCode: str
    status: BookingStatus
    createdAt: Optional[datetime] = None

    class Config:
        from_attributes = True
