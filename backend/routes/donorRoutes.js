const express = require('express');
const router = express.Router();
const donorController = require('../controllers/donorController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', donorController.getDonors);

router.post('/bulk-import', protect, authorize('editor', 'site_admin', 'admin', 'super_admin'), donorController.bulkImportDonors);

router.get('/:id', donorController.getDonorById);
router.post('/', protect, authorize('editor', 'site_admin', 'admin', 'super_admin'), donorController.createDonor);
router.put('/:id', protect, authorize('editor', 'site_admin', 'admin', 'super_admin'), donorController.updateDonor);
router.delete('/:id', protect, authorize('site_admin', 'admin', 'super_admin'), donorController.deleteDonor);

module.exports = router;
