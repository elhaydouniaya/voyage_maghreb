from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal
from enum import Enum


class TripType(str, Enum):
    DESERT = "DESERT"
    CULTURE = "CULTURE"
    AVENTURE = "AVENTURE"
    FAMILLE = "FAMILLE"
    LUXE = "LUXE"
    NATURE = "NATURE"
    RELIGIEUX = "RELIGIEUX"
    HISTORIQUE = "HISTORIQUE"


class TripStatus(str, Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    FULL = "FULL"
    CLOSED = "CLOSED"
    CANCELLED = "CANCELLED"


class TripOut(BaseModel):
    id: str
    agencyId: str
    title: str
    slug: str
    destination: str
    description: str
    coverImage: str
    startDate: datetime
    endDate: datetime
    durationDays: int
    totalPrice: Decimal
    depositAmount: Decimal
    currency: str
    totalSpots: int
    bookedSpots: int
    tripType: TripType
    status: TripStatus
    isPublic: bool
    createdAt: Optional[datetime] = None

    class Config:
        from_attributes = True
