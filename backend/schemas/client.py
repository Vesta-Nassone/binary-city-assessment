from pydantic import BaseModel, field_validator


class ContactSummary(BaseModel):
    id: int
    name: str
    surname: str
    email: str

    model_config = {"from_attributes": True}


class ClientCreate(BaseModel):
    name: str

    @field_validator("name")
    @classmethod
    def name_must_not_be_blank(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Name is required")
        return v.strip()


class ClientUpdate(BaseModel):
    name: str

    @field_validator("name")
    @classmethod
    def name_must_not_be_blank(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Name is required")
        return v.strip()


class ClientResponse(BaseModel):
    id: int
    name: str
    code: str
    contact_count: int = 0

    model_config = {"from_attributes": True}


class ClientDetail(BaseModel):
    id: int
    name: str
    code: str
    contacts: list[ContactSummary] = []

    model_config = {"from_attributes": True}
