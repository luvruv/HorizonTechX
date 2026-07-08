const express = require("express");
const router = express.Router();
const { shortenUrl, redirectUrl, getHistory, deleteUrl, updateUrl } = require("../controllers/urlController");

// Shorten URL route
router.post("/api/url/shorten", shortenUrl);

// History route
router.get("/api/url/history", getHistory);

// Delete URL route
router.delete("/api/url/:code", deleteUrl);

// Update URL route
router.put("/api/url/:code", updateUrl);

// Redirect route (matches any short code, mounted after other static/api routes)
router.get("/:code", redirectUrl);

module.exports = router;
