// src/controllers/reservationController.js
const asyncWrapper = require('../middleware/asyncWrapper');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { createReservation, getReservationById, getAllReservations, cancelReservation } = require('../services/reservationService');

// Customer creates a reservation
exports.create = asyncWrapper(async (req, res) => {
  const { tableId, reservationTime, guestCount } = req.body;
  const userId = req.user.id;
  const reservation = await createReservation({ userId, tableId, reservationTime, guestCount });
  res.status(201).json({ status: 'success', data: { reservation } });
});

// Get a single reservation (owner or admin/manager)
exports.getOne = asyncWrapper(async (req, res) => {
  const reservation = await getReservationById(req.params.id);
  if (!reservation) return res.status(404).json({ status: 'fail', message: 'Reservation not found' });
  if (reservation.userId !== req.user.id && !['admin', 'manager'].includes(req.user.role)) {
    return res.status(403).json({ status: 'fail', message: 'Forbidden' });
  }
  res.status(200).json({ status: 'success', data: { reservation } });
});

// Get all reservations (admin/manager) or own reservations (customer)
exports.getAll = asyncWrapper(async (req, res) => {
  let reservations;
  if (['admin', 'manager'].includes(req.user.role)) {
    reservations = await getAllReservations();
  } else {
    reservations = await getAllReservations({ userId: req.user.id });
  }
  res.status(200).json({ status: 'success', results: reservations.length, data: { reservations } });
});

// Cancel a reservation (owner or admin/manager)
exports.cancel = asyncWrapper(async (req, res) => {
  const reservation = await getReservationById(req.params.id);
  if (!reservation) return res.status(404).json({ status: 'fail', message: 'Reservation not found' });
  if (reservation.userId !== req.user.id && !['admin', 'manager'].includes(req.user.role)) {
    return res.status(403).json({ status: 'fail', message: 'Forbidden' });
  }
  await cancelReservation(req.params.id);
  res.status(200).json({ status: 'success', message: 'Reservation cancelled' });
});
