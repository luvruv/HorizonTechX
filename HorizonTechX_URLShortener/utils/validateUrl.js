// utils/validateUrl.js

function isValidUrl(string) {
  if (!string || typeof string !== 'string' || !string.trim()) {
    return { valid: false, message: 'URL is required and cannot be empty' };
  }

  const trimmed = string.trim();

  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    
    if (!['http:', 'https:'].includes(url.protocol)) {
      return { valid: false, message: 'URL must use http or https protocol' };
    }
    
    const hostname = url.hostname.toLowerCase();
    if (!hostname) {
      return { valid: false, message: 'URL must contain a valid hostname' };
    }

    // SSRF Prevention: Block loopback and local/private addresses
    const privateHosts = ['localhost', '127.0.0.1', '::1', '0.0.0.0'];
    if (privateHosts.includes(hostname)) {
      return { valid: false, message: 'Shortening local or loopback addresses is not allowed for security reasons' };
    }

    // SSRF Prevention: Block common private IP subnet patterns
    // e.g. 10.x.x.x, 192.168.x.x, 172.16.x.x - 172.31.x.x
    const isPrivateIp = 
      /^10\./.test(hostname) ||
      /^192\.168\./.test(hostname) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname);
    if (isPrivateIp) {
      return { valid: false, message: 'Shortening private IP addresses is not allowed for security reasons' };
    }

    // Prevent Infinite Loop: Cannot shorten URLs pointing to the shortener itself
    const baseUrlString = process.env.BASE_URL || 'http://localhost:5000';
    try {
      const baseUrlObj = new URL(baseUrlString);
      if (url.host.toLowerCase() === baseUrlObj.host.toLowerCase()) {
        return { valid: false, message: 'Cannot shorten a URL pointing to this shortener service' };
      }
    } catch (e) {
      // If BASE_URL is invalid, fall back gracefully
    }

    // Basic TLD validation: ensure hostname contains at least one dot and has a reasonable TLD (unless it is a valid IP)
    const ipPattern = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    if (!ipPattern.test(hostname) && !hostname.includes('.')) {
      return { valid: false, message: 'URL must contain a valid domain name with a TLD (e.g. domain.com)' };
    }

    return { valid: true, normalized: url.href };
  } catch {
    return { valid: false, message: 'Invalid URL format. Please provide a valid web address' };
  }
}

module.exports = { isValidUrl };
