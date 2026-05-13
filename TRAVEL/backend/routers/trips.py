from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.database import get_db
from backend.models.trip import GroupTrip, TripStatus
from backend.schemas.trip import TripOut

router = APIRouter(prefix="/trips", tags=["Voyages"])


@router.get("/", response_model=List[TripOut])
def get_trips(
    destination: Optional[str] = None,
    trip_type: Optional[str] = None,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """Liste les voyages publics et publiés."""
    query = db.query(GroupTrip).filter(
        GroupTrip.isPublic == True,
        GroupTrip.status == TripStatus.PUBLISHED
    )
    if destination:
        query = query.filter(GroupTrip.destination.ilike(f"%{destination}%"))
    if trip_type:
        query = query.filter(GroupTrip.tripType == trip_type)
    return query.limit(limit).all()


@router.get("/{slug}", response_model=TripOut)
def get_trip(slug: str, db: Session = Depends(get_db)):
    """Détail d'un voyage par son slug."""
    trip = db.query(GroupTrip).filter(GroupTrip.slug == slug).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Voyage introuvable")
    return trip
