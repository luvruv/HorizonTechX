const { nanoid } = require("nanoid");
const Url = require("../models/Url");
const asyncHandler = require("../middleware/asyncHandler");
const path = require("path");
const QRCode = require("qrcode");

// @route   POST /api/url/shorten
// @desc    Create short URL with optional custom alias and expiration
const shortenUrl = asyncHandler(async (req, res) => {
    let { longUrl, customAlias, expiresAt } = req.body;

    if (!longUrl) {
        res.status(400);
        throw new Error("Long URL is required");
    }

    const urlCode = customAlias || nanoid(8);

    const existing = await Url.findOne({ urlCode });
    if (existing) {
        res.status(400);
        throw new Error("Alias already in use");
    }

    const baseUrl = process.env.BASE_URL || "http://localhost:5000";
    const shortUrl = `${baseUrl}/${urlCode}`;

    const newUrl = new Url({
        longUrl,
        shortUrl,
        urlCode,
        expiresAt: expiresAt ? new Date(expiresAt) : null
    });

    await newUrl.save();
    res.status(201).json({
        success: true,
        message: "Short URL created successfully",
        data: newUrl
    });
});

// @route   GET /:code
// @desc    Redirect to original URL
const redirectUrl = asyncHandler(async (req, res) => {
    const { code } = req.params;
    const url = await Url.findOne({ urlCode: code });

    if (!url || (url.expiresAt && url.expiresAt < new Date())) {
        res.status(404);
        return res.sendFile(path.join(__dirname, "../public/404.html"));
    }

    url.clicks++;
    await url.save();
    return res.redirect(url.longUrl);
});

// @route   GET /api/url/stats/:code
// @desc    Get detailed stats
const getStats = asyncHandler(async (req, res) => {
    const url = await Url.findOne({ urlCode: req.params.code });
    if (!url) {
        res.status(404);
        throw new Error("URL not found");
    }

    const qrCode = await QRCode.toDataURL(url.shortUrl);
    res.status(200).json({ ...url.toObject(), qrCode });
});

// @route   GET /api/url/overall/stats
// @desc    Get overall stats for all URLs
const getOverallStats = asyncHandler(async (req, res) => {
    const totalUrls = await Url.countDocuments();
    const stats = await Url.aggregate([
        {
            $group: {
                _id: null,
                totalClicks: { $sum: "$clicks" }
            }
        }
    ]);
    const totalClicks = stats.length > 0 ? stats[0].totalClicks : 0;
    res.status(200).json({ totalUrls, totalClicks });
});

// @route   DELETE /api/url/:code
// @desc    Delete URL
const deleteUrl = asyncHandler(async (req, res) => {
    const url = await Url.findOneAndDelete({ urlCode: req.params.code });
    if (!url) {
        res.status(404);
        throw new Error("URL not found");
    }
    res.status(200).json({ message: "URL deleted" });
});

// @route   PUT /api/url/:code
// @desc    Update long URL
const updateUrl = asyncHandler(async (req, res) => {
    const { longUrl } = req.body;
    const url = await Url.findOneAndUpdate(
        { urlCode: req.params.code },
        { longUrl },
        { new: true }
    );
    if (!url) {
        res.status(404);
        throw new Error("URL not found");
    }
    res.status(200).json(url);
});

// @route   GET /api/url/history
// @desc    Get all URLs
const getHistory = asyncHandler(async (req, res) => {
    const urls = await Url.find().sort({ createdAt: -1 });
    res.status(200).json(urls);
});

module.exports = {
    shortenUrl,
    redirectUrl,
    getStats,
    getOverallStats,
    deleteUrl,
    updateUrl,
    getHistory,
};
