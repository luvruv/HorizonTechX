const shortid = require("shortid");
const Url = require("../models/Url");
const asyncHandler = require("../middleware/asyncHandler");

// @route   POST /api/url/shorten
// @desc    Create short URL
const shortenUrl = asyncHandler(async (req, res) => {
    const { longUrl } = req.body;

    if (!longUrl) {
        res.status(400);
        throw new Error("Long URL is required");
    }

    // Validate original URL format
    try {
        new URL(longUrl);
    } catch (err) {
        res.status(400);
        throw new Error("Invalid long URL format. Please include http:// or https://");
    }

    // Check if URL already shortened
    let url = await Url.findOne({ longUrl });

    if (url) {
        return res.status(200).json(url);
    }

    // Generate unique short code
    const urlCode = shortid.generate();
    const baseUrl = process.env.BASE_URL || "http://localhost:5000";
    const shortUrl = `${baseUrl}/${urlCode}`;

    url = new Url({
        longUrl,
        shortUrl,
        urlCode,
        date: new Date(),
    });

    await url.save();
    res.status(201).json(url);
});

// @route   GET /:code
// @desc    Redirect to original URL
const redirectUrl = asyncHandler(async (req, res) => {
    const { code } = req.params;

    const url = await Url.findOne({ urlCode: code });

    if (url) {
        url.clicks++;
        await url.save();
        return res.redirect(url.longUrl);
    } else {
        // If code is not found, return 404 with HTML format (custom shortener 404 page)
        res.status(404);
        return res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Link Not Found</title>
                <style>
                    body {
                        background-color: #0f172a;
                        color: #f8fafc;
                        font-family: system-ui, -apple-system, sans-serif;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        height: 100vh;
                        margin: 0;
                    }
                    .container {
                        text-align: center;
                        padding: 2rem;
                        background: rgba(30, 41, 59, 0.7);
                        border-radius: 12px;
                        border: 1px solid rgba(255,255,255,0.1);
                        box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
                        backdrop-filter: blur(10px);
                        max-width: 400px;
                    }
                    h1 { color: #f43f5e; margin-bottom: 1rem; }
                    a { color: #38bdf8; text-decoration: none; font-weight: bold; }
                    a:hover { text-decoration: underline; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>404 - Not Found</h1>
                    <p>The shortened URL does not exist or has expired.</p>
                    <p><a href="/">Go to Homepage</a></p>
                </div>
            </body>
            </html>
        `);
    }
});

// @route   GET /api/url/history
// @desc    Get all shortened URLs history
const getHistory = asyncHandler(async (req, res) => {
    const urls = await Url.find().sort({ date: -1 });
    res.status(200).json(urls);
});

module.exports = {
    shortenUrl,
    redirectUrl,
    getHistory,
};
