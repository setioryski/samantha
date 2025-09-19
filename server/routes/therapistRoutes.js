const express = require('express');
const router = express.Router();
const {
    getTherapists,
    getActiveTherapists,
    createTherapist,
    updateTherapist,
    deleteTherapist,
    getTherapistReport
} = require('../controllers/therapistController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, isAdmin, getTherapists)
    .post(protect, createTherapist);

router.get('/active', protect, getActiveTherapists);
router.get('/report', protect, isAdmin, getTherapistReport); // <-- Add this line

router.route('/:id')
    .put(protect, isAdmin, updateTherapist)
    .delete(protect, isAdmin, deleteTherapist);

module.exports = router;