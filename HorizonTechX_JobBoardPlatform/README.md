# HorizonTechX — Job Board Platform (Backend)

A production-style backend for a Job Board Platform, built with **Express.js** and **MongoDB (Mongoose)**.
It supports employers posting jobs, candidates uploading resumes and applying, application/status
tracking with in-app notifications, and an optional admin panel with reporting/analytics.

> Internship Task Submission — HorizonTechX
> Stack: Node.js, Express.js, MongoDB, Mongoose, JWT, Multer

---

## 1. Features

| Area | Capability |
|---|---|
| **Auth** | JWT-based auth for three roles: `employer`, `candidate`, `admin`. Passwords hashed with bcrypt. |
| **Employers** | Register, manage company profile, post/edit/close jobs, view dashboard stats. |
| **Candidates** | Register, manage profile (skills, experience, education), upload multiple resumes, apply to jobs, track application status. |
| **Job Listings** | Full CRUD, keyword search (MongoDB text index), filters (location, job type, category, experience level, skills, salary range, remote), sorting, pagination. |
| **Resumes** | Upload via Multer (PDF/DOC/DOCX, size-limited), manage multiple resumes per candidate, set a default resume. |
| **Applications** | Apply with a chosen (or default) resume + cover letter. Duplicate-application prevention. Employer-controlled status workflow (`applied → under_review → shortlisted → interview_scheduled → hired`, or `rejected` at any stage) with a validated state machine so illegal transitions are rejected. |
| **Notifications** | In-app notifications: employers are notified on new applications, candidates are notified on status changes. |
| **Admin Panel (optional, implemented)** | Platform-wide stats, jobs-by-category breakdown, applications funnel, top employers, employer verification, job moderation/removal. |
| **Security & robustness** | Helmet, CORS, rate limiting, centralized error handling, input validation via Mongoose schemas, ownership checks on every mutating job/application/resume route. |

---

## 2. Tech Stack

- **Runtime:** Node.js (>=18)
- **Framework:** Express.js 4
- **Database:** MongoDB with Mongoose ODM
- **Auth:** JSON Web Tokens (jsonwebtoken) + bcryptjs
- **File Uploads:** Multer (disk storage)
- **Security:** helmet, cors, express-rate-limit
- **Logging:** morgan
- **Dev tooling:** nodemon

---

## 3. Project Structure

```
HorizonTechX_JobBoardPlatform/
├── server.js                  # App entry point
├── package.json
├── .env.example                # Copy to .env and fill in
├── config/
│   └── db.js                  # MongoDB connection
├── models/                    # Mongoose schemas
│   ├── Employer.js
│   ├── Candidate.js
│   ├── Admin.js
│   ├── JobListing.js
│   ├── Resume.js
│   ├── Application.js
│   └── Notification.js
├── controllers/                # Business logic
│   ├── authController.js
│   ├── employerController.js
│   ├── candidateController.js
│   ├── jobController.js
│   ├── resumeController.js
│   ├── applicationController.js
│   ├── notificationController.js
│   └── adminController.js
├── routes/                    # Express routers
│   ├── authRoutes.js
│   ├── employerRoutes.js
│   ├── candidateRoutes.js
│   ├── jobRoutes.js
│   ├── resumeRoutes.js
│   ├── applicationRoutes.js
│   ├── notificationRoutes.js
│   └── adminRoutes.js
├── middleware/
│   ├── auth.js                 # JWT protect + role authorize
│   ├── errorHandler.js         # Centralized error + 404 handling
│   └── upload.js                # Multer config for resumes
├── utils/
│   ├── generateToken.js
│   ├── notify.js                # Creates in-app notifications
│   ├── apiFeatures.js           # Search/filter/sort/paginate query builder
│   └── constants.js             # Enums shared across the app
├── seed/
│   └── seed.js                  # Demo data seeder
├── uploads/resumes/             # Uploaded resume files land here
└── postman/
    └── HorizonTechX_JobBoard.postman_collection.json
```

---

## 4. Getting Started

### Prerequisites
- Node.js 18+
- MongoDB running locally, or a MongoDB Atlas connection string

### Setup

```bash
cd HorizonTechX_JobBoardPlatform
npm install
cp .env.example .env
# Edit .env: set MONGO_URI and JWT_SECRET at minimum
```

### Run

```bash
npm run dev      # nodemon, auto-restarts on changes
# or
npm start        # plain node
```

The API will be available at `http://localhost:5000`. Check `GET /api/health` to confirm it's running.

### Seed demo data (recommended for quick evaluation)

```bash
npm run seed
```

This creates:
- 1 admin account
- 2 employers (one verified, one not)
- 2 candidates (with skills/experience filled in)
- 3 job listings
- 1 sample resume + 1 sample application with status history
- Sample notifications

Printed credentials (also visible in the terminal after seeding):

| Role | Email | Password |
|---|---|---|
| Admin | admin@horizontechx.com | Admin@12345 |
| Employer (verified) | hr@nimbustech.com | Password@123 |
| Employer (unverified) | careers@greenleaf.com | Password@123 |
| Candidate | dhruva.demo@example.com | Password@123 |
| Candidate | ananya.demo@example.com | Password@123 |

To wipe all seeded data: `npm run seed:destroy`

### Testing the API
Import `postman/HorizonTechX_JobBoard.postman_collection.json` into Postman. Log in first, then
copy the returned `token` into the collection's `employerToken` / `candidateToken` / `adminToken`
variables.

---

## 5. API Reference

Base URL: `/api`

### Auth (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/register/employer` | Public | Register an employer account |
| POST | `/auth/register/candidate` | Public | Register a candidate account |
| POST | `/auth/login` | Public | Login — body: `{ email, password, role }` |
| GET | `/auth/me` | Private | Get the logged-in user's own profile |

### Employers (`/api/employers`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/employers/:id` | Public | View an employer's public profile |
| PUT | `/employers/profile` | Employer | Update own company profile |
| GET | `/employers/:id/jobs` | Public | List all jobs posted by an employer |
| GET | `/employers/dashboard/stats` | Employer | Job counts + application funnel for own jobs |

### Candidates (`/api/candidates`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/candidates/:id` | Private | View a candidate profile (self, employer, or admin) |
| PUT | `/candidates/profile` | Candidate | Update own profile (skills, experience, etc.) |
| GET | `/candidates/dashboard/applications` | Candidate | Application counts by status + recent applications |

### Jobs (`/api/jobs`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/jobs` | Employer | Post a new job |
| GET | `/jobs` | Public | Search/list jobs — see query params below |
| GET | `/jobs/:id` | Public | Get a single job (increments view count) |
| PUT | `/jobs/:id` | Employer (owner) | Update a job |
| DELETE | `/jobs/:id` | Employer (owner) | Delete a job (cascades to its applications) |
| PATCH | `/jobs/:id/status` | Employer (owner) | Set status: `draft`, `active`, `closed` |

**Search query params (`GET /jobs`):**
`keyword`, `location`, `jobType`, `category`, `experienceLevel`, `skills` (comma-separated),
`salaryMin`, `salaryMax`, `isRemote`, `sort`, `page`, `limit`

Example:
```
GET /api/jobs?keyword=developer&location=Gurugram&jobType=internship&skills=node.js,mongodb&salaryMin=10000&page=1&limit=10
```

### Resumes (`/api/resumes`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/resumes/upload` | Candidate | Upload a resume file (multipart field: `resume`) |
| GET | `/resumes/my` | Candidate | List own uploaded resumes |
| PATCH | `/resumes/:id/default` | Candidate (owner) | Mark a resume as the default for applications |
| DELETE | `/resumes/:id` | Candidate (owner) | Delete a resume |

### Applications (`/api/applications`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/applications` | Candidate | Apply to a job — body: `{ jobId, resumeId?, coverLetter? }` (uses default resume if `resumeId` omitted) |
| GET | `/applications/my` | Candidate | Track own applications (optional `?status=` filter) |
| GET | `/applications/job/:jobId` | Employer (job owner) | View all applicants for a job |
| GET | `/applications/:id` | Candidate or Employer (owner) | View a single application |
| PATCH | `/applications/:id/status` | Employer (owner) | Update status — body: `{ status, note? }`. Triggers a candidate notification. |

**Valid status transitions:**
```
applied → under_review → shortlisted → interview_scheduled → hired
             ↳ rejected      ↳ rejected         ↳ rejected
```
Any invalid transition (e.g. `applied` straight to `hired`) is rejected with a `400`.

### Notifications (`/api/notifications`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/notifications/my` | Employer/Candidate | List own notifications (optional `?unreadOnly=true`) |
| PATCH | `/notifications/:id/read` | Owner | Mark one notification read |
| PATCH | `/notifications/read-all` | Employer/Candidate | Mark all notifications read |

### Admin (`/api/admin`) — optional module, fully implemented
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/admin/stats/overview` | Admin | Platform totals (employers, candidates, jobs, applications) |
| GET | `/admin/stats/jobs-by-category` | Admin | Job counts grouped by category |
| GET | `/admin/stats/applications-funnel` | Admin | Applications grouped by status, platform-wide |
| GET | `/admin/stats/top-employers` | Admin | Top 10 employers by jobs posted |
| GET | `/admin/employers` | Admin | Paginated list of all employers |
| GET | `/admin/candidates` | Admin | Paginated list of all candidates |
| PATCH | `/admin/employers/:id/verify` | Admin | Verify/unverify an employer |
| DELETE | `/admin/jobs/:id` | Admin | Remove any job listing (moderation) |

---

## 6. Design Notes & Decisions

- **Three separate user collections** (`Employer`, `Candidate`, `Admin`) rather than one polymorphic
  `User` model. This keeps each role's schema clean (employers don't need `skills`, candidates
  don't need `companyWebsite`) and makes it impossible for a candidate to "become" an admin by
  editing a `role` field, since admin accounts live in an entirely separate, self-contained collection.
- **JWT encodes both `id` and `role`**, so `middleware/auth.js` knows which collection to query
  without needing an extra database round-trip to disambiguate.
- **Ownership checks are enforced at the controller level** for every mutating route on jobs,
  resumes, and applications — an employer can never edit another employer's job, and a candidate
  can never see another candidate's resume.
- **Denormalized `employer` field on `Application`** avoids an extra `populate` hop when an
  employer wants to see all applications across all of their job postings.
- **Status transitions are governed by a state machine** (`utils/constants.js →
  APPLICATION_STATUS_FLOW`) rather than allowing an arbitrary status string, which mirrors how
  real ATS (Applicant Tracking Systems) work and prevents illogical jumps.
- **In-app notifications** were chosen over external email delivery to keep the project
  self-contained and fully testable without third-party credentials, while still fulfilling the
  "employer notifications" requirement functionally (new application → employer notified;
  status change → candidate notified). Swapping in a real email provider (e.g. Nodemailer +
  SMTP) would only require extending `utils/notify.js`.
- **Search/filter/sort/pagination logic lives in one reusable class** (`utils/apiFeatures.js`)
  instead of being duplicated across controllers.
- **MongoDB text index** on `title`, `description`, and `skillsRequired` powers the `keyword`
  search parameter efficiently at the database level rather than filtering in application code.

---

## 7. Possible Future Enhancements

- Real email notifications (Nodemailer) alongside in-app notifications
- Refresh tokens / token blacklisting on logout
- Cloud file storage (S3/Cloudinary) for resumes instead of local disk
- Automated tests (Jest + Supertest) for controllers and auth flows
- Elasticsearch for more advanced fuzzy job search

---

## 8. Author

Built as an internship task submission — HorizonTechX Job Board Platform.
