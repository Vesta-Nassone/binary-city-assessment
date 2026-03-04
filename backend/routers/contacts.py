from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.schemas.contact import ContactCreate, ContactUpdate
from backend.methods import contact_service

router = APIRouter(prefix="/api/contacts", tags=["contacts"])


@router.get("")
def list_contacts(db: Session = Depends(get_db)):
    return contact_service.get_all_contacts(db)


@router.post("", status_code=201)
def create_contact(data: ContactCreate, db: Session = Depends(get_db)):
    return contact_service.create_contact(data, db)


@router.get("/{contact_id}")
def get_contact(contact_id: int, db: Session = Depends(get_db)):
    return contact_service.get_contact(contact_id, db)


@router.put("/{contact_id}")
def update_contact(contact_id: int, data: ContactUpdate, db: Session = Depends(get_db)):
    return contact_service.update_contact(contact_id, data, db)


@router.delete("/{contact_id}", status_code=204)
def delete_contact(contact_id: int, db: Session = Depends(get_db)):
    contact_service.delete_contact(contact_id, db)


@router.get("/{contact_id}/available-clients")
def available_clients(contact_id: int, db: Session = Depends(get_db)):
    return contact_service.get_available_clients(contact_id, db)


@router.post("/{contact_id}/clients/{client_id}", status_code=200)
def link_client(contact_id: int, client_id: int, db: Session = Depends(get_db)):
    return contact_service.link_client(contact_id, client_id, db)


@router.delete("/{contact_id}/clients/{client_id}", status_code=200)
def unlink_client(contact_id: int, client_id: int, db: Session = Depends(get_db)):
    return contact_service.unlink_client(contact_id, client_id, db)
