// routes/events.js
const express = require('express');
const { Event, Registration, sequelize } = require('../models');
const { authenticate } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');
const { isOrganizer } = require('../middleware/organizer');
const { Op } = require('sequelize');
const { formatEvent, getEventStatus } = require('../utils/eventStatus');
const { validateEventInput, validateCapacityChange } = require('../utils/validators');

const router = express.Router();

// @desc   List events with search, filter, sort, and pagination
// @route  GET /api/events
// @access Public
router.get('/', async (req, res) => {
  try {
    const { search, venue, date, status, sort, page = 1, limit = 10 } = req.query;
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

    const where = {};

    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }
    if (venue) {
      where.location = { [Op.like]: `%${venue}%` };
    }
    if (date) {
      const dayStart = new Date(date);
      if (isNaN(dayStart.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid date format' });
      }
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      where.date = { [Op.between]: [dayStart, dayEnd] };
    }

    // status filter: 'upcoming' → date > now, 'completed' → date < now-3h, 'ongoing' → between
    if (status === 'upcoming') {
      where.date = { ...(where.date || {}), [Op.gt]: new Date() };
    } else if (status === 'completed') {
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
      where.date = { ...(where.date || {}), [Op.lt]: threeHoursAgo };
    } else if (status === 'ongoing') {
      const now = new Date();
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
      where.date = { [Op.between]: [threeHoursAgo, now] };
    }

    const order = [];
    if (sort === 'newest') order.push(['createdAt', 'DESC']);
    else if (sort === 'oldest') order.push(['createdAt', 'ASC']);
    else if (sort === 'seats') order.push(['availableSeats', 'DESC']);
    else order.push(['date', 'ASC']); // default: soonest first

    const { rows, count } = await Event.findAndCountAll({
      where,
      order,
      limit: parsedLimit,
      offset: (parsedPage - 1) * parsedLimit,
    });

    res.json({
      success: true,
      total: count,
      page: parsedPage,
      limit: parsedLimit,
      pages: Math.ceil(count / parsedLimit),
      data: rows.map(formatEvent),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// @desc   Get organizer's own events
// @route  GET /api/events/my-events
// @access Private (organizer or admin)
router.get('/my-events', authenticate, isOrganizer, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

    const { rows, count } = await Event.findAndCountAll({
      where: { organizerId: req.user.id },
      order: [['date', 'ASC']],
      limit: parsedLimit,
      offset: (parsedPage - 1) * parsedLimit,
    });

    res.json({
      success: true,
      total: count,
      page: parsedPage,
      limit: parsedLimit,
      data: rows.map(formatEvent),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// @desc   Get a single event
// @route  GET /api/events/:id
// @access Public
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, data: formatEvent(event) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// @desc   Create a new event
// @route  POST /api/events
// @access Private (organizer or admin)
router.post('/', authenticate, isOrganizer, async (req, res) => {
  try {
    const errors = validateEventInput(req.body);
    if (errors.length) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    // Prevent creating events in the past
    if (new Date(req.body.date) < new Date()) {
      return res.status(400).json({ success: false, message: 'Event date must be in the future' });
    }

    const eventData = {
      ...req.body,
      organizerId: req.user.id,
      availableSeats: req.body.capacity,
    };
    const event = await Event.create(eventData);
    res.status(201).json({ success: true, data: formatEvent(event) });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, message: 'Invalid data', error: err.message });
  }
});

// @desc   Update an event (organizer can edit their own; admin can edit any)
// @route  PUT /api/events/:id
// @access Private (organizer or admin)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    if (req.user.role !== 'admin' && event.organizerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this event' });
    }

    const merged = { ...event.toJSON(), ...req.body };
    const errors = validateEventInput(merged);
    if (errors.length) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    // Guard: if capacity is being reduced, check against confirmed registrations
    if (req.body.capacity !== undefined) {
      const newCapacity = parseInt(req.body.capacity, 10);
      if (newCapacity !== event.capacity) {
        const confirmedCount = await Registration.count({
          where: { eventId: event.id, status: { [Op.in]: ['confirmed', 'pending'] } },
        });
        const capacityError = validateCapacityChange(event.capacity, newCapacity, confirmedCount);
        if (capacityError) {
          return res.status(400).json({ success: false, message: capacityError });
        }
        // Adjust availableSeats proportionally (seats gained or lost)
        req.body.availableSeats = event.availableSeats + (newCapacity - event.capacity);
      }
    }

    await event.update(req.body);
    res.json({ success: true, data: formatEvent(event) });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, message: 'Invalid data', error: err.message });
  }
});

// @desc   Delete an event (admin only)
// @route  DELETE /api/events/:id
// @access Private (admin)
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    // Check for active registrations before deleting
    const activeCount = await Registration.count({
      where: { eventId: event.id, status: { [Op.in]: ['confirmed', 'pending'] } },
    });
    if (activeCount > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete event with ${activeCount} active registration(s). Cancel them first.`,
      });
    }

    await event.destroy();
    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

module.exports = router;
