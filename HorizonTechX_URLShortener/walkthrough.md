# Walkthrough - Simple URL Shortener

We have successfully built and verified the Simple URL Shortener application! The project consists of a Node.js + Express backend connected to a MongoDB Atlas cluster, paired with a premium, glassmorphic single-page frontend.

---

## Changes and Accomplishments

### 1. Database & Schema
- Created the Mongoose schema: [Url.js](file:///c:/Users/jaind/Files/Horizon%20TechX/HorizonTechX_URLShortener/models/Url.js) to store mapping properties (`urlCode`, `longUrl`, `shortUrl`, `clicks`, `date`).
- Configured a DNS-override mechanism in [db.js](file:///c:/Users/jaind/Files/Horizon%20TechX/HorizonTechX_URLShortener/config/db.js) to use Google's DNS servers (`8.8.8.8`, `8.8.4.4`). This bypasses standard Windows-Node.js DNS resolution issues (`querySrv ECONNREFUSED`) when communicating with MongoDB Atlas.

### 2. Backend API & Routing
- Implemented controllers in [urlController.js](file:///c:/Users/jaind/Files/Horizon%20TechX/HorizonTechX_URLShortener/controllers/urlController.js):
  - `shortenUrl`: Accepts a long URL, validates it, checks database cache, generates a unique short code with `shortid`, and creates a new document.
  - `redirectUrl`: Listens on the base path for code parameters, increments the redirection statistics (`clicks`), and performs standard Express redirects (`res.redirect`).
  - `getHistory`: Fetches and returns all records sorted by generation date.
- Hooked routes in [urlRoutes.js](file:///c:/Users/jaind/Files/Horizon%20TechX/HorizonTechX_URLShortener/routes/urlRoutes.js) and initialized static resource routing in [server.js](file:///c:/Users/jaind/Files/Horizon%20TechX/HorizonTechX_URLShortener/server.js).

### 3. High-End UI Frontend
- Designed a stunning visual layout:
  - [index.html](file:///c:/Users/jaind/Files/Horizon%20TechX/HorizonTechX_URLShortener/public/index.html) - Glassmorphism card container, interactive inputs, and layout tables.
  - [style.css](file:///c:/Users/jaind/Files/Horizon%20TechX/HorizonTechX_URLShortener/public/style.css) - Vibrant gradients, backdrop blurs, floating ambient background lights, and smooth animations.
  - [app.js](file:///c:/Users/jaind/Files/Horizon%20TechX/HorizonTechX_URLShortener/public/app.js) - Submits inputs asynchronously, handles copy buttons, displays visual toast alerts, and live-reloads the recent link history table.

---

## Verification & Screenshots

We validated the setup end-to-end with the browser testing agent:
1. **Link Generation**: Shortened `https://www.google.com` to `http://localhost:5000/qDN2l_51-`.
2. **Redirection**: Visiting `http://localhost:5000/qDN2l_51-` successfully navigated to Google.
3. **Analytics**: Redirection correctly incremented click counts inside MongoDB.

Here is the visual proof:

### URL Shortener Dashboard (Link Shortened Successfully)
![URL Shortened Screen](/C:/Users/jaind/.gemini/antigravity-ide/brain/ae493ee1-a6f9-4ba0-a217-6adaa4c2833d/url_shortened_1783494209643.png)

### Link History Table showing Click Counts
![Refreshed Click Tracking](/C:/Users/jaind/.gemini/antigravity-ide/brain/ae493ee1-a6f9-4ba0-a217-6adaa4c2833d/refreshed_clicks_1783494431445.png)

### Video Recording of End-to-End Test Run
![Shortener Test Video](/C:/Users/jaind/.gemini/antigravity-ide/brain/ae493ee1-a6f9-4ba0-a217-6adaa4c2833d/url_shortener_test_1783494099157.webp)

---

## Guide: How to Connect via MongoDB Compass

Follow these steps to connect your MongoDB Compass client to the database cluster:

1. **Get the Connection URI**:
   Open `.env` and copy the database connection string:
   `mongodb+srv://urlshorteneruser:Url123456@cluster0.rwb8c83.mongodb.net/?appName=Cluster0`
2. **Launch MongoDB Compass**:
   Open the MongoDB Compass desktop app.
3. **Paste URI**:
   Paste the connection string into the **URI** field on the "New Connection" screen.
4. **Connect**:
   Click **Connect**. Compass will fetch the databases and show the `urls` collection.
