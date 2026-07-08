// utils/userAgent.js

function parseUserAgent(uaString) {
  if (!uaString) {
    return { browser: 'Unknown', os: 'Unknown' };
  }

  let browser = 'Unknown Browser';
  let os = 'Unknown OS';

  // Parse OS
  if (/windows/i.test(uaString)) {
    os = 'Windows';
  } else if (/macintosh|mac os x/i.test(uaString)) {
    os = 'macOS';
  } else if (/iphone|ipad|ipod/i.test(uaString)) {
    os = 'iOS';
  } else if (/android/i.test(uaString)) {
    os = 'Android';
  } else if (/linux/i.test(uaString)) {
    os = 'Linux';
  }

  // Parse Browser
  if (/opr\/|opera/i.test(uaString)) {
    browser = 'Opera';
  } else if (/edg/i.test(uaString)) {
    browser = 'Microsoft Edge';
  } else if (/chrome|crios/i.test(uaString)) {
    // Chrome UA also contains Safari, so check chrome first
    browser = 'Google Chrome';
  } else if (/firefox|fxios/i.test(uaString)) {
    browser = 'Mozilla Firefox';
  } else if (/safari/i.test(uaString)) {
    browser = 'Safari';
  } else if (/msie|trident/i.test(uaString)) {
    browser = 'Internet Explorer';
  }

  return { browser, os };
}

module.exports = { parseUserAgent };
