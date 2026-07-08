const { Op } = require('sequelize');
const sequelize = require('../config/db');
const { Reservation, Table } = require('../models');

const RESERVATION_WINDOW_MS = 2 * 60 * 60 * 1000;

async function createReservation({ userId, tableId, reservationTime, guestCount = 1 }) {
  return sequelize.transaction(async (t) => {
    const table = await Table.findByPk(tableId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!table) {
      const err = new Error('Table not found');
      err.statusCode = 404;
      throw err;
    }
    if (table.capacity < guestCount) {
      const err = new Error(`Table capacity (${table.capacity}) is too small for ${guestCount} guests`);
      err.statusCode = 400;
      throw err;
    }
    if (table.status === 'OCCUPIED') {
      const err = new Error('Table is currently occupied and cannot be reserved');
      err.statusCode = 400;
      throw err;
    }

    const start = new Date(reservationTime);
    if (isNaN(start.getTime())) {
      const err = new Error('Invalid reservation time');
      err.statusCode = 400;
      throw err;
    }
    if (start < new Date()) {
      const err = new Error('Cannot book a reservation in the past');
      err.statusCode = 400;
      throw err;
    }

    const end = new Date(start.getTime() + RESERVATION_WINDOW_MS);

    const tableConflict = await Reservation.findOne({
      where: {
        tableId,
        status: { [Op.in]: ['PENDING', 'CONFIRMED'] },
        reservationTime: {
          [Op.between]: [
            new Date(start.getTime() - RESERVATION_WINDOW_MS),
            end,
          ],
        },
      },
      transaction: t,
    });
    if (tableConflict) {
      const err = new Error('Table is already reserved for this time slot');
      err.statusCode = 409;
      throw err;
    }

    const userDuplicate = await Reservation.findOne({
      where: {
        userId,
        tableId,
        status: { [Op.in]: ['PENDING', 'CONFIRMED'] },
        reservationTime: {
          [Op.between]: [
            new Date(start.getTime() - RESERVATION_WINDOW_MS),
            end,
          ],
        },
      },
      transaction: t,
    });
    if (userDuplicate) {
      const err = new Error('You already have a booking for this table at this time');
      err.statusCode = 409;
      throw err;
    }

    const reservation = await Reservation.create(
      {
        userId,
        tableId,
        reservationTime: start,
        guestCount,
        status: 'CONFIRMED',
      },
      { transaction: t }
    );

    table.status = 'RESERVED';
    await table.save({ transaction: t });

    return Reservation.findByPk(reservation.id, {
      include: [{ model: Table, as: 'table' }],
      transaction: t,
    });
  });
}

async function getReservationById(id) {
  return Reservation.findByPk(id, {
    include: [{ model: Table, as: 'table' }],
  });
}

async function getAllReservations(filter = {}) {
  return Reservation.findAll({
    where: filter,
    include: [{ model: Table, as: 'table' }],
    order: [['reservationTime', 'ASC']],
  });
}

async function cancelReservation(id) {
  return sequelize.transaction(async (t) => {
    const reservation = await Reservation.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!reservation) return null;

    reservation.status = 'CANCELLED';
    await reservation.save({ transaction: t });

    const activeOnTable = await Reservation.count({
      where: {
        tableId: reservation.tableId,
        status: { [Op.in]: ['PENDING', 'CONFIRMED'] },
        id: { [Op.ne]: reservation.id },
      },
      transaction: t,
    });

    if (activeOnTable === 0) {
      const table = await Table.findByPk(reservation.tableId, { transaction: t });
      if (table && table.status === 'RESERVED') {
        table.status = 'AVAILABLE';
        await table.save({ transaction: t });
      }
    }

    return reservation;
  });
}

module.exports = {
  createReservation,
  getReservationById,
  getAllReservations,
  cancelReservation,
};
