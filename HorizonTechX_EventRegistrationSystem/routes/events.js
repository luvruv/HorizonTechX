// routes/events.js
const express = require('express');
const { Event } = require('../models');
const { authenticate } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');
const { isOrganizer } = require('../middleware/organizer');
const { Op } = require('sequelize');

const router = express.Router();

// Get all events (public) with optional search, sort, pagination
router.get('/', async (req, res) => {
  try {
    const { search, sort, page = 1, limit = 10 } = req.query;
    const where = {};
    if (search) {
      where.title = { [Op.iLike]: `%${search}%` };
    }
    const order = [];
    if (sort === 'newest') order.push(['createdAt', 'DESC']);
    else if (sort === 'oldest') order.push(['createdAt', 'ASC']);
    else if (sort === 'upcoming') order.push(['date', 'ASC']);

    const events = await Event.findAndCountAll({
      where,
      order,
      limit: parseInt(limit),
      offset: (page - 1) * limit,
    });
    res.json({
      total: events.count,
      page: parseInt(page),
      limit: parseInt(limit),
      data: events.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get event details by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new event (organizer or admin)
router.post('/', authenticate, isOrganizer, async (req, res) => {
  try {
    const eventData = {
      ...req.body,
      organizerId: req.user.id,
    };
    const event = await Event.create(eventData);
    res.status(201).json(event);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Invalid data', error: err.message });
  }
});

// Update an event (organizer can update own events, admin any)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    // Authorization: admin or owner
    if (req.user.role !== 'admin' && event.organizerId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await event.update(req.body);
    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Invalid data', error: err.message });
  }
});

// Delete an event (admin only)
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    await event.destroy();
    res.json({ message: 'Event deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Organizer view their own events
router.get('/my-events', authenticate, isOrganizer, async (req, res) => {
  try {
    const events = await Event.findAll({ where: { organizerId: req.user.id } });
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
const express = require('express');
const { Event } = require('../models');
const { authenticate } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');

const router = express.Router();

// Get all events (public)
router.get('/', async (req, res) => {
  try {
    const events = await Event.findAll();
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get event details by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new event (admin only)
router.post('/', authenticate, isAdmin, async (req, res) => {
  try {
    const event = await Event.create(req.body);
    res.status(201).json(event);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Invalid data', error: err.message });
  }
});

// Update an event (admin only)
router.put('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    await event.update(req.body);
    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Invalid data', error: err.message });
  }
});

// Delete an event (admin only)
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    await event.destroy();
    res.json({ message: 'Event deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
