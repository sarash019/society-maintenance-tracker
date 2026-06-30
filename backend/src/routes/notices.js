const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { createNotice, getNotices, deleteNotice } = require('../controllers/noticeController');

router.get('/', authenticate, getNotices);
router.post('/', authenticate, requireRole('admin'), createNotice);
router.delete('/:id', authenticate, requireRole('admin'), deleteNotice);

module.exports = router;
