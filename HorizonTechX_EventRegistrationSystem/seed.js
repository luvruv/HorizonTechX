require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User, Event } = require('./models');

async function seed() {
  try {
    await sequelize.sync({ alter: true });

    const adminEmail = 'admin@example.com';
    let admin = await User.findOne({ where: { email: adminEmail } });
    if (!admin) {
      admin = await User.create({
        name: 'Admin User',
        email: adminEmail,
        role: 'admin',
        passwordHash: await bcrypt.hash('admin123', 10),
      });
      console.log('Created admin user: admin@example.com / admin123');
    }

    const organizerEmail = 'organizer@example.com';
    let organizer = await User.findOne({ where: { email: organizerEmail } });
    if (!organizer) {
      organizer = await User.create({
        name: 'Event Organizer',
        email: organizerEmail,
        role: 'organizer',
        passwordHash: await bcrypt.hash('organizer123', 10),
      });
      console.log('Created organizer user: organizer@example.com / organizer123');
    }

    const eventCount = await Event.count();
    if (eventCount === 0) {
      await Event.create({
        title: 'Tech Conference 2026',
        description: 'Annual technology conference with workshops and keynotes.',
        location: 'Convention Center, Mumbai',
        date: new Date('2026-12-15T10:00:00'),
        capacity: 100,
        availableSeats: 100,
        organizerId: organizer.id,
      });
      console.log('Created sample event');
    }

    console.log('Seed completed');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();
