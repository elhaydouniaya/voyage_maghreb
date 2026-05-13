from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.database import get_db
from backend.models.agency import Agency, AgencyStatus
from backend.models.booking import Booking
from backend.schemas.agency import AgencyOut, AgencyVerifyRequest
from backend.schemas.booking import BookingOut
from datetime import datetime

router = APIRouter(prefix="/admin", tags=["Administration"])


@router.get("/agencies", response_model=List[AgencyOut])
def admin_list_agencies(
    status: str = None,
    db: Session = Depends(get_db)
):
    """Liste toutes les agences (admin). Filtre possible par statut."""
    query = db.query(Agency)
    if status:
        query = query.filter(Agency.verificationStatus == status)
    return query.order_by(Agency.createdAt.desc()).all()


@router.patch("/agencies/{agency_id}/verify", response_model=AgencyOut)
def verify_agency(
    agency_id: str,
    payload: AgencyVerifyRequest,
    db: Session = Depends(get_db)
):
    """Vérifier ou rejeter une agence (admin)."""
    agency = db.query(Agency).filter(Agency.id == agency_id).first()
    if not agency:
        raise HTTPException(status_code=404, detail="Agence introuvable")
    agency.verificationStatus = payload.status
    agency.verificationNote = payload.note
    if payload.status == AgencyStatus.VERIFIED:
        agency.verifiedAt = datetime.utcnow()
    db.commit()
    db.refresh(agency)
    return agency


@router.get("/bookings", response_model=List[BookingOut])
def admin_list_bookings(
    status: str = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Liste toutes les réservations (admin)."""
    query = db.query(Booking)
    if status:
        query = query.filter(Booking.status == status)
    return query.order_by(Booking.createdAt.desc()).limit(limit).all()
