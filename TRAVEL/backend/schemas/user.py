from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum


class Role(str, Enum):
    CLIENT = "CLIENT"
    AGENCY = "AGENCY"
    ADMIN = "ADMIN"


class UserBase(BaseModel):
    id: str
    name: Optional[str] = None
    email: Optional[str] = None
    role: Role
    createdAt: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserPublic(BaseModel):
    id: str
    name: Optional[str] = None
    email: Optional[str] = None
    role: Role

    class Config:
        from_attributes = True
