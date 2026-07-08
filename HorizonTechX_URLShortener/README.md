# Horizon URL Shortener

A premium, full-stack URL shortener application featuring a sleek glassmorphic single-page web interface, instant redirections, and dynamic click-tracking analytics.

---

## Project Description

**Horizon URL Shortener** is a web-based utility designed to trim long, unwieldy links into clean, shareable short URLs. It is built as a Model-View-Controller (MVC) application. The backend is powered by Node.js & Express.js, utilizing a MongoDB database to store original-to-short URL mappings. The frontend is styled using standard vanilla CSS (incorporating modern glassmorphism design principles) and utilizes vanilla JavaScript for asynchronous API queries and interactive user experiences.

---

## Features

- **Instant URL Shortening**: Converts long web addresses into unique, short links using a collision-resistant generation algorithm.
- **Click-Through Tracking**: Counts redirections to track link engagement details in real-time.
- **Live History Dashboard**: Displays a list of recently shortened links, their generation dates, original URLs, and dynamic click stats.
- **One-Click Clipboard Copying**: Interactive visual "Copied!" feedback and toast alerts.
- **Duplicate Prevention Cache**: Automatically returns an existing shortened link if the same long URL is input multiple times, reducing database load.
- **Robust URL Validation**: Verifies URL syntax client-side and server-side to prevent database pollution.
- **Built-in MongoDB DNS Patch**: Out-of-the-box support for Windows setups resolving MongoDB Atlas SRV query records.

---

## Technologies Used

- **Runtime Environment**: Node.js (v24.x)
- **Backend Framework**: Express.js
- **Database Engine**: MongoDB Atlas / Local MongoDB
- **ODM (Object Document Mapper)**: Mongoose
- **URL Code Generator**: shortid (v2.2.17)
- **Frontend Layer**: HTML5, Vanilla CSS3 (Custom Grid/Flex, Animations, Glassmorphic Variables), Vanilla JS

---

## Folder Structure

```text
HorizonTechX_URLShortener/
├── config/
│   └── db.js            # MongoDB connection settings & DNS bypass configuration
├── controllers/
│   └── urlController.js # API controllers (Shorten, Redirect, and Fetch History)
├── models/
│   └── Url.js           # Mongoose Database Schema for URL records
├── public/              # Client-side static assets
│   ├── index.html       # Single-page visual layout (HTML5)
│   ├── style.css        # Premium glassmorphic styling (CSS3)
│   └── app.js           # Frontend interactive controller logic
├── routes/
│   └── urlRoutes.js     # Express Router mapping paths to controllers
├── .env                 # Environment variables config (git ignored)
├── .env.example         # Sample environment variables template
├── .gitignore           # Git ignore patterns
├── package.json         # Node dependencies configuration
├── server.js            # Express application entrypoint
└── test.js              # Database connection diagnostic script
```

---

## Installation

### Prerequisites
- [Node.js](https://nodejs.org/) installed on your machine.
- A MongoDB cluster instance (either local or MongoDB Atlas).

### Steps
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/luvruv/HorizonTechX.git
   cd HorizonTechX_URLShortener
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory (or copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```
   Open the `.env` file and input your settings (refer to the **Environment Variables** section below).

4. **Run Diagnostics (Optional)**:
   Test the database connectivity before starting:
   ```bash
   node test.js
   ```

5. **Start the Application**:
   - For production / standard execution:
     ```bash
     npm start
     ```
   - For local development (auto-reload enabled via nodemon):
     ```bash
     npm run dev
     ```

6. **Access the App**:
   Open [http://localhost:5000](http://localhost:5000) in your web browser.

---

## Environment Variables

The application uses `dotenv` to load environment variables from the `.env` file in the project root:

| Variable | Description | Default | Example |
| :--- | :--- | :--- | :--- |
| `PORT` | The port the Express server will listen on. | `5000` | `5000` |
| `MONGO_URI` | The connection string for your MongoDB instance. | *None* | `mongodb+srv://user:pass@cluster.mongodb.net/dbName` |
| `BASE_URL` | The prefix domain used for generating short URLs. | `http://localhost:5000` | `http://localhost:5000` |

---

## API Endpoints

### 1. Shorten URL
- **Endpoint**: `POST /api/url/shorten`
- **Description**: Generates a shortened URL configuration for the provided long URL.
- **Request Body**:
  ```json
  {
    "longUrl": "https://www.google.com"
  }
  ```

### 2. Get Link History
- **Endpoint**: `GET /api/url/history`
- **Description**: Retrieves all shortened URLs stored in the database sorted by creation date (newest first).

### 3. Access Short URL (Redirection)
- **Endpoint**: `GET /:code`
- **Description**: Redirects the requester to the original destination URL, incrementing the redirection counter (`clicks`) by 1.

---

## Example Requests

### Shortening a Link (using curl)
```bash
curl -X POST http://localhost:5000/api/url/shorten \
  -H "Content-Type: application/json" \
  -d '{"longUrl": "https://news.ycombinator.com"}'
```

**Success Response (201 Created)**:
```json
{
  "_id": "64a2c1f8b4d89a1c8f1e4b8a",
  "longUrl": "https://news.ycombinator.com",
  "shortUrl": "http://localhost:5000/qDN2l_51-",
  "urlCode": "qDN2l_51-",
  "clicks": 0,
  "date": "2026-07-08T07:01:21.000Z",
  "__v": 0
}
```

---

## Future Improvements

- **Custom Short Slugs**: Allow users to enter custom paths (e.g., `http://localhost:5000/my-portfolio`).
- **QR Code Generator**: Automatically render a shareable QR Code alongside the generated shortened link.
- **Advanced Analytics**: Capture device type, geographical region, and referral origins for redirections.
- **Link Expiration**: Enable users to specify custom expiration times after which links deactivate.

---

## Author

**Horizon TechX Team**
- GitHub: [@luvruv](https://github.com/luvruv)
