from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.database import get_db
from backend.models.agency import Agency, AgencyStatus
from backend.schemas.agency import AgencyOut, AgencyVerifyRequest

router = APIRouter(prefix="/agencies", tags=["Agences"])


@router.get("/", response_model=List[AgencyOut])
def get_agencies(db: Session = Depends(get_db)):
    """Liste toutes les agences vérifiées."""
    return db.query(Agency).filter(
        Agency.verificationStatus == AgencyStatus.VERIFIED
    ).all()


@router.get("/{agency_id}", response_model=AgencyOut)
def get_agency(agency_id: str, db: Session = Depends(get_db)):
    """Détail d'une agence."""
    agency = db.query(Agency).filter(Agency.id == agency_id).first()
    if not agency:
        raise HTTPException(status_code=404, detail="Agence introuvable")
    return agency
