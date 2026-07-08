const express = require("express");
const router = express.Router();
const { shortenUrl, redirectUrl, getHistory } = require("../controllers/urlController");

// Shorten URL route
router.post("/api/url/shorten", shortenUrl);

// History route
router.get("/api/url/history", getHistory);

// Redirect route (matches any short code, mounted after other static/api routes)
router.get("/:code", redirectUrl);

module.exports = router;
