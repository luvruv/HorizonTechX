# HorizonTechX Portfolio — Advanced Backend Developer Showcase

This repository consolidated suite of **four production-grade backend systems** developed and upgraded during the HorizonTechX Software Engineering Internship. The codebase has been optimized for reliability, strict data integrity, database compatibility, security, and real-world business workflows.

---

## 📂 Project Showcase Overview

### 1. 🔗 URL Shortener (`HorizonTechX_URLShortener`)
A secure, high-performance URL shortener featuring real-time click tracking, persistent QR Codes, custom alias creation, and expiration dates.
*   **Security & SSRF Prevention**: Prevents loops by blocking aliases pointing back to the host system and halts SSRF by blocking loopback/localhost (`127.0.0.1`, `::1`) and private subnets (`10.0.0.0/8`, `192.168.0.0/16`, `172.16.0.0/12`).
*   **Persistent QR Codes**: Generates and stores QR Code data URLs in MongoDB immediately upon URL creation.
*   **Structured Analytics**: Parses User-Agent strings on redirect to record OS, browser, referrer hostname, visitor IP, and timestamp, offering timeline and demographic charts in stats query.
*   **Expiry (HTTP 410)**: Automatically returns a custom expired page if a link is accessed past its expiration date.

### 2. 🎟️ Event Registration (`HorizonTechX_EventRegistrationSystem`)
A concurrent event ticketing platform managing seat allocation, capacity controls, user accounts, and registrations.
*   **Race Condition Mitigation**: Uses Sequelize database transactions with row-level locking (`SELECT FOR UPDATE`) to guarantee zero double-bookings on the final available seat.
*   **Database Constraints**: Implements model-level `min: 0` checks on `availableSeats` to ensure counts can never fall below zero.
*   **Capacity Guards**: Prevents organizers from lowering event capacity below the count of already-registered attendees, while adjusting available seats proportionally for other capacity modifications.
*   **High Performance Filters**: Filters events (upcoming, completed, ongoing) directly in database engine queries rather than processing arrays in memory post-pagination.

### 3. 🍽️ Restaurant Management (`HorizonTechX_RestaurantManagementSystem`)
An automated ERP backend for tables, reservation timelines, menus, inventory replenishment, billing, and sales analytics.
*   **Dialect-Aware Reporting**: Auto-detects database driver config at runtime. Formats date intervals via SQL `TO_CHAR()` for PostgreSQL production and falls back to SQLite `strftime()` for local dev runs, preventing runtime syntax failures.
*   **Automatic Inventory Deductions**: Atomically reduces menu item ingredients inside the order transaction, blocking transactions and returning alerts if ingredients are depleted.
*   **Reservation Timeline Overlaps**: Computes conflicting tables within a 2-hour window (`RESERVATION_WINDOW_MS`) to prevent overbooking.
*   **Table Lifecycle Hooks**: Automates table state transitions (`AVAILABLE`, `RESERVED`, `OCCUPIED`) based on active customer ordering and reservation calendars.

### 4. 💼 Job Board Platform (`HorizonTechX_JobBoardPlatform`)
A recruiter-facing recruitment system featuring search filtering, resume portfolios, status history tracking, and automated candidate matches.
*   **Matching Skill Alert Alerts**: Posts trigger automated matching skill check alerts: candidates with overlapping skills receive instant notifications of the new job.
*   **Strict Document Validation**: Multer file uploads verify actual MIME types against extensions (PDF, DOC, DOCX) to block spoofed headers. Limiting checks cap resumes to 5 per candidate and unlink invalid uploads from disk to prevent storage leaks.
*   **Advanced Search Filters**: Implements comma-separated queries for multiple job types (`jobType=full-time,remote`), experience levels, and relative posted age calculations (`datePosted=X` days).
*   **Application Withdrawal Flow**: Permits candidates to withdraw applications from non-terminal states, logging status histories and notifying employers immediately.

---

## 🛠️ Global Architecture & Security Highlights
1.  **Rate Limiting**: Integrated `express-rate-limit` to protect public signup/login pathways from brute-force attempts.
2.  **Password Safety Rules**: Enforces complex password checks: minimum 8 characters, at least 1 uppercase letter, 1 digit, and 1 special symbol.
3.  **Generic Auth Error Responses**: Prevents account/email enumeration by returning identical generic credential validation errors for login failures.
4.  **Error Handler Interceptors**: Centralized catch blocks capture database uniqueness, validation, foreign key conflicts, and JWT expirations, responding with consistent RESTful HTTP codes.

---

## 🚀 How to Run the Applications

Ensure you have **Node.js (>= 18)** and **MongoDB / PostgreSQL / SQLite** running locally depending on the configuration.

### 1. URL Shortener
```bash
cd HorizonTechX_URLShortener
npm install
npm run dev
```

### 2. Event Registration System
```bash
cd HorizonTechX_EventRegistrationSystem
npm install
npm run seed     # Seeds demo events, organizers, and user logins
npm run dev
```

### 3. Restaurant Management System
```bash
cd HorizonTechX_RestaurantManagementSystem
npm install
npm run seed     # Seeds categories, table capacity, menus, and inventory
npm run dev
```

### 4. Job Board Platform
```bash
cd HorizonTechX_JobBoardPlatform
npm install
npm run seed     # Seeds initial recruiter, candidates, and job posts
npm run dev
```
