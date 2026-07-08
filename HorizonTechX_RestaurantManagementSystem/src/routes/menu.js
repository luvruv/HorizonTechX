const express = require('express');
const router = express.Router();
const { getAll, getOne, create, update, remove, search, filterByCategory } = require('../controllers/menuController');
const asyncWrapper = require('../middleware/asyncWrapper');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.get('/search', asyncWrapper(search));
router.get('/category/:categoryId', asyncWrapper(filterByCategory));

router
  .route('/')
  .get(asyncWrapper(getAll))
  .post(protect, restrictTo('admin', 'manager'), asyncWrapper(create));

router
  .route('/:id')
  .get(asyncWrapper(getOne))
  .patch(protect, restrictTo('admin', 'manager'), asyncWrapper(update))
  .delete(protect, restrictTo('admin', 'manager'), asyncWrapper(remove));

module.exports = router;
