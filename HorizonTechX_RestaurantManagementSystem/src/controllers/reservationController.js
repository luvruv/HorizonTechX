// src/controllers/reservationController.js
const asyncWrapper = require('../middleware/asyncWrapper');
const {
  createReservation,
  getReservationById,
  getAllReservations,
  cancelReservation,
} = require('../services/reservationService');

// @desc   Customer creates a reservation
// @route  POST /api/reservations
// @access Private
exports.create = asyncWrapper(async (req, res) => {
  const { tableId, reservationTime, guestCount } = req.body;

  // Input validation
  if (!tableId) {
    return res.status(400).json({ status: 'fail', message: 'tableId is required' });
  }
  if (!reservationTime) {
    return res.status(400).json({ status: 'fail', message: 'reservationTime is required' });
  }
  if (isNaN(new Date(reservationTime).getTime())) {
    return res.status(400).json({ status: 'fail', message: 'reservationTime must be a valid ISO date string' });
  }
  if (new Date(reservationTime) < new Date()) {
    return res.status(400).json({ status: 'fail', message: 'reservationTime must be in the future' });
  }
  if (guestCount !== undefined) {
    const guests = Number(guestCount);
    if (!Number.isInteger(guests) || guests < 1) {
      return res.status(400).json({ status: 'fail', message: 'guestCount must be a positive integer' });
    }
  }

  const userId = req.user.id;
  const reservation = await createReservation({ userId, tableId, reservationTime, guestCount });
  res.status(201).json({ status: 'success', data: { reservation } });
});

// @desc   Get a single reservation (owner or admin/manager)
// @route  GET /api/reservations/:id
// @access Private
exports.getOne = asyncWrapper(async (req, res) => {
  const reservation = await getReservationById(req.params.id);
  if (!reservation) {
    return res.status(404).json({ status: 'fail', message: 'Reservation not found' });
  }
  if (reservation.userId !== req.user.id && !['admin', 'manager'].includes(req.user.role)) {
    return res.status(403).json({ status: 'fail', message: 'Forbidden' });
  }
  res.status(200).json({ status: 'success', data: { reservation } });
});

// @desc   Get all reservations (admin/manager) or own reservations (customer)
// @route  GET /api/reservations
// @access Private
exports.getAll = asyncWrapper(async (req, res) => {
  let reservations;
  if (['admin', 'manager'].includes(req.user.role)) {
    reservations = await getAllReservations();
  } else {
    reservations = await getAllReservations({ userId: req.user.id });
  }
  res.status(200).json({
    status: 'success',
    results: reservations.length,
    data: { reservations },
  });
});

// @desc   Cancel a reservation (owner or admin/manager)
// @route  DELETE /api/reservations/:id/cancel
// @access Private
exports.cancel = asyncWrapper(async (req, res) => {
  const reservation = await getReservationById(req.params.id);

  if (!reservation) {
    return res.status(404).json({ status: 'fail', message: 'Reservation not found' });
  }
  if (reservation.userId !== req.user.id && !['admin', 'manager'].includes(req.user.role)) {
    return res.status(403).json({ status: 'fail', message: 'Forbidden' });
  }
  if (reservation.status === 'CANCELLED') {
    return res.status(400).json({ status: 'fail', message: 'Reservation is already cancelled' });
  }
  if (reservation.status === 'COMPLETED') {
    return res.status(400).json({ status: 'fail', message: 'Cannot cancel a completed reservation' });
  }

  await cancelReservation(req.params.id);
  res.status(200).json({ status: 'success', message: 'Reservation cancelled successfully' });
});
