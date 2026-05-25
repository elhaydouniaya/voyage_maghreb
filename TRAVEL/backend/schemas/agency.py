from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum


class AgencyStatus(str, Enum):
    PENDING = "PENDING"
    UNDER_REVIEW = "UNDER_REVIEW"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"
    SUSPENDED = "SUSPENDED"


class AgencyOut(BaseModel):
    id: str
    name: str
    managerName: str
    email: str
    phoneNumber: str
    country: str
    city: str
    description: str
    verificationStatus: AgencyStatus
    createdAt: Optional[datetime] = None

    class Config:
        from_attributes = True


class AgencyVerifyRequest(BaseModel):
    status: AgencyStatus
    note: Optional[str] = None
