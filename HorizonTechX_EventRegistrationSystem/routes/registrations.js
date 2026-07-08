// routes/registrations.js
const express = require('express');
const { Registration, Event, User, sequelize } = require('../models');
const { authenticate } = require('../middleware/auth');
const { Op } = require('sequelize');
const { getEventStatus } = require('../utils/eventStatus');

const router = express.Router();

// @desc   List registrations for a specific event (organizer/admin only)
// @route  GET /api/events/:eventId/registrations
// @access Private (organizer or admin)
router.get('/events/:eventId/registrations', authenticate, async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const isEventOrganizer = event.organizerId === req.user.id;
    if (req.user.role !== 'admin' && !isEventOrganizer) {
      return res.status(403).json({ success: false, message: 'Not authorized to view registrations' });
    }

    const { status, page = 1, limit = 20 } = req.query;
    const where = { eventId: event.id };
    if (status) {
      where.status = status;
    } else {
      where.status = { [Op.ne]: 'canceled' };
    }

    const { rows, count } = await Registration.findAndCountAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit, 10),
      offset: (parseInt(page, 10) - 1) * parseInt(limit, 10),
    });

    res.json({
      success: true,
      total: count,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      data: rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// @desc   Register the logged-in user for an event
// @route  POST /api/events/:eventId/register
// @access Private
router.post('/events/:eventId/register', authenticate, async (req, res) => {
  try {
    const result = await sequelize.transaction(async (t) => {
      // Lock the event row to prevent concurrent seat over-booking
      const event = await Event.findByPk(req.params.eventId, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!event) {
        const err = new Error('Event not found');
        err.status = 404;
        throw err;
      }

      const eventStatus = getEventStatus(event);
      if (eventStatus === 'completed') {
        const err = new Error('Registration closed — event has ended');
        err.status = 400;
        throw err;
      }
      if (new Date(event.date) < new Date()) {
        const err = new Error('Registration closed for past events');
        err.status = 400;
        throw err;
      }
      if (event.availableSeats <= 0) {
        const err = new Error('Event is full — no seats available');
        err.status = 400;
        throw err;
      }

      // Duplicate check inside transaction to prevent race conditions
      const existing = await Registration.findOne({
        where: {
          eventId: event.id,
          userId: req.user.id,
          status: { [Op.in]: ['pending', 'confirmed'] },
        },
        transaction: t,
      });
      if (existing) {
        const err = new Error('You are already registered for this event');
        err.status = 409;
        throw err;
      }

      const registration = await Registration.create(
        { eventId: event.id, userId: req.user.id, status: 'confirmed' },
        { transaction: t }
      );

      // Atomically decrement available seats
      event.availableSeats -= 1;
      await event.save({ transaction: t });

      return { registration, seatsRemaining: event.availableSeats };
    });

    res.status(201).json({
      success: true,
      data: result.registration,
      seatsRemaining: result.seatsRemaining,
    });
  } catch (err) {
    const status = err.status || 500;
    const message = status === 500 ? 'Internal Server Error' : err.message;
    console.error(err);
    res.status(status).json({ success: false, message });
  }
});

// @desc   Get the logged-in user's own registrations
// @route  GET /api/users/me/registrations
// @access Private
router.get('/users/me/registrations', authenticate, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const where = { userId: req.user.id };
    if (status) where.status = status;

    const { rows, count } = await Registration.findAndCountAll({
      where,
      include: [{ model: Event, as: 'event' }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit, 10),
      offset: (parseInt(page, 10) - 1) * parseInt(limit, 10),
    });

    res.json({
      success: true,
      total: count,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      data: rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// @desc   Cancel a registration (user cancels their own, admin can cancel any)
// @route  DELETE /api/registrations/:id
// @access Private
router.delete('/registrations/:id', authenticate, async (req, res) => {
  try {
    const result = await sequelize.transaction(async (t) => {
      const registration = await Registration.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
      if (!registration) {
        const err = new Error('Registration not found');
        err.status = 404;
        throw err;
      }
      if (registration.userId !== req.user.id && req.user.role !== 'admin') {
        const err = new Error('Not authorized to cancel this registration');
        err.status = 403;
        throw err;
      }
      if (registration.status === 'canceled') {
        const err = new Error('Registration is already cancelled');
        err.status = 400;
        throw err;
      }

      const previousStatus = registration.status;
      registration.status = 'canceled';
      await registration.save({ transaction: t });

      // Only restore the seat if the registration was active (not already pending/something else)
      let seatsRemaining = null;
      if (previousStatus === 'confirmed') {
        const event = await Event.findByPk(registration.eventId, { transaction: t, lock: t.LOCK.UPDATE });
        if (event && event.availableSeats < event.capacity) {
          event.availableSeats += 1;
          await event.save({ transaction: t });
          seatsRemaining = event.availableSeats;
        }
      }

      return { seatsRemaining };
    });

    res.json({
      success: true,
      message: 'Registration cancelled',
      seatsRemaining: result.seatsRemaining,
    });
  } catch (err) {
    const status = err.status || 500;
    const message = status === 500 ? 'Internal Server Error' : err.message;
    console.error(err);
    res.status(status).json({ success: false, message });
  }
});

module.exports = router;
