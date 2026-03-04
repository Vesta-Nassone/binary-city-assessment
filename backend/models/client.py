from sqlalchemy import Column, Integer, String, Table, ForeignKey
from sqlalchemy.orm import relationship
from backend.database import Base

# Many-to-many junction table
client_contacts = Table(
    "client_contacts",
    Base.metadata,
    Column(
        "client_id",
        Integer,
        ForeignKey("clients.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "contact_id",
        Integer,
        ForeignKey("contacts.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    code = Column(String(6), nullable=False, unique=True, index=True)

    contacts = relationship(
        "Contact",
        secondary=client_contacts,
        back_populates="clients",
        lazy="select",
    )
