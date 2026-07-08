const { nanoid } = require("nanoid");
const Url = require("../models/Url");
const asyncHandler = require("../middleware/asyncHandler");
const path = require("path");
const QRCode = require("qrcode");
const { isValidUrl } = require("../utils/validateUrl");
const { parseUserAgent } = require("../utils/userAgent");

const formatUrlResponse = (url, extra = {}) => ({
  success: true,
  data: {
    id: url._id,
    longUrl: url.longUrl,
    shortUrl: url.shortUrl,
    urlCode: url.urlCode,
    clicks: url.clicks,
    createdAt: url.createdAt,
    updatedAt: url.updatedAt,
    expiresAt: url.expiresAt,
    lastVisited: url.lastVisited,
    ...extra,
  },
});

// Reserved codes that cannot be used as custom aliases
const RESERVED_CODES = new Set(["api", "favicon.ico", "history", "stats", "overall", "shorten"]);

// @route   POST /api/url/shorten
const shortenUrl = asyncHandler(async (req, res) => {
  let { longUrl, customAlias, expiresAt } = req.body;

  const validation = isValidUrl(longUrl);
  if (!validation.valid) {
    res.status(400);
    throw new Error(validation.message);
  }
  longUrl = validation.normalized;

  // Validate expiration date if provided
  let expirationDate = null;
  if (expiresAt) {
    expirationDate = new Date(expiresAt);
    if (isNaN(expirationDate.getTime())) {
      res.status(400);
      throw new Error("Invalid expiration date format");
    }
    if (expirationDate <= new Date()) {
      res.status(400);
      throw new Error("Expiration date must be in the future");
    }
  }

  // If a custom alias is requested
  if (customAlias) {
    const aliasClean = customAlias.trim().toLowerCase();
    
    // Validate alias character set
    if (!/^[a-z0-9-_]+$/i.test(aliasClean)) {
      res.status(400);
      throw new Error("Custom alias can only contain alphanumeric characters, hyphens, and underscores");
    }

    if (RESERVED_CODES.has(aliasClean)) {
      res.status(400);
      throw new Error("This custom alias is reserved and cannot be used");
    }

    // Check if alias is already in use
    const existingCode = await Url.findOne({ urlCode: aliasClean });
    if (existingCode) {
      res.status(400);
      throw new Error("Custom alias is already in use. Please choose another.");
    }
    
    customAlias = aliasClean;
  } else {
    // If no custom alias is requested, check if the URL is already shortened with a system-generated code
    // and has the same/no expiration (to prevent redundant duplicates)
    const existingByLong = await Url.findOne({ 
      longUrl, 
      alias: { $exists: false }, // Only return if it's not a custom alias
      expiresAt: expirationDate
    });
    
    if (existingByLong) {
      return res.status(200).json({
        success: true,
        message: "URL already shortened — returning existing short link",
        duplicate: true,
        data: {
          id: existingByLong._id,
          longUrl: existingByLong.longUrl,
          shortUrl: existingByLong.shortUrl,
          urlCode: existingByLong.urlCode,
          clicks: existingByLong.clicks,
          createdAt: existingByLong.createdAt,
          updatedAt: existingByLong.updatedAt,
          expiresAt: existingByLong.expiresAt,
        },
      });
    }
  }

  const baseUrl = process.env.BASE_URL || "http://localhost:5000";
  const shortUrl = `${baseUrl}/${urlCode}`;
  
  // Pre-generate QR Code during creation and store it in DB
  const qrCode = await QRCode.toDataURL(shortUrl);

  const newUrl = new Url({
    longUrl,
    shortUrl,
    urlCode,
    alias: customAlias || undefined,
    expiresAt: expirationDate,
    qrCode,
  });

  await newUrl.save();
  
  res.status(201).json({
    success: true,
    message: "Short URL created successfully",
    duplicate: false,
    data: newUrl,
  });
});

// @route   GET /:code
const redirectUrl = asyncHandler(async (req, res) => {
  const { code } = req.params;
  const url = await Url.findOne({ urlCode: code });

  if (!url) {
    res.status(404);
    return res.sendFile(path.join(__dirname, "../public/404.html"));
  }

  if (url.expiresAt && url.expiresAt < new Date()) {
    res.status(410); // Gone status
    return res.sendFile(path.join(__dirname, "../public/404.html"));
  }

  // Collect Rich Click Analytics
  const userAgentString = req.headers["user-agent"] || "";
  const referrer = req.headers["referer"] || req.headers["referrer"] || "Direct";
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
  const { browser, os } = parseUserAgent(userAgentString);

  url.clicks += 1;
  url.lastVisited = new Date();
  
  url.analytics.push({
    timestamp: new Date(),
    ip,
    userAgent: userAgentString,
    referrer,
    browser,
    os
  });

  await url.save();
  return res.redirect(url.longUrl);
});

// @route   GET /api/url/stats/:code
const getStats = asyncHandler(async (req, res) => {
  const url = await Url.findOne({ urlCode: req.params.code });
  if (!url) {
    res.status(404);
    throw new Error("URL not found");
  }

  // Check expiration status
  const isExpired = url.expiresAt && url.expiresAt < new Date();

  // Generate statistics breakdown
  const browserStats = {};
  const osStats = {};
  const referrerStats = {};
  const dailyClicks = {};

  url.analytics.forEach(click => {
    // Browser breakdown
    browserStats[click.browser] = (browserStats[click.browser] || 0) + 1;
    // OS breakdown
    osStats[click.os] = (osStats[click.os] || 0) + 1;
    // Referrer breakdown
    const refDomain = click.referrer === 'Direct' ? 'Direct' : new URL(click.referrer).hostname;
    referrerStats[refDomain] = (referrerStats[refDomain] || 0) + 1;
    
    // Daily clicks breakdown
    const dateStr = click.timestamp.toISOString().split('T')[0];
    dailyClicks[dateStr] = (dailyClicks[dateStr] || 0) + 1;
  });

  const qrCode = url.qrCode || await QRCode.toDataURL(url.shortUrl);
  
  res.status(200).json(formatUrlResponse(url, { 
    qrCode,
    isExpired: !!isExpired,
    analyticsSummary: {
      browsers: browserStats,
      os: osStats,
      referrers: referrerStats,
      timeline: dailyClicks
    }
  }));
});

// @route   GET /api/url/overall/stats
const getOverallStats = asyncHandler(async (req, res) => {
  const totalUrls = await Url.countDocuments();
  const stats = await Url.aggregate([
    { $group: { _id: null, totalClicks: { $sum: "$clicks" } } },
  ]);
  const totalClicks = stats.length > 0 ? stats[0].totalClicks : 0;
  
  res.status(200).json({ success: true, data: { totalUrls, totalClicks } });
});

// @route   DELETE /api/url/:code
const deleteUrl = asyncHandler(async (req, res) => {
  const url = await Url.findOneAndDelete({ urlCode: req.params.code });
  if (!url) {
    res.status(404);
    throw new Error("URL not found");
  }
  res.status(200).json({ success: true, message: "URL deleted successfully" });
});

// @route   PUT /api/url/:code
const updateUrl = asyncHandler(async (req, res) => {
  const { longUrl, expiresAt } = req.body;
  
  const updateData = {};

  if (longUrl !== undefined) {
    const validation = isValidUrl(longUrl);
    if (!validation.valid) {
      res.status(400);
      throw new Error(validation.message);
    }
    updateData.longUrl = validation.normalized;
  }

  if (expiresAt !== undefined) {
    if (expiresAt === null) {
      updateData.expiresAt = null;
    } else {
      const expirationDate = new Date(expiresAt);
      if (isNaN(expirationDate.getTime())) {
        res.status(400);
        throw new Error("Invalid expiration date format");
      }
      if (expirationDate <= new Date()) {
        res.status(400);
        throw new Error("Expiration date must be in the future");
      }
      updateData.expiresAt = expirationDate;
    }
  }

  const url = await Url.findOneAndUpdate(
    { urlCode: req.params.code },
    updateData,
    { new: true }
  );
  
  if (!url) {
    res.status(404);
    throw new Error("URL not found");
  }
  
  res.status(200).json({ success: true, data: url });
});

// @route   GET /api/url/history
const getHistory = asyncHandler(async (req, res) => {
  const urls = await Url.find().sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: urls.length, data: urls });
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
