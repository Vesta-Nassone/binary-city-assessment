from pydantic import BaseModel, EmailStr, field_validator


class ClientSummary(BaseModel):
    id: int
    name: str
    code: str

    model_config = {"from_attributes": True}


class ContactCreate(BaseModel):
    name: str
    surname: str
    email: EmailStr

    @field_validator("name")
    @classmethod
    def name_must_not_be_blank(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Name is required")
        return v.strip()

    @field_validator("surname")
    @classmethod
    def surname_must_not_be_blank(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Surname is required")
        return v.strip()


class ContactUpdate(BaseModel):
    name: str
    surname: str
    email: EmailStr

    @field_validator("name")
    @classmethod
    def name_must_not_be_blank(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Name is required")
        return v.strip()

    @field_validator("surname")
    @classmethod
    def surname_must_not_be_blank(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Surname is required")
        return v.strip()


class ContactResponse(BaseModel):
    id: int
    name: str
    surname: str
    email: str
    client_count: int = 0

    model_config = {"from_attributes": True}


class ContactDetail(BaseModel):
    id: int
    name: str
    surname: str
    email: str
    clients: list[ClientSummary] = []

    model_config = {"from_attributes": True}
