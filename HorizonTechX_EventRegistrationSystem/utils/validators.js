/**
 * Validates an email string.
 * Returns an error message string, or null if valid.
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') return 'Email is required';
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email.trim())) return 'Invalid email format';
  return null;
}

/**
 * Validates a password for strength.
 * Requires: ≥8 chars, 1 uppercase, 1 digit, 1 special character.
 * Returns an error message string, or null if valid.
 */
function validatePassword(password) {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one digit';
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password))
    return 'Password must contain at least one special character';
  return null;
}

/**
 * Validates event creation/update body fields.
 * Returns an array of error strings (empty if valid).
 */
function validateEventInput(body) {
  const errors = [];
  if (!body.title || !String(body.title).trim()) errors.push('Title is required');
  if (!body.date) errors.push('Event date is required');
  else if (isNaN(new Date(body.date).getTime())) errors.push('Invalid event date');
  if (!body.location || !String(body.location).trim()) errors.push('Venue/location is required');
  if (body.capacity !== undefined) {
    const cap = Number(body.capacity);
    if (!Number.isInteger(cap) || cap < 1) errors.push('Capacity must be a positive integer');
  }
  return errors;
}

/**
 * Validates that a capacity reduction does not go below the number of confirmed registrations.
 * Returns an error string, or null if valid.
 */
function validateCapacityChange(currentCapacity, newCapacity, confirmedCount) {
  if (newCapacity < confirmedCount) {
    return `Cannot reduce capacity to ${newCapacity} — there are already ${confirmedCount} confirmed registrations`;
  }
  return null;
}

module.exports = { validateEmail, validatePassword, validateEventInput, validateCapacityChange };

