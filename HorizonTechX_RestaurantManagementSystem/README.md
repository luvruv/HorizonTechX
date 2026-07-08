# Restaurant Management System

A comprehensive backend API for restaurant operations including menu management, order processing, table reservations, inventory tracking, and admin reporting. Built with **Express.js**, **Sequelize ORM**, and **PostgreSQL**.

---

## Project Description

This system manages the full restaurant workflow: customers browse the menu, place orders, and reserve tables. Staff and admins manage inventory, process orders through a status pipeline, and view sales reports. Orders automatically calculate bills (subtotal + tax), deduct inventory, and update table status.

---

## Features

- JWT authentication with roles: `admin`, `manager`, `Customer`
- Menu management with search and category filtering
- Order processing with automatic bill calculation (subtotal, tax, grand total)
- Order status pipeline: PENDING → PREPARING → READY → SERVED → COMPLETED
- Table management with automatic status updates (AVAILABLE, RESERVED, OCCUPIED)
- Reservation system with conflict detection (same table, same time, duplicate booking)
- Inventory auto-deduction on order placement
- Low stock alerts
- Admin reporting: sales summary, popular items, reservations, daily/weekly/monthly sales

---

## Technologies

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express.js |
| ORM | Sequelize |
| Database | PostgreSQL |
| Auth | JWT + bcryptjs |
| Validation | express-validator |

---

## Installation

```bash
cd HorizonTechX_RestaurantManagementSystem
npm install
cp .env.example .env
# Configure PostgreSQL credentials in .env
npm run seed
npm start
```

Server runs at `http://localhost:3000`

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `JWT_SECRET` | JWT signing secret | *(required)* |
| `JWT_EXPIRES_IN` | Token expiry | `1h` |
| `DB_NAME` | PostgreSQL database name | `restaurant_db` |
| `DB_USER` | PostgreSQL user | `postgres` |
| `DB_PASSWORD` | PostgreSQL password | `postgres` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `TAX_RATE` | Tax rate for orders | `0.05` (5%) |

---

## Seed Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@restaurant.com | admin123 |
| Manager | manager@restaurant.com | manager123 |

---

## Database Models

| Model | Key Fields |
|-------|-----------|
| User | name, email, role, passwordHash |
| Category | name |
| MenuItem | name, description, price, categoryId, available |
| Table | number, capacity, status |
| Order | userId, tableId, status, subtotal, taxAmount, totalAmount |
| OrderItem | orderId, menuItemId, quantity, price |
| Reservation | userId, tableId, reservationTime, guestCount, status |
| Inventory | itemName, menuItemId, quantity, unit, lowStockThreshold |

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |

### Menu
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/menu` | Public | List all menu items |
| GET | `/api/menu/search?q=` | Public | Search menu |
| GET | `/api/menu/category/:id` | Public | Filter by category |
| POST | `/api/menu` | Admin/Manager | Create item |
| PATCH | `/api/menu/:id` | Admin/Manager | Update item |
| DELETE | `/api/menu/:id` | Admin/Manager | Delete item |

### Orders
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/orders` | Customer | Place order (auto bill + inventory) |
| GET | `/api/orders` | Auth | List orders |
| GET | `/api/orders/:id` | Auth | Order details |
| PATCH | `/api/orders/:id` | Admin/Manager | Update order status |

**Order request body:**
```json
{
  "tableId": 1,
  "items": [{ "menuItemId": 1, "quantity": 2 }]
}
```

**Order response includes:**
```json
{
  "bill": { "subtotal": 37.98, "taxAmount": 1.90, "totalAmount": 39.88, "taxRate": 0.05 },
  "lowStockWarnings": [{ "itemName": "Pasta Stock", "quantity": 8, "threshold": 10 }]
}
```

### Tables
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tables` | List tables (`?available=true`) |
| POST | `/api/tables` | Create table (admin/manager) |

### Reservations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reservations` | Create reservation |
| GET | `/api/reservations` | List reservations |
| DELETE | `/api/reservations/:id` | Cancel reservation |

### Inventory
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory` | List inventory (`?low=true` for alerts) |
| POST | `/api/inventory` | Add item (admin/manager) |
| PATCH | `/api/inventory/:id` | Update quantity |

### Admin Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/sales` | Sales summary |
| GET | `/api/admin/sales-report?period=daily` | Daily/weekly/monthly report |
| GET | `/api/admin/popular-items` | Most ordered items |
| GET | `/api/admin/reservations` | Reservations by date |

---

## Business Logic

### Order Flow
1. Validate table and menu items exist
2. Check inventory availability
3. Calculate subtotal → tax → grand total
4. Create order with line items
5. Deduct inventory quantities
6. Set table status to OCCUPIED
7. Return low stock warnings if applicable

### Reservation Flow
1. Validate table capacity vs guest count
2. Check for time slot conflicts (same table, overlapping times)
3. Prevent duplicate user bookings
4. Set table status to RESERVED

### Table Status Auto-Update
- Order placed → OCCUPIED
- Reservation made → RESERVED
- Order completed/cancelled → AVAILABLE (or RESERVED if active reservation exists)

---

## Error Responses

| Status | Example |
|--------|---------|
| 400 | Invalid input, insufficient inventory, table occupied |
| 401 | Not logged in |
| 403 | Insufficient permissions |
| 404 | Menu item / table / order not found |
| 409 | Reservation conflict |
| 500 | Internal server error |

---

## Postman Collection

Import `postman/RestaurantManagement.postman_collection.json`

---

## Author

Horizon TechX Team
