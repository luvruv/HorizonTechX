const shortid = require("shortid");
const Url = require("../models/Url");

// @route   POST /api/url/shorten
// @desc    Create short URL
const shortenUrl = async (req, res) => {
    const { longUrl } = req.body;

    if (!longUrl) {
        return res.status(400).json({ error: "Long URL is required" });
    }

    // Validate original URL format
    try {
        new URL(longUrl);
    } catch (err) {
        return res.status(400).json({ error: "Invalid long URL format. Please include http:// or https://" });
    }

    try {
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
    } catch (err) {
        console.error("Error in shortenUrl:", err);
        res.status(500).json({ error: "Server error occurred while shortening URL" });
    }
};

// @route   GET /:code
// @desc    Redirect to original URL
const redirectUrl = async (req, res) => {
    const { code } = req.params;

    try {
        const url = await Url.findOne({ urlCode: code });

        if (url) {
            url.clicks++;
            await url.save();
            return res.redirect(url.longUrl);
        } else {
            return res.status(404).send(`
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
    } catch (err) {
        console.error("Error in redirectUrl:", err);
        res.status(500).send("Server error occurred");
    }
};

// @route   GET /api/url/history
// @desc    Get all shortened URLs history
const getHistory = async (req, res) => {
    try {
        const urls = await Url.find().sort({ date: -1 });
        res.status(200).json(urls);
    } catch (err) {
        console.error("Error in getHistory:", err);
        res.status(500).json({ error: "Server error occurred while fetching history" });
    }
};

module.exports = {
    shortenUrl,
    redirectUrl,
    getHistory,
};
