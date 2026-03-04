from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.schemas.client import ClientCreate, ClientUpdate
from backend.methods import client_service

router = APIRouter(prefix="/api/clients", tags=["clients"])


@router.get("")
def list_clients(db: Session = Depends(get_db)):
    return client_service.get_all_clients(db)


@router.post("", status_code=201)
def create_client(data: ClientCreate, db: Session = Depends(get_db)):
    return client_service.create_client(data, db)


@router.get("/{client_id}")
def get_client(client_id: int, db: Session = Depends(get_db)):
    return client_service.get_client(client_id, db)


@router.put("/{client_id}")
def update_client(client_id: int, data: ClientUpdate, db: Session = Depends(get_db)):
    return client_service.update_client(client_id, data, db)


@router.delete("/{client_id}", status_code=204)
def delete_client(client_id: int, db: Session = Depends(get_db)):
    client_service.delete_client(client_id, db)


@router.get("/{client_id}/available-contacts")
def available_contacts(client_id: int, db: Session = Depends(get_db)):
    return client_service.get_available_contacts(client_id, db)


@router.post("/{client_id}/contacts/{contact_id}", status_code=200)
def link_contact(client_id: int, contact_id: int, db: Session = Depends(get_db)):
    return client_service.link_contact(client_id, contact_id, db)


@router.delete("/{client_id}/contacts/{contact_id}", status_code=200)
def unlink_contact(client_id: int, contact_id: int, db: Session = Depends(get_db)):
    return client_service.unlink_contact(client_id, contact_id, db)
