# Binary City CRM — Assessment

A Client & Contact management web application built as part of the Binary City technical assessment.

## Tech Stack

| Layer    | Technology                            |
| -------- | ------------------------------------- |
| Backend  | Python · FastAPI                      |
| ORM      | SQLAlchemy                            |
| Database | SQLite                                |
| Frontend | Vanilla JavaScript (SPA) · HTML · CSS |

---

## Project Structure

```
binary-city-assessment/
├── backend/
│   ├── main.py                  # FastAPI app entry point, static file serving
│   ├── database.py              # SQLAlchemy engine, session, Base
│   ├── models/
│   │   ├── client.py            # Client ORM model + client_contacts junction table
│   │   └── contact.py           # Contact ORM model
│   ├── schemas/
│   │   ├── client.py            # Pydantic request/response schemas for clients
│   │   └── contact.py           # Pydantic request/response schemas for contacts
│   ├── methods/
│   │   ├── client_service.py    # Client business logic + code generation
│   │   └── contact_service.py   # Contact business logic
│   └── routers/
│       ├── clients.py           # /api/clients route handlers
│       └── contacts.py          # /api/contacts route handlers
├── frontend/
│   ├── index.html               # SPA shell (nav + app container)
│   ├── css/
│   │   └── style.css            # Layout, tables, tabs, forms
│   ├── images/
│   │   └── Welcome to Binary City.webp
│   └── js/
│       ├── app.js               # Hash-based router
│       ├── api.js               # Centralised AJAX fetch wrappers
│       ├── clients.js           # Client list + client form rendering
│       └── contacts.js          # Contact list + contact form rendering
├── main.py                      # Root entry point (imports backend app)
├── requirements.txt
└── .gitignore
```

---

## Database Schema

### `clients`

| Column | Type       | Constraints                |
| ------ | ---------- | -------------------------- |
| id     | INTEGER    | Primary Key, autoincrement |
| name   | VARCHAR    | NOT NULL                   |
| code   | VARCHAR(6) | NOT NULL, UNIQUE, INDEX    |

### `contacts`

| Column  | Type    | Constraints                |
| ------- | ------- | -------------------------- |
| id      | INTEGER | Primary Key, autoincrement |
| name    | VARCHAR | NOT NULL                   |
| surname | VARCHAR | NOT NULL                   |
| email   | VARCHAR | NOT NULL, UNIQUE, INDEX    |

### `client_contacts` (junction table)

| Column     | Type    | Constraints                        |
| ---------- | ------- | ---------------------------------- |
| client_id  | INTEGER | FK → clients.id ON DELETE CASCADE  |
| contact_id | INTEGER | FK → contacts.id ON DELETE CASCADE |

Primary Key: composite `(client_id, contact_id)`

### Relationships

- One client can be linked to many contacts
- One contact can be linked to many clients (many-to-many)
- Deleting a client or contact automatically removes their links via `CASCADE`

---

## Client Code Generation

Auto-generated 6-character code: **3 alpha + 3 numeric** (e.g. `FNB001`).

**Alpha part rules:**

1. Take the first letter of each word (initials)
2. If fewer than 3 initials, continue taking sequential letters from each word
3. If still fewer than 3, pad with `A`, `B`, `C`…

**Numeric part:** starts at `001` and increments until the full code is unique in the database.

| Client Name         | Alpha Part      | Code   |
| ------------------- | --------------- | ------ |
| First National Bank | F + N + B       | FNB001 |
| Protea              | P + R + O       | PRO001 |
| IT                  | I + T + A (pad) | ITA001 |
| Vesta Nassone       | V + N + E       | VNE001 |

---

## How to Run

**Prerequisites:** Python 3.10+

```bash
# 1. Clone the repository
git clone git@github-personal:Vesta-Nassone/binary-city-assessment.git
cd binary-city-assessment

# 2. Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Start the server
uvicorn main:app --reload

# 5. Open in browser
# http://localhost:8000
```

The SQLite database (`app.db`) is created automatically on first run.

---

## API Endpoints

### Clients

| Method | Endpoint                                  | Description                        |
| ------ | ----------------------------------------- | ---------------------------------- |
| GET    | `/api/clients`                            | List all clients (ordered by name) |
| POST   | `/api/clients`                            | Create a client                    |
| GET    | `/api/clients/{id}`                       | Get client with linked contacts    |
| PUT    | `/api/clients/{id}`                       | Update client name                 |
| DELETE | `/api/clients/{id}`                       | Delete client                      |
| GET    | `/api/clients/{id}/available-contacts`    | Contacts not yet linked to client  |
| POST   | `/api/clients/{id}/contacts/{contact_id}` | Link a contact                     |
| DELETE | `/api/clients/{id}/contacts/{contact_id}` | Unlink a contact                   |

### Contacts

| Method | Endpoint                                 | Description                                  |
| ------ | ---------------------------------------- | -------------------------------------------- |
| GET    | `/api/contacts`                          | List all contacts (ordered by surname, name) |
| POST   | `/api/contacts`                          | Create a contact                             |
| GET    | `/api/contacts/{id}`                     | Get contact with linked clients              |
| PUT    | `/api/contacts/{id}`                     | Update contact                               |
| DELETE | `/api/contacts/{id}`                     | Delete contact                               |
| GET    | `/api/contacts/{id}/available-clients`   | Clients not yet linked to contact            |
| POST   | `/api/contacts/{id}/clients/{client_id}` | Link a client                                |
| DELETE | `/api/contacts/{id}/clients/{client_id}` | Unlink a client                              |

---

## Validation

| Layer                          | What is validated                                                  |
| ------------------------------ | ------------------------------------------------------------------ |
| JavaScript (client)            | Required fields, email format — checked before any network request |
| FastAPI / Pydantic (server)    | Required fields, valid email format (`EmailStr`), unique email     |
| SQLAlchemy / SQLite (database) | UNIQUE constraints as a final guard                                |
