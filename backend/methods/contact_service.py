from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException

from backend.models.contact import Contact
from backend.models.client import Client
from backend.schemas.contact import ContactCreate, ContactUpdate


def get_all_contacts(db: Session) -> list[dict]:
    """Get a list of all contacts with their details.

    Args:
        db (Session): The database session.

    Returns:
        list[dict]: A list of dictionaries containing information about each contact.
    """

    contacts = (
        db.query(Contact)
        .order_by(func.lower(Contact.surname), func.lower(Contact.name))
        .all()
    )

    return [
        {
            "id": c.id,
            "name": c.name,
            "surname": c.surname,
            "email": c.email,
            "client_count": len(c.clients),
        }
        for c in contacts
    ]


def get_contact(contact_id: int, db: Session) -> dict:
    """Get a specific contact by ID with their details.

    Args:
        contact_id (int): The ID of the contact to retrieve.
        db (Session): The database session.

    Raises:
        HTTPException: If the contact is not found.

    Returns:
        dict: A dictionary containing the contact's details.
    """

    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    clients = sorted(contact.clients, key=lambda c: c.name.lower())

    return {
        "id": contact.id,
        "name": contact.name,
        "surname": contact.surname,
        "email": contact.email,
        "clients": [{"id": c.id, "name": c.name, "code": c.code} for c in clients],
    }


def create_contact(data: ContactCreate, db: Session) -> dict:
    """Create a new contact.

    Args:
        data (ContactCreate): The data for creating the contact.
        db (Session): The database session.

    Raises:
        HTTPException: If a contact with the same email already exists.

    Returns:
        dict: A dictionary containing the details of the created contact.
    """

    existing = (
        db.query(Contact)
        .filter(func.lower(Contact.email) == data.email.lower())
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=409, detail="A contact with this email already exists"
        )

    contact = Contact(name=data.name, surname=data.surname, email=data.email)

    db.add(contact)
    db.commit()
    db.refresh(contact)

    return {
        "id": contact.id,
        "name": contact.name,
        "surname": contact.surname,
        "email": contact.email,
        "client_count": 0,
    }


def update_contact(contact_id: int, data: ContactUpdate, db: Session) -> dict:
    """Update an existing contact's details.

    Args:
        contact_id (int): The ID of the contact to update.
        data (ContactUpdate): The data for updating the contact.
        db (Session): The database session.

    Raises:
        HTTPException: If the contact is not found or if a contact with the same email already exists.

    Returns:
        dict: A dictionary containing the updated contact's details.
    """

    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    if data.email.lower() != contact.email.lower():
        existing = (
            db.query(Contact)
            .filter(func.lower(Contact.email) == data.email.lower())
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=409, detail="A contact with this email already exists"
            )

    contact.name = data.name
    contact.surname = data.surname
    contact.email = data.email

    db.commit()
    db.refresh(contact)

    return {
        "id": contact.id,
        "name": contact.name,
        "surname": contact.surname,
        "email": contact.email,
        "client_count": len(contact.clients),
    }


def delete_contact(contact_id: int, db: Session) -> None:
    """Delete an existing contact.

    Args:
        contact_id (int): The ID of the contact to delete.
        db (Session): The database session.

    Raises:
        HTTPException: If the contact is not found.
    """

    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    db.delete(contact)
    db.commit()


def link_client(contact_id: int, client_id: int, db: Session) -> dict:
    """Link a client to a contact.

    Args:
        contact_id (int): The ID of the contact to link the client to.
        client_id (int): The ID of the client to link.
        db (Session): The database session.

    Raises:
        HTTPException: If the contact or client is not found or if the client is already linked to the contact.

    Returns:
        dict: A dictionary containing a success message.
    """

    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    if client in contact.clients:
        raise HTTPException(
            status_code=409, detail="Client already linked to this contact"
        )

    contact.clients.append(client)

    db.commit()

    return {"message": "Client linked successfully"}


def unlink_client(contact_id: int, client_id: int, db: Session) -> dict:
    """Unlink a client from a contact.

    Args:
        contact_id (int): The ID of the contact to unlink the client from.
        client_id (int): The ID of the client to unlink.
        db (Session): The database session.

    Raises:
        HTTPException: If the contact or client is not found or if the client is not linked to the contact.

    Returns:
        dict: A dictionary containing a success message.
    """

    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    if client not in contact.clients:
        raise HTTPException(
            status_code=404, detail="Client is not linked to this contact"
        )

    contact.clients.remove(client)

    db.commit()

    return {"message": "Client unlinked successfully"}


def get_available_clients(contact_id: int, db: Session) -> list[dict]:
    """Get a list of clients that are not currently linked to a specific contact.

    Args:
        contact_id (int): The ID of the contact to get available clients for.
        db (Session): The database session.

    Raises:
        HTTPException: If the contact is not found.

    Returns:
        list[dict]: A list of dictionaries containing information about available clients.
    """

    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    linked_ids = {c.id for c in contact.clients}

    all_clients = db.query(Client).order_by(func.lower(Client.name)).all()

    return [
        {"id": c.id, "name": c.name, "code": c.code}
        for c in all_clients
        if c.id not in linked_ids
    ]
