# Event Registration System

A full-stack backend API for managing events, user registrations, and seat availability. Built with **Express.js**, **Sequelize ORM**, and **SQLite**.

---

## Project Description

The Event Registration System allows organizers to create and manage events, while users can browse events, register for seats, and manage their registrations. The system includes JWT authentication, role-based access control (user, organizer, admin), automatic seat tracking, and event status computation (upcoming, ongoing, completed).

---

## Features

- User registration and login with JWT
- Role-based access: `user`, `organizer`, `admin`
- Event CRUD (create/update/delete protected by role)
- Automatic seat management (decrement on register, increment on cancel)
- Duplicate registration prevention
- Event status: upcoming, ongoing, completed
- Search by title, venue, date with pagination
- Organizer dashboard (`/api/events/my-events`)
- View event registrations (organizer/admin)

---

## Technologies

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express.js |
| ORM | Sequelize |
| Database | SQLite |
| Auth | JWT + bcryptjs |

---

## Installation

```bash
cd HorizonTechX_EventRegistrationSystem
npm install
cp .env.example .env
# Edit .env and set JWT_SECRET
npm run seed
npm start
```

Server runs at `http://localhost:5000`

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `JWT_SECRET` | Secret for JWT signing | *(required)* |
| `DB_PATH` | SQLite database file path | `./database.sqlite` |

---

## Seed Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | admin123 |
| Organizer | organizer@example.com | organizer123 |

---

## Database Models

### User
`id`, `name`, `email`, `role`, `passwordHash`, `createdAt`, `updatedAt`

### Event
`id`, `title`, `description`, `location`, `date`, `capacity`, `availableSeats`, `organizerId`

### Registration
`id`, `userId`, `eventId`, `status` (pending/confirmed/canceled)

---

## API Endpoints

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login and get JWT token |

### Events
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/events` | Public | List events (pagination, search, filter) |
| GET | `/api/events/:id` | Public | Event details with status |
| GET | `/api/events/my-events` | Organizer | Organizer's own events |
| POST | `/api/events` | Organizer | Create event |
| PUT | `/api/events/:id` | Organizer/Admin | Update event |
| DELETE | `/api/events/:id` | Admin | Delete event |

**Query params for GET /api/events:**
- `page`, `limit` — pagination
- `search` — search by title/description
- `venue` — filter by location
- `date` — filter by date (YYYY-MM-DD)
- `status` — filter by eventStatus (upcoming/ongoing/completed)
- `sort` — newest, oldest, upcoming

### Registrations
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/events/:eventId/register` | User | Register for event |
| GET | `/api/users/me/registrations` | User | My registrations |
| GET | `/api/events/:eventId/registrations` | Organizer/Admin | Event registrations list |
| DELETE | `/api/registrations/:id` | User/Admin | Cancel registration |

---

## Example Requests

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"secret123"}'
```

### Create Event (Organizer)
```bash
curl -X POST http://localhost:5000/api/events \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Workshop","description":"Tech workshop","location":"Hall A","date":"2026-12-01T10:00:00","capacity":50}'
```

### Register for Event
```bash
curl -X POST http://localhost:5000/api/events/1/register \
  -H "Authorization: Bearer <token>"
```

---

## Error Responses

| Status | Meaning |
|--------|---------|
| 400 | Validation failed / event full / past event |
| 401 | Invalid credentials |
| 403 | Not authorized |
| 404 | Resource not found |
| 409 | Duplicate registration |
| 500 | Internal server error |

---

## Postman Collection

Import `postman/EventRegistration.postman_collection.json` for ready-made requests.

---

## Author

Horizon TechX Team
