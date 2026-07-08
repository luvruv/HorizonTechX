const express = require("express");
const router = express.Router();
const {
    shortenUrl,
    getHistory,
    deleteUrl,
    updateUrl,
    getStats,
    getOverallStats,
} = require("../controllers/urlController");

router.post("/shorten", shortenUrl);
router.get("/history", getHistory);
router.get("/stats/:code", getStats);
router.get("/overall/stats", getOverallStats);
router.delete("/:code", deleteUrl);
router.put("/:code", updateUrl);

module.exports = router;
