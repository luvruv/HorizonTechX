require(\'dotenv\').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { sequelize } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const apiRouter = require('./routes/api');
const reservationsRouter = require('./routes/reservations');
const inventoryRouter = require('./routes/inventory');

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use('/api', apiRouter);
app.use('/api/reservations', reservationsRouter);
app.use('/api/inventory', inventoryRouter);
app.use(errorHandler);
app.get('/', (req, res) => res.send('Restaurant Management API'));
const PORT = process.env.PORT || 3000;
(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected');
    await sequelize.sync({ alter: true }); // dev sync
    app.listen(PORT, () => console.log(Server listening on port ));
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();
