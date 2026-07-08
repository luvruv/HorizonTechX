const mongoose = require("mongoose");

const urlSchema = new mongoose.Schema(
    {
        urlCode: {
            type: String,
            required: true,
            unique: true,
            index: true
        },

        longUrl: {
            type: String,
            required: true
        },

        shortUrl: {
            type: String,
            required: true
        },

        clicks: {
            type: Number,
            default: 0
        },
        // Optional custom alias (urlCode) if user provides
        alias: {
            type: String,
            unique: true,
            sparse: true
        },
        // Optional expiration date for the shortened URL
        expiresAt: {
            type: Date,
            default: null
        },
        // QR Code image data URL for the short URL
        qrCode: {
            type: String
        },
        // Analytics fields
        lastVisited: {
            type: Date,
            default: null
        },
        analytics: [
            {
                timestamp: {
                    type: Date,
                    default: Date.now
                },
                ip: {
                    type: String
                },
                userAgent: {
                    type: String
                },
                referrer: {
                    type: String
                },
                browser: {
                    type: String
                },
                os: {
                    type: String
                }
            }
        ]
    },
    {
        timestamps: true
    });

module.exports = mongoose.model("Url", urlSchema);
