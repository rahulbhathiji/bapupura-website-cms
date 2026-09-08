const express = require('express');
const router = express.Router();
const sliderController = require('../controllers/sliderController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', sliderController.getSliders);
router.patch('/reorder', protect, authorize('editor', 'site_admin', 'admin', 'super_admin'), sliderController.reorderSliders);
router.post('/', protect, authorize('editor', 'site_admin', 'admin', 'super_admin'), sliderController.createSlider);
router.put('/:id', protect, authorize('editor', 'site_admin', 'admin', 'super_admin'), sliderController.updateSlider);
router.delete('/:id', protect, authorize('site_admin', 'admin', 'super_admin'), sliderController.deleteSlider);

module.exports = router;
