from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.database import get_db
from backend.models.booking import Booking
from backend.schemas.booking import BookingOut

router = APIRouter(prefix="/bookings", tags=["Réservations"])


@router.get("/{booking_id}", response_model=BookingOut)
def get_booking(booking_id: str, db: Session = Depends(get_db)):
    """Détail d'une réservation par son ID."""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Réservation introuvable")
    return booking


@router.get("/confirm/{code}", response_model=BookingOut)
def get_booking_by_code(code: str, db: Session = Depends(get_db)):
    """Récupérer une réservation par son code de confirmation."""
    booking = db.query(Booking).filter(Booking.confirmationCode == code).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Code de confirmation invalide")
    return booking
