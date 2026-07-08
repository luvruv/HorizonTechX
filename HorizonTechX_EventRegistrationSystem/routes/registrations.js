// routes/registrations.js
const express = require('express');
const { Registration, Event, User } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Register logged-in user for an event
router.post('/events/:eventId/register', authenticate, async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    // Check capacity
    const count = await Registration.count({ where: { eventId: event.id, status: 'confirmed' } });
    if (event.capacity && count >= event.capacity) {
      return res.status(400).json({ message: 'Event is full' });
    }
    // Prevent duplicate registration
    const existing = await Registration.findOne({ where: { eventId: event.id, userId: req.user.id } });
    if (existing) return res.status(409).json({ message: 'Already registered' });

    const registration = await Registration.create({ eventId: event.id, userId: req.user.id, status: 'confirmed' });
    res.status(201).json(registration);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user's registrations
router.get('/users/me/registrations', authenticate, async (req, res) => {
  try {
    const registrations = await Registration.findAll({ where: { userId: req.user.id }, include: [{ model: Event }] });
    res.json(registrations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel a registration (owner or admin)
router.delete('/registrations/:id', authenticate, async (req, res) => {
  try {
    const registration = await Registration.findByPk(req.params.id);
    if (!registration) return res.status(404).json({ message: 'Registration not found' });
    if (registration.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to cancel this registration' });
    }
    await registration.destroy();
    res.json({ message: 'Registration cancelled' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
