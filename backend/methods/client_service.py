import re
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException

from backend.models.client import Client
from backend.schemas.client import ClientCreate, ClientUpdate


def _build_alpha_part(name: str) -> str:
    """
    Derive a 3-character uppercase alpha prefix from the client name.

    Strategy:
    1. Take the first alpha character of each word (initials).
    2. If that yields fewer than 3 characters, continue taking subsequent
        letters from each word in order until 3 characters are collected.
    3. If still fewer than 3 characters, pad with A, B, C… from the start
        of the alphabet until the prefix is exactly 3 characters long.

    Examples:
        "First National Bank" -> FNB  (one initial per word)
        "Protea"              -> PRO  (first three letters of a single word)
        "IT"                  -> ITA  (two letters + one pad char 'A')
    """

    words = re.findall(r"[A-Za-z]+", name.upper())
    if not words:
        return "AAA"

    # Build a deque of remaining chars per word; collect first char of each word first
    queues = [list(word) for word in words]
    result: list[str] = []

    # Step 1: take the first letter of every word
    for queue in queues:
        if len(result) == 3:
            break
        result.append(queue.pop(0))

    # Step 2: keep draining each word's remaining letters until we have 3
    if len(result) < 3:
        for queue in queues:
            while queue and len(result) < 3:
                result.append(queue.pop(0))

    # Step 3: pad with uppercase alphabets A, B, C, ... Z if still short
    pad_index = 0
    while len(result) < 3:
        result.append(chr(ord("A") + pad_index))
        pad_index += 1

    return "".join(result)


def _generate_client_code(name: str, db: Session) -> str:
    """
    Generate a unique 6-character client code: 3 alpha + 3 numeric.
    Alpha part derived from client name via _build_alpha_part.
    Numeric part increments from 1 until a unique code is found in the DB.
    """

    alpha_part = _build_alpha_part(name)

    n = 1
    while True:
        candidate = alpha_part + str(n).zfill(3)
        exists = db.query(Client).filter(Client.code == candidate).first()
        if not exists:
            return candidate
        n += 1


def get_all_clients(db: Session) -> list[dict]:
    """
    Get a list of all clients with their details.

    Args:
        db (Session): The database session.

    Returns:
        list[dict]: _description_
    """

    clients = db.query(Client).order_by(func.lower(Client.name)).all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "code": c.code,
            "contact_count": len(c.contacts),
        }
        for c in clients
    ]


def get_client(client_id: int, db: Session) -> dict:
    """Get a specific client by ID with their details.

    Args:
        client_id (int): The ID of the client to retrieve.
        db (Session): The database session.

    Raises:
        HTTPException: If the client is not found.

    Returns:
        dict: A dictionary containing the client's details.
    """

    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    contacts = sorted(
        client.contacts, key=lambda c: (c.surname.lower(), c.name.lower())
    )
    return {
        "id": client.id,
        "name": client.name,
        "code": client.code,
        "contacts": [
            {"id": c.id, "name": c.name, "surname": c.surname, "email": c.email}
            for c in contacts
        ],
    }


def create_client(data: ClientCreate, db: Session) -> dict:
    """Create a new client.

    Args:
        data (ClientCreate): The data for creating the client.
        db (Session): The database session.

    Returns:
        dict: A dictionary containing the details of the created client.
    """

    code = _generate_client_code(data.name, db)
    client = Client(name=data.name, code=code)

    db.add(client)
    db.commit()
    db.refresh(client)

    return {
        "id": client.id,
        "name": client.name,
        "code": client.code,
        "contact_count": 0,
    }


def update_client(client_id: int, data: ClientUpdate, db: Session) -> dict:
    """Update a specific client by ID.

    Args:
        client_id (int): The ID of the client to update.
        data (ClientUpdate): The data for updating the client.
        db (Session): The database session.

    Raises:
        HTTPException: If the client is not found.

    Returns:
        dict: A dictionary containing the updated client's details.
    """

    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    client.name = data.name

    db.commit()  # commit transaction to persist the name change before refreshing
    db.refresh(client)

    return {
        "id": client.id,
        "name": client.name,
        "code": client.code,
        "contact_count": len(client.contacts),
    }


def delete_client(client_id: int, db: Session) -> None:
    """Delete a specific client by ID.

    Args:
        client_id (int): The ID of the client to delete.
        db (Session): The database session.

    Raises:
        HTTPException: If the client is not found.
    """

    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    db.delete(client)
    db.commit()
