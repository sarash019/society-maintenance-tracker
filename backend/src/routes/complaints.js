const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  createComplaint, getMyComplaints, getAllComplaints,
  updateComplaint, markOverdue, updateOverdueSetting, getDashboard
} = require('../controllers/complaintController');

// Resident routes
router.post('/', authenticate, requireRole('resident'), upload.single('photo'), createComplaint);
router.get('/my', authenticate, requireRole('resident'), getMyComplaints);

// Admin routes
router.get('/', authenticate, requireRole('admin'), getAllComplaints);
router.patch('/:id', authenticate, requireRole('admin'), updateComplaint);
router.patch('/:id/overdue', authenticate, requireRole('admin'), markOverdue);
router.get('/dashboard/stats', authenticate, requireRole('admin'), getDashboard);
router.put('/settings/overdue', authenticate, requireRole('admin'), updateOverdueSetting);

module.exports = router;
